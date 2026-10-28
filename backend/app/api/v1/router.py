from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.cases import router as cases_router
from app.api.v1.documents import router as documents_router
from app.api.v1.scrutiny import router as scrutiny_router
from app.api.v1.queries import router as queries_router
from app.api.v1.reports import router as reports_router
from app.api.v1.profile import router as profile_router

api_v1_router = APIRouter()

# Mount all feature routers under /api/v1
api_v1_router.include_router(health_router, prefix="", tags=["Health"])
api_v1_router.include_router(profile_router, prefix="/profile", tags=["Profile"])
api_v1_router.include_router(cases_router, prefix="/cases", tags=["Cases"])
api_v1_router.include_router(documents_router, prefix="", tags=["Documents"])
api_v1_router.include_router(scrutiny_router, prefix="", tags=["Scrutiny"])
api_v1_router.include_router(queries_router, prefix="", tags=["Queries"])
api_v1_router.include_router(reports_router, prefix="", tags=["Reports"])
