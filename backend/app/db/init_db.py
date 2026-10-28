from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.db.models import (
    Base,
    ProfileModel,
    CaseModel,
    PropertyModel,
    DocumentModel,
    DocumentPageModel,
    ScrutinyFindingModel,
    CaseQueryModel,
    LSRReportModel,
)
from app.db.session import engine, SessionLocal, verify_database_connection


def init_db():
    """Initializes tables and seeds initial authentic data if empty."""
    # Actively verify connectivity (raises clear error without silent SQLite fallback)
    verify_database_connection()

    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # In clean initial product state, profiles and cases are identity-driven.
        # No default or hardcoded advocate profile is silently created.
        db.commit()
    finally:
        db.close()
