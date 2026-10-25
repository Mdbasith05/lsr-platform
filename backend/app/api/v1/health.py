from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel
from app.core.config import settings

router = APIRouter(tags=["Health"])


class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    environment: str
    timestamp: str


class DetailedHealthResponse(HealthResponse):
    tenant_isolation_enforced: bool
    ai_service_configured: bool
    storage_configured: bool


@router.get("/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    """
    Basic liveness and health-check endpoint.
    Used by frontend, load balancers, and monitoring.
    """
    return HealthResponse(
        status="ok",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/health/details", response_model=DetailedHealthResponse)
async def get_detailed_health() -> DetailedHealthResponse:
    """
    Detailed readiness check showing component configuration states.
    """
    return DetailedHealthResponse(
        status="ok",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
        timestamp=datetime.now(timezone.utc).isoformat(),
        tenant_isolation_enforced=True,
        ai_service_configured=bool(settings.GEMINI_API_KEY),
        storage_configured=bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY),
    )
