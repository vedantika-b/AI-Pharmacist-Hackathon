"""
Production-ready middleware for request tracking, logging, and monitoring.
"""

import time
import uuid
import json
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from datetime import datetime
import logging

from core.exceptions import AppException

logger = logging.getLogger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Adds unique request ID to each request for tracing."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id
        
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        
        return response


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """Structured logging for all requests with performance metrics."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        request_id = getattr(request.state, "request_id", "unknown")
        
        # Log request
        log_data = {
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "client_host": request.client.host if request.client else None,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        logger.info(
            f"Request {request.method} {request.url.path}",
            extra={"structured": log_data}
        )
        
        # Process request
        try:
            response = await call_next(request)
        except Exception as exc:
            logger.error(
                f"Request failed: {str(exc)}",
                extra={"structured": {**log_data, "error": str(exc)}},
                exc_info=True
            )
            raise
        
        # Log response
        duration_ms = (time.time() - start_time) * 1000
        log_data.update({
            "status_code": response.status_code,
            "duration_ms": round(duration_ms, 2)
        })
        
        logger.info(
            f"Response {response.status_code} in {duration_ms:.2f}ms",
            extra={"structured": log_data}
        )
        
        return response


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Centralized error handling with proper status codes and logging."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            return await call_next(request)
        except AppException as exc:
            # Handle known application exceptions
            request_id = getattr(request.state, "request_id", "unknown")
            
            error_response = {
                "error": exc.error_code,
                "message": exc.message,
                "request_id": request_id,
                "timestamp": datetime.utcnow().isoformat(),
                **exc.details
            }
            
            logger.warning(
                f"Application error: {exc.error_code}",
                extra={
                    "structured": {
                        "request_id": request_id,
                        "error_code": exc.error_code,
                        "status_code": exc.status_code,
                        "details": exc.details
                    }
                }
            )
            
            return JSONResponse(
                status_code=exc.status_code,
                content=error_response
            )
        except Exception as exc:
            # Handle unexpected exceptions
            request_id = getattr(request.state, "request_id", "unknown")
            
            logger.error(
                f"Unhandled exception: {type(exc).__name__}",
                extra={
                    "structured": {
                        "request_id": request_id,
                        "exception": str(exc),
                        "exception_type": type(exc).__name__
                    }
                },
                exc_info=True
            )
            
            # Don't leak internal details in production
            return JSONResponse(
                status_code=500,
                content={
                    "error": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred",
                    "request_id": request_id,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )


class ResponseTimeMiddleware(BaseHTTPMiddleware):
    """Adds response time headers for monitoring."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = f"{process_time:.4f}"
        return response
