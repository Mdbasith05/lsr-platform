import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Verify root endpoint returns app metadata and docs links."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "app" in data
    assert "version" in data
    assert data["docs"] == "/docs"
    assert data["health"] == "/health"


def test_health_root_endpoint():
    """Verify top-level /health endpoint returns 200 OK and expected schema."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "app_name" in data
    assert "version" in data
    assert "environment" in data
    assert "timestamp" in data


def test_health_api_v1_endpoint():
    """Verify /api/v1/health route returns 200 OK."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_health_details_endpoint():
    """Verify /api/v1/health/details returns readiness checks."""
    response = client.get("/api/v1/health/details")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["tenant_isolation_enforced"] is True
    assert "ai_service_configured" in data
    assert "storage_configured" in data
