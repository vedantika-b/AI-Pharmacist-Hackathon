"""
Authentication router - Login, signup, and token management.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import bcrypt
import jwt
from supabase import Client
from core.database import get_supabase_client
from core.config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter(prefix="/auth", tags=["Authentication"])

# JWT Configuration
SECRET_KEY = settings.jwt_secret_key if hasattr(settings, 'jwt_secret_key') else "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


class LoginRequest(BaseModel):
    """Login request model."""
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    """Signup request model."""
    email: EmailStr
    password: str
    full_name: str


class AuthResponse(BaseModel):
    """Authentication response model."""
    access_token: str
    token_type: str
    user: dict


class PasswordResetRequest(BaseModel):
    """Password reset request."""
    email: EmailStr


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


@router.post("/login", response_model=AuthResponse)
async def login(
    credentials: LoginRequest,
    supabase: Client = Depends(get_supabase_client)
):
    """
    Login with email and password.
    
    Returns JWT token and user information.
    """
    try:
        # Query user from database
        result = supabase.table("users").select("*").eq("email", credentials.email).execute()
        
        if not result.data or len(result.data) == 0:
            logger.warning(f"Login attempt for non-existent user: {credentials.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        user = result.data[0]
        
        # Verify password
        stored_password_hash = user.get("password_hash")
        
        if not stored_password_hash:
            logger.error(f"User {credentials.email} has no password hash stored")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Use bcrypt to verify password
        if not verify_password(credentials.password, stored_password_hash):
            logger.warning(f"Invalid password attempt for user: {credentials.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.get("id"), "email": user.get("email")},
            expires_delta=access_token_expires
        )
        
        # Log successful login
        logger.info(f"Successful login for user: {credentials.email}")
        
        # Return token and user info
        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": user.get("id"),
                "email": user.get("email"),
                "full_name": user.get("full_name", ""),
                "created_at": user.get("created_at")
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed. Please try again."
        )


@router.post("/signup", response_model=AuthResponse)
async def signup(
    user_data: SignupRequest,
    supabase: Client = Depends(get_supabase_client)
):
    """
    Create a new user account.
    
    Hashes password with bcrypt and stores user in database.
    """
    try:
        # Check if user already exists
        existing = supabase.table("users").select("email").eq("email", user_data.email).execute()
        
        if existing.data and len(existing.data) > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password
        password_hash = hash_password(user_data.password)
        
        # Create user record
        new_user = {
            "email": user_data.email,
            "password_hash": password_hash,
            "full_name": user_data.full_name,
            "created_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table("users").insert(new_user).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user account"
            )
        
        created_user = result.data[0]
        user_id = created_user.get("id")
        
        # Also create user_profile entry for application compatibility
        try:
            user_profile = {
                "id": user_id,
                "full_name": user_data.full_name,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            supabase.table("user_profiles").insert(user_profile).execute()
            logger.info(f"Created user_profile for: {user_data.email}")
        except Exception as profile_error:
            # Log but don't fail signup if profile creation fails
            logger.warning(f"Failed to create user_profile: {profile_error}")
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_id, "email": created_user.get("email")},
            expires_delta=access_token_expires
        )
        
        logger.info(f"New user created: {user_data.email}")
        
        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": user_id,
                "email": created_user.get("email"),
                "full_name": created_user.get("full_name", ""),
                "created_at": created_user.get("created_at")
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e).lower()
        logger.error(f"Signup error: {e}")
        
        # Check if error is due to missing table
        if "relation" in error_msg and "does not exist" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database not initialized. Please contact administrator to create users table."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Signup failed. Please try again."
        )


@router.post("/reset-password")
async def reset_password(
    request: PasswordResetRequest,
    supabase: Client = Depends(get_supabase_client)
):
    """
    Send password reset email.
    """
    try:
        # Check if user exists
        result = supabase.table("users").select("email").eq("email", request.email).execute()
        
        if not result.data or len(result.data) == 0:
            # Don't reveal if email exists or not for security
            return {"message": "If the email exists, a password reset link has been sent"}
        
        # TODO: Implement actual password reset email sending
        logger.info(f"Password reset requested for: {request.email}")
        
        return {"message": "If the email exists, a password reset link has been sent"}
    
    except Exception as e:
        logger.error(f"Password reset error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset request failed"
        )


@router.get("/verify")
async def verify_token(
    token: str,
    supabase: Client = Depends(get_supabase_client)
):
    """
    Verify JWT token validity.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Fetch user from database
        result = supabase.table("users").select("id, email, full_name").eq("id", user_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return {
            "valid": True,
            "user": result.data[0]
        }
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
