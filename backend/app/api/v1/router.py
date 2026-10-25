from fastapi import APIRouter
from app.api.v1.health import router as health_router

api_v1_router = APIRouter()

# Mount health routes under v1
api_v1_router.include_router(health_router, prefix="", tags=["Health"])

# Future milestone routers:
# api_v1_router.include_router(cases_router, prefix="/cases", tags=["Cases"])
# api_v1_router.include_router(documents_router, prefix="/documents", tags=["Documents"])
# api_v1_router.include_router(scrutiny_router, prefix="/scrutiny", tags=["Scrutiny"])
# api_v1_router.include_router(queries_router, prefix="/queries", tags=["Queries"])
