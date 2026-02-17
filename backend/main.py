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
from routers import orders

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('../logs/app.log')
    ]
)

logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup
    logger.info("=" * 60)
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Environment: {'DEBUG' if settings.debug else 'PRODUCTION'}")
    logger.info("=" * 60)
    
    # Initialize database pool
    try:
        pool = await DatabasePool.get_pool()
        logger.info("✓ Database connection pool initialized")
    except Exception as e:
        logger.error(f"✗ Failed to initialize database pool: {e}")
    
    # Verify Groq API key
    if settings.groq_api_key:
        logger.info("✓ Groq API key configured")
    else:
        logger.warning("✗ Groq API key not found!")
    
    logger.info("Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    
    try:
        await DatabasePool.close_pool()
        logger.info("✓ Database connections closed")
    except Exception as e:
        logger.error(f"Error closing database pool: {e}")
    
    logger.info("Application shutdown complete")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    AI-powered pharmacist system with multi-agent architecture.
    
    ## Features
    
    * **LLM Intent Extraction**: Groq llama-3.1-8b-instant for understanding customer requests
    * **Safety Validation**: Rule-based prescription and dosage checking
    * **Refill Prediction**: ML-powered prediction of refill dates
    * **Inventory Management**: Real-time stock tracking and updates
    * **Audit Logging**: Complete tracking of all AI decisions
    
    ## Agents
    
    1. **Conversation Agent**: Extracts intent and entities from orders
    2. **Safety Agent**: Validates prescriptions and checks drug interactions
    3. **Refill Prediction Agent**: Predicts when customers need refills
    4. **Action Agent**: Executes orders and updates inventory
    """,
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests."""
    start_time = datetime.utcnow()
    
    # Log request
    logger.info(f"→ {request.method} {request.url.path}")
    
    # Process request
    response = await call_next(request)
    
    # Log response
    duration = (datetime.utcnow() - start_time).total_seconds() * 1000
    logger.info(
        f"← {request.method} {request.url.path} "
        f"[{response.status_code}] {duration:.2f}ms"
    )
    
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.debug else "An unexpected error occurred",
            "path": str(request.url.path)
        }
    )


# Include routers
app.include_router(
    orders.router,
    prefix=settings.api_v1_prefix
)


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint.
    Returns application status and configuration.
    """
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
        "timestamp": datetime.utcnow().isoformat(),
        "groq_configured": bool(settings.groq_api_key),
        "supabase_configured": bool(settings.supabase_url and settings.supabase_service_key)
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "docs": "/docs" if settings.debug else "Documentation disabled in production",
        "health": "/health"
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
