"""
Production health check and monitoring endpoints.
"""

from fastapi import APIRouter, status
from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime
import psutil
import time

from core.config import get_settings
from core.database import DatabasePool, SupabaseManager

router = APIRouter(tags=["Health"])
settings = get_settings()

# Track application start time
START_TIME = time.time()


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str
    environment: str
    uptime_seconds: float


class DetailedHealthResponse(HealthResponse):
    dependencies: Dict[str, str]
    system: Optional[Dict[str, any]] = None


@router.get("/health", response_model=HealthResponse, status_code=status.HTTP_200_OK)
async def health_check():
    """
    Basic health check for load balancer / orchestrator.
    Returns 200 if application is running.
    """
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        version=settings.app_version,
        environment=settings.environment,
        uptime_seconds=round(time.time() - START_TIME, 2)
    )


@router.get("/health/detailed", response_model=DetailedHealthResponse, status_code=status.HTTP_200_OK)
async def detailed_health_check():
    """
    Detailed health check with dependency status.
    Use for debugging and monitoring dashboards.
    """
    dependencies = {}
    
    # Check Supabase
    try:
        client = SupabaseManager.get_client()
        dependencies["supabase"] = "healthy"
    except Exception as e:
        dependencies["supabase"] = f"unhealthy: {str(e)}"
    
    # Check Database Pool (if configured)
    if settings.database_url:
        try:
            pool = await DatabasePool.get_pool()
            dependencies["database_pool"] = "healthy"
        except Exception as e:
            dependencies["database_pool"] = f"unhealthy: {str(e)}"
    
    # Check Groq API
    dependencies["groq_api"] = "configured" if settings.groq_api_key else "not_configured"
    
    # System metrics (optional, only in non-production for security)
    system_metrics = None
    if settings.is_development:
        try:
            memory = psutil.virtual_memory()
            cpu = psutil.cpu_percent(interval=0.1)
            system_metrics = {
                "cpu_percent": cpu,
                "memory_percent": memory.percent,
                "memory_available_mb": round(memory.available / (1024 * 1024), 2)
            }
        except Exception:
            pass
    
    return DetailedHealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        version=settings.app_version,
        environment=settings.environment,
        uptime_seconds=round(time.time() - START_TIME, 2),
        dependencies=dependencies,
        system=system_metrics
    )


@router.get("/health/readiness", status_code=status.HTTP_200_OK)
async def readiness_check():
    """
    Kubernetes-style readiness probe.
    Returns 200 if service can accept traffic.
    """
    # Check critical dependencies
    try:
        client = SupabaseManager.get_client()
        
        return {
            "ready": True,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "ready": False,
            "reason": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


@router.get("/health/liveness", status_code=status.HTTP_200_OK)
async def liveness_check():
    """
    Kubernetes-style liveness probe.
    Returns 200 if service is alive (even if not ready).
    """
    return {
        "alive": True,
        "timestamp": datetime.utcnow().isoformat()
    }
