import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.db.models import Base

# Determine database URL
raw_db_url = settings.DATABASE_URL.strip() if settings.DATABASE_URL else ""

# Ensure backend directory exists for SQLite fallback
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
SQLITE_DB_PATH = BACKEND_DIR / "lsr_local.db"

if raw_db_url and raw_db_url.startswith("postgresql"):
    # Standard PostgreSQL connection (Supabase)
    SQLALCHEMY_DATABASE_URL = raw_db_url
    connect_args = {}
else:
    # Safe local SQLite fallback
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{SQLITE_DB_PATH}"
    connect_args = {"check_same_thread": False}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

# Ensure tables exist
Base.metadata.create_all(bind=engine)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI database session dependency."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
