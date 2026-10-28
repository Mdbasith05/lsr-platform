import pytest
from unittest.mock import patch
from sqlalchemy import create_engine
from app.db.session import verify_database_connection, DB_TYPE, SQLITE_DB_PATH
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


def test_sqlite_explicit_connection():
    """Verify that SQLite connection succeeds cleanly for local development/testing."""
    with patch("app.db.session.DB_TYPE", "sqlite"):
        with patch("app.db.session.SQLALCHEMY_DATABASE_URL", f"sqlite:///{SQLITE_DB_PATH}"):
            with patch("app.db.session.engine", create_engine(f"sqlite:///{SQLITE_DB_PATH}", connect_args={"check_same_thread": False})):
                status = verify_database_connection()
                assert status["status"] == "connected"
                assert status["db_type"] == "sqlite"


def test_prevent_silent_sqlite_fallback_on_postgres_failure():
    """Verify that when PostgreSQL is configured but fails to connect, silent SQLite fallback is prevented."""
    # Mock unreachable postgres URL
    unreachable_pg_url = "postgresql+psycopg2://postgres:wrong_password@127.0.0.1:59999/postgres"
    with patch("app.db.session.DB_TYPE", "postgresql"):
        with patch("app.db.session.SQLALCHEMY_DATABASE_URL", unreachable_pg_url):
            with patch("app.db.session.engine", create_engine(unreachable_pg_url, pool_pre_ping=False)):
                with pytest.raises(ConnectionError) as exc_info:
                    verify_database_connection()
                assert "Failed to connect to PostgreSQL at '127.0.0.1:59999/postgres'" in str(exc_info.value)
                assert "Silent fallback to SQLite is disabled" in str(exc_info.value)


def test_sqlalchemy_models_metadata():
    """Verify that all 8 core legal models are registered with Base metadata."""
    tables = Base.metadata.tables
    expected_tables = [
        "profiles",
        "cases",
        "properties",
        "documents",
        "document_pages",
        "scrutiny_findings",
        "case_queries",
        "lsr_reports",
    ]
    for table_name in expected_tables:
        assert table_name in tables, f"Expected table {table_name} missing from metadata"

    # Verify PropertyModel 1-to-1 unique constraint on case_id
    prop_case_id_col = tables["properties"].columns["case_id"]
    assert prop_case_id_col.unique or any(
        cons.columns.contains(prop_case_id_col)
        for cons in tables["properties"].constraints
        if hasattr(cons, "columns") and len(cons.columns) == 1
    )
