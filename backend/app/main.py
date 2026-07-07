"""
KRISHISEVA — FastAPI Application Factory.

This is the entry point. Registers middleware, exception handlers,
lifespan events, and all routers.
"""

import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

from app.core.config import settings
from app.exceptions import KrishisevaException


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.

    Startup: create upload directory, log startup.
    Shutdown: cleanup resources.
    """
    # ── Startup ──
    os.makedirs(settings.upload_dir, exist_ok=True)
    print(f"[KRISHISEVA] {settings.app_name} v{settings.app_version} starting up...")
    print(f"   Environment: {settings.environment}")
    print(f"   Debug: {settings.debug}")
    print(f"   Upload dir: {settings.upload_dir}")

    yield

    # ── Shutdown ──
    print(f"[KRISHISEVA] {settings.app_name} shutting down...")


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "AI-Powered Crop Insurance Claims Verification Platform. "
            "One-village MVP for The Blueprint Ideathon 2026 (PS2)."
        ),
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # ── CORS Middleware ──
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Static Files Serving ──
    from fastapi.staticfiles import StaticFiles
    # Ensure directory exists on mount
    os.makedirs(settings.upload_dir, exist_ok=True)
    app.mount("/static/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


    # ── Global Exception Handler ──
    @app.exception_handler(KrishisevaException)
    async def krishiseva_exception_handler(request: Request, exc: KrishisevaException):
        """Convert all custom exceptions to standard API error responses."""
        status_map = {
            "AUTHENTICATION_ERROR": 401,
            "INVALID_TOKEN": 401,
            "INVALID_OTP": 401,
            "AUTHORIZATION_ERROR": 403,
            "NOT_FOUND": 404,
            "DUPLICATE_ERROR": 409,
            "CLAIM_VALIDATION_ERROR": 422,
            "CLAIM_ALREADY_REVIEWED": 409,
            "FILE_UPLOAD_ERROR": 400,
            "FILE_TOO_LARGE": 413,
            "AI_SERVICE_ERROR": 503,
        }
        status_code = status_map.get(exc.code, 500)
        return JSONResponse(
            status_code=status_code,
            content={
                "success": False,
                "error": exc.code,
                "message": exc.message,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        """Catch-all for unhandled exceptions — never leak stack traces."""
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "INTERNAL_ERROR",
                "message": "An unexpected error occurred" if not settings.debug else str(exc),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )

    # ── Root Redirect ──
    @app.get("/", include_in_schema=False)
    async def root_redirect():
        return RedirectResponse(url="/api/docs")

    # ── Health Check ──
    @app.get("/api/v1/health", tags=["Health"])
    async def health_check():
        return {
            "success": True,
            "data": {
                "status": "healthy",
                "app": settings.app_name,
                "version": settings.app_version,
                "environment": settings.environment,
            },
            "message": "Service is running",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    # ── Register Routers ──
    from app.routers import auth, farmers, claims, ngo, official, reference_data
    app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
    app.include_router(farmers.router, prefix="/api/v1/farmers", tags=["Farmers"])
    app.include_router(claims.router, prefix="/api/v1/claims", tags=["Claims"])
    app.include_router(ngo.router, prefix="/api/v1/ngo", tags=["NGO"])
    app.include_router(official.router, prefix="/api/v1/official", tags=["Official"])
    app.include_router(reference_data.router, prefix="/api/v1/reference-data", tags=["Reference Data"])



    return app


# ── Application Instance ──
app = create_app()
