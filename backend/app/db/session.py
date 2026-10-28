import os
import logging
from pathlib import Path
from urllib.parse import urlparse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger(__name__)

# Determine backend base directory for local SQLite storage
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
SQLITE_DB_PATH = BACKEND_DIR / "lsr_local.db"

raw_db_url = settings.DATABASE_URL.strip() if settings.DATABASE_URL else ""

import re
from urllib.parse import urlparse, quote

def normalize_postgres_url(raw_url: str) -> str:
    """Normalize postgres URL to postgresql+psycopg2 and properly escape special chars in passwords."""
    url = raw_url.strip()
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg2://", 1)

    # If the password was wrapped in brackets like postgres:[password]@host (common Supabase copy-paste pattern)
    bracket_match = re.match(r"^(postgresql\+psycopg2:\/\/[^:]+):\[(.*?)\]@(.+)$", url)
    if bracket_match:
        prefix, pwd, rest = bracket_match.groups()
        encoded_pwd = quote(pwd, safe="")
        url = f"{prefix}:{encoded_pwd}@{rest}"
    return url

# Detect explicit database driver
if not raw_db_url or raw_db_url.startswith("sqlite"):
    # Explicit SQLite configuration (for local development or automated tests)
    SQLALCHEMY_DATABASE_URL = raw_db_url if raw_db_url else f"sqlite:///{SQLITE_DB_PATH}"
    connect_args = {"check_same_thread": False}
    DB_TYPE = "sqlite"
    logger.info(f"[Database] Using SQLite: {SQLALCHEMY_DATABASE_URL}")
elif raw_db_url.startswith("postgresql") or raw_db_url.startswith("postgres"):
    # Explicit PostgreSQL configuration (Supabase)
    SQLALCHEMY_DATABASE_URL = normalize_postgres_url(raw_db_url)
    connect_args = {}
    DB_TYPE = "postgresql"

    # Log sanitized connection host (never log credentials)
    try:
        parsed = urlparse(SQLALCHEMY_DATABASE_URL)
        sanitized_host = f"{parsed.hostname or 'unknown'}:{parsed.port or 5432}{parsed.path}"
        logger.info(f"[Database] PostgreSQL explicitly configured: {parsed.scheme}://***@{sanitized_host}")
    except Exception:
        logger.info("[Database] PostgreSQL explicitly configured (custom host format)")
else:
    raise ValueError(f"Unsupported database scheme in DATABASE_URL: {raw_db_url[:20]}...")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI database session dependency."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verify_database_connection():
    """
    Actively checks the configured database connection and reports status.
    Prevents silent fallback to SQLite when PostgreSQL is configured.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            return {
                "status": "connected",
                "db_type": DB_TYPE,
            }
    except Exception as e:
        if DB_TYPE == "postgresql":
            try:
                parsed = urlparse(SQLALCHEMY_DATABASE_URL)
                sanitized_target = f"{parsed.hostname or 'unknown'}:{parsed.port or 5432}{parsed.path}"
            except Exception:
                sanitized_target = "configured PostgreSQL host"
            error_msg = (
                f"[Database Connection Error] Failed to connect to PostgreSQL at '{sanitized_target}': {e}\n"
                f"Silent fallback to SQLite is disabled because PostgreSQL is explicitly configured in DATABASE_URL.\n"
                f"Actions:\n"
                f"1. To connect to Supabase PostgreSQL, set DATABASE_URL in backend/.env to your real Supabase connection string.\n"
                f"2. To use local SQLite for development or tests, set DATABASE_URL='sqlite:///lsr_local.db' or leave DATABASE_URL empty."
            )
            logger.error(error_msg)
            raise ConnectionError(error_msg) from e
        raise
