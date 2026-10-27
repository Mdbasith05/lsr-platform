from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_v1_router
from app.api.v1.health import get_health, HealthResponse
from app.db.init_db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and seed if necessary
    print(f"[{settings.APP_NAME}] Initializing database tables...")
    try:
        init_db()
        print(f"[{settings.APP_NAME}] Database initialized successfully.")
    except Exception as e:
        print(f"[{settings.APP_NAME}] Database initialization error: {e}")

    print(f"[{settings.APP_NAME}] Starting up in {settings.APP_ENV} mode...")
    yield
    # Shutdown: clean up connections
    print(f"[{settings.APP_NAME}] Shutting down gracefully...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API for Property Document Verification and Legal Scrutiny Reports (LSR).",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware for Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root-level health check endpoint for load balancers and simple pings
app.get("/health", response_model=HealthResponse, tags=["Health"])(get_health)

# API v1 Router (/api/v1/...)
app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["Root"])
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "docs": "/docs",
        "health": "/health",
    }
