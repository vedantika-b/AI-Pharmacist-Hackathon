"""
Custom exception hierarchy for domain-specific error handling.
"""

from typing import Any, Dict, Optional
from fastapi import status


class AppException(Exception):
    """Base exception for all application errors."""
    
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(AppException):
    """Raised when input validation fails."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="VALIDATION_ERROR",
            details=details
        )


class PrescriptionError(AppException):
    """Raised when prescription validation fails."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="PRESCRIPTION_ERROR",
            details=details
        )


class ResourceNotFoundError(AppException):
    """Raised when requested resource doesn't exist."""
    
    def __init__(self, resource: str, identifier: str):
        super().__init__(
            message=f"{resource} not found: {identifier}",
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="RESOURCE_NOT_FOUND",
            details={"resource": resource, "identifier": identifier}
        )


class InventoryError(AppException):
    """Raised when inventory operations fail."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            error_code="INVENTORY_ERROR",
            details=details
        )


class ExternalServiceError(AppException):
    """Raised when external service call fails."""
    
    def __init__(self, service: str, message: str):
        super().__init__(
            message=f"{service} service error: {message}",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="EXTERNAL_SERVICE_ERROR",
            details={"service": service}
        )


class AuthenticationError(AppException):
    """Raised when authentication fails."""
    
    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="AUTHENTICATION_ERROR"
        )


class AuthorizationError(AppException):
    """Raised when authorization fails."""
    
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="AUTHORIZATION_ERROR"
        )


class RateLimitError(AppException):
    """Raised when rate limit is exceeded."""
    
    def __init__(self, message: str = "Rate limit exceeded", retry_after: Optional[int] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            error_code="RATE_LIMIT_EXCEEDED",
            details={"retry_after": retry_after}
        )
