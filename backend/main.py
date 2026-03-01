from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
import os
from groq import Groq

load_dotenv()

app = FastAPI()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

"""
FastAPI Application for AI Pharmacist System.

Production-ready backend with:
- Supabase PostgreSQL integration
- Groq LLM for intent extraction
- scikit-learn for refill prediction
- Rule-based prescription validation
- Comprehensive audit logging
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import sys
from datetime import datetime

# Import core modules
from core.config import get_settings
from core.database import DatabasePool

# Import routers
from routers import orders, health, products, chat, predictions, export, dashboard, ai_logs, users, prescriptions, feedback, auth, pharmacy_prices

# Import middleware and exceptions
from core.middleware import (
    RequestIDMiddleware,
    StructuredLoggingMiddleware,
    ErrorHandlerMiddleware,
    ResponseTimeMiddleware
)
from core.exceptions import AppException

# Configure structured logging
def setup_logging():
    log_level = getattr(logging, get_settings().log_level.upper(), logging.INFO)
    
    handlers = [logging.StreamHandler(sys.stdout)]
    
    # JSON formatting for production
    if get_settings().log_format == "json":
        try:
            import json_log_formatter
            formatter = json_log_formatter.JSONFormatter()
        except ImportError:
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    for handler in handlers:
        handler.setFormatter(formatter)
    
    logging.basicConfig(
        level=log_level,
        handlers=handlers
    )
    
    # Suppress noisy loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)

setup_logging()
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Production-ready lifespan with proper resource management.
    """
    # Startup
    startup_data = {
        "app": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "debug": settings.debug
    }
    logger.info(f"Starting {settings.app_name}", extra={"structured": startup_data})
    
    # Initialize database pool (optional for direct access)
    # DATABASE_URL must be uncommented in .env to enable this
    if settings.database_url:
        try:
            pool = await DatabasePool.get_pool()
            logger.info("Database pool initialized", extra={"structured": {"pool_size": settings.db_pool_size}})
        except Exception as e:
            logger.error(f"Database pool initialization failed: {e}", exc_info=True)
            logger.warning("Continuing without database pool (using Supabase client only)")
    else:
        logger.info("Database pool skipped (using Supabase client only)")
    
    # Verify external service configurations
    services_status = {
        "groq": bool(settings.groq_api_key and settings.groq_api_key != "your-groq-api-key-here"),
        "supabase": bool(
            settings.supabase_url 
            and settings.supabase_service_key 
            and settings.supabase_service_key != "your-service-role-key-here"
        )
    }
    logger.info("External services configured", extra={"structured": services_status})
    
    if not services_status["supabase"]:
        logger.warning("Supabase service key not configured - database operations will fail")
    if not services_status["groq"]:
        logger.warning("Groq API key not configured - LLM operations will fail")
    
    # Initialize Sentry for error tracking (production)
    if settings.sentry_dsn:
        try:
            import sentry_sdk
            sentry_sdk.init(
                dsn=settings.sentry_dsn,
                environment=settings.environment,
                traces_sample_rate=0.1 if settings.is_production else 1.0
            )
            logger.info("Sentry initialized")
        except ImportError:
            logger.warning("Sentry SDK not installed")
    
    logger.info("Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application")
    
    if settings.database_url:
        try:
            await DatabasePool.close_pool()
            logger.info("Database connections closed")
        except Exception as e:
            logger.error(f"Error closing database pool: {e}", exc_info=True)
    
    logger.info("Shutdown complete")


# Create FastAPI application with production config
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    Production-ready AI-powered pharmacist system.
    
    ## Architecture
    
    Multi-agent system with:
    * LLM-powered intent extraction (Groq)
    * Rule-based safety validation
    * ML refill prediction
    * Real-time inventory management
    * Complete audit trail
    
    ## Security
    
    * Rate limiting
    * Request tracking
    * Structured logging
    * Input validation
    
    ## Monitoring
    
    * Health checks
    * Performance metrics
    * Error tracking (Sentry)
    """,
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    openapi_url="/openapi.json" if not settings.is_production else None
)

# Add production middleware stack (order matters)
app.add_middleware(ErrorHandlerMiddleware)
app.add_middleware(ResponseTimeMiddleware)
app.add_middleware(StructuredLoggingMiddleware)
app.add_middleware(RequestIDMiddleware)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Process-Time"],
)

# Custom exception handlers
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Handle application-specific exceptions."""
    request_id = getattr(request.state, "request_id", "unknown")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.error_code,
            "message": exc.message,
            "request_id": request_id,
            **exc.details
        }
    )


# Include routers
app.include_router(health.router)
app.include_router(
    auth.router,
    prefix=settings.api_v1_prefix
)
app.include_router(
    orders.router,
    prefix=settings.api_v1_prefix
)
app.include_router(
    products.router,
    prefix=settings.api_v1_prefix
)
app.include_router(
    chat.router,
    prefix=settings.api_v1_prefix
)
app.include_router(
    predictions.router,
    prefix=settings.api_v1_prefix
)
app.include_router(
    export.router,
    prefix=settings.api_v1_prefix
)
app.include_router(
    dashboard.router,
    prefix=settings.api_v1_prefix
)
app.include_router(
    ai_logs.router,
    prefix=settings.api_v1_prefix
)
app.include_router(
    users.router,
    prefix=settings.api_v1_prefix
)
app.include_router(
    prescriptions.router,
    prefix=settings.api_v1_prefix
)
app.include_router(
    feedback.router,
    prefix=settings.api_v1_prefix
)
app.include_router(
    pharmacy_prices.router,
    prefix=settings.api_v1_prefix
)
# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """API root with service information."""
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "health": "/health",
        "docs": "/docs" if not settings.is_production else None,
        "api": settings.api_v1_prefix
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level="info"
    )
