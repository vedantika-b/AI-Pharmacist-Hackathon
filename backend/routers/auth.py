"""
Authentication router - Login, signup, and token management.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import bcrypt
import jwt
import pyotp
import qrcode
import io
import base64
import random
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
OTP_EXPIRE_MINUTES = 5


class LoginRequest(BaseModel):
    """Login request model."""
    email: EmailStr
    password: str
    totp_code: Optional[str] = None
    otp_code: Optional[str] = None


class SignupRequest(BaseModel):
    """Signup request model."""
    email: EmailStr
    password: str
    full_name: str
    phone_number: Optional[str] = None


class SendOTPRequest(BaseModel):
    """Send OTP request model."""
    phone_number: str
    email: Optional[EmailStr] = None


class VerifyOTPRequest(BaseModel):
    """Verify OTP request model."""
    phone_number: str
    otp_code: str


class AuthResponse(BaseModel):
    """Authentication response model."""
    access_token: str
    token_type: str
    user: dict
    requires_2fa: Optional[bool] = False
    qr_code: Optional[str] = None
    requires_otp: Optional[bool] = False
    otp_sent: Optional[bool] = False
    otp_code_demo: Optional[str] = None  # For demo purposes only


class OTPResponse(BaseModel):
    """OTP response model."""
    success: bool
    message: str
    otp_code_demo: Optional[str] = None  # For demo - in production, remove this


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


def generate_totp_secret() -> str:
    """Generate a new TOTP secret."""
    return pyotp.random_base32()


def generate_qr_code(email: str, secret: str, issuer: str = "AI Pharmacist") -> str:
    """Generate QR code URL for Google Authenticator - Optimized for speed."""
    # Create TOTP URI
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=email,
        issuer_name=issuer
    )
    
    # Generate QR code with optimized settings for faster generation
    # version=1 (smallest), box_size=6 (smaller but readable), border=2 (minimal)
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,  # Lowest error correction = faster
        box_size=6,  # Reduced from 10 for faster generation
        border=2,    # Reduced from 5 for faster generation
    )
    qr.add_data(totp_uri)
    qr.make(fit=True)
    
    # Create image with optimized settings
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffered = io.BytesIO()
    img.save(buffered, format="PNG", optimize=True)  # Add optimize flag
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"


def verify_totp(secret: str, code: str) -> bool:
    """Verify a TOTP code."""
    try:
        totp = pyotp.TOTP(secret)
        return totp.verify(code, valid_window=1)  # Allow 1 window before/after for clock drift
    except Exception as e:
        logger.error(f"TOTP verification error: {e}")
        return False


def generate_otp() -> str:
    """Generate a 6-digit OTP code."""
    return str(random.randint(100000, 999999))


def send_sms_otp(phone_number: str, otp_code: str) -> bool:
    """
    Send OTP via SMS.
    
    NOTE: This is a DEMO implementation. In production:
    - Use Twilio, AWS SNS, or similar SMS service
    - Do NOT return the OTP code in response
    
    For demo purposes, we'll just log the OTP and return success.
    """
    # Clean phone number
    clean_number = phone_number.replace(" ", "").replace("-", "")
    
    # In production, integrate with SMS service here:
    # Example with Twilio:
    # from twilio.rest import Client
    # client = Client(account_sid, auth_token)
    # message = client.messages.create(
    #     body=f"Your AI Pharmacist OTP is: {otp_code}. Valid for 5 minutes.",
    #     from_='+1234567890',
    #     to=clean_number
    # )
    
    # For demo, just log it
    logger.info(f"📱 OTP {otp_code} would be sent to {clean_number}")
    print(f"\n{'='*50}")
    print(f"📱 SMS OTP DEMO")
    print(f"Phone: {clean_number}")
    print(f"OTP Code: {otp_code}")
    print(f"Valid for: 5 minutes")
    print(f"{'='*50}\n")
    
    return True


@router.post("/send-otp", response_model=OTPResponse)
async def send_otp(
    request: SendOTPRequest,
    supabase: Client = Depends(get_supabase_client)
):
    """
    Send OTP to phone number.
    
    For demo purposes, returns the OTP code. In production, remove this!
    """
    try:
        # Generate OTP
        otp_code = generate_otp()
        otp_expires = datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)
        
        # Check if user exists with this phone number
        if request.email:
            # Update existing user's OTP
            result = supabase.table("users").update({
                "otp_code": otp_code,
                "otp_expires_at": otp_expires.isoformat()
            }).eq("email", request.email).execute()
        else:
            # Store OTP for phone number (for login)
            result = supabase.table("users").update({
                "otp_code": otp_code,
                "otp_expires_at": otp_expires.isoformat()
            }).eq("phone_number", request.phone_number).execute()
        
        # Send SMS (demo mode)
        send_sms_otp(request.phone_number, otp_code)
        
        logger.info(f"OTP sent to {request.phone_number}")
        
        return OTPResponse(
            success=True,
            message=f"OTP sent to {request.phone_number}",
            otp_code_demo=otp_code  # REMOVE IN PRODUCTION
        )
        
    except Exception as e:
        logger.error(f"Send OTP error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP"
        )


@router.post("/verify-otp", response_model=OTPResponse)
async def verify_otp_endpoint(
    request: VerifyOTPRequest,
    supabase: Client = Depends(get_supabase_client)
):
    """
    Verify OTP code for phone number.
    """
    try:
        # Get user with this phone number
        result = supabase.table("users").select("*").eq("phone_number", request.phone_number).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Phone number not found"
            )
        
        user = result.data[0]
        stored_otp = user.get("otp_code")
        otp_expires = user.get("otp_expires_at")
        
        if not stored_otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No OTP was sent to this number"
            )
        
        # Check expiration
        if otp_expires:
            expires_dt = datetime.fromisoformat(otp_expires.replace('Z', '+00:00'))
            if datetime.utcnow().replace(tzinfo=expires_dt.tzinfo) > expires_dt:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="OTP has expired. Please request a new one."
                )
        
        # Verify OTP
        if stored_otp != request.otp_code:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid OTP code"
            )
        
        # Clear OTP after successful verification
        supabase.table("users").update({
            "otp_code": None,
            "otp_expires_at": None
        }).eq("phone_number", request.phone_number).execute()
        
        logger.info(f"OTP verified successfully for {request.phone_number}")
        
        return OTPResponse(
            success=True,
            message="OTP verified successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Verify OTP error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify OTP"
        )


@router.post("/login", response_model=AuthResponse)
async def login(
    credentials: LoginRequest,
    supabase: Client = Depends(get_supabase_client)
):
    """
    Login with email, password, and optional 2FA TOTP code.
    
    Returns JWT token and user information after successful authentication.
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
        
        # Check if user has 2FA enabled
        totp_secret = user.get("totp_secret")
        
        if totp_secret:
            # User has 2FA enabled
            if not credentials.totp_code:
                # Password is correct but need 2FA code
                logger.info(f"Password verified for {credentials.email}, awaiting 2FA code")
                return AuthResponse(
                    access_token="",  # No token yet, needs 2FA
                    token_type="bearer",
                    user={
                        "id": user.get("id"),
                        "email": user.get("email"),
                        "full_name": user.get("full_name", "")
                    },
                    requires_2fa=True
                )
            
            # Verify TOTP code
            if not verify_totp(totp_secret, credentials.totp_code):
                logger.warning(f"Invalid 2FA code attempt for user: {credentials.email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid 2FA code"
                )
            
            logger.info(f"2FA verification successful for user: {credentials.email}")
        
        # Create access token (both password and 2FA verified)
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.get("id"), "email": user.get("email")},
            expires_delta=access_token_expires
        )
        
        # Update last login timestamp
        try:
            supabase.table("users").update({
                "last_login_at": datetime.utcnow().isoformat()
            }).eq("id", user.get("id")).execute()
        except Exception as update_error:
            logger.warning(f"Failed to update last_login_at: {update_error}")
        
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
            },
            requires_2fa=False
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
    Create a new user account with 2FA enabled and phone OTP support.
    
    Generates TOTP secret and QR code for Google Authenticator.
    Also supports phone number OTP verification.
    """
    try:
        # Check if user already exists
        existing = supabase.table("users").select("email").eq("email", user_data.email).execute()
        
        if existing.data and len(existing.data) > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Check if phone number is already registered
        if user_data.phone_number:
            phone_existing = supabase.table("users").select("phone_number").eq("phone_number", user_data.phone_number).execute()
            if phone_existing.data and len(phone_existing.data) > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Phone number already registered"
                )
        
        # Hash password
        password_hash = hash_password(user_data.password)
        
        # Generate TOTP secret for 2FA
        totp_secret = generate_totp_secret()
        
        # Generate OTP for phone verification if phone number provided
        otp_code = None
        otp_expires = None
        if user_data.phone_number:
            otp_code = generate_otp()
            otp_expires = datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)
        
        # Create user record
        new_user = {
            "email": user_data.email,
            "password_hash": password_hash,
            "full_name": user_data.full_name,
            "totp_secret": totp_secret,
            "phone_number": user_data.phone_number,
            "otp_code": otp_code,
            "otp_expires_at": otp_expires.isoformat() if otp_expires else None,
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
        
        # Send OTP if phone number provided
        if user_data.phone_number and otp_code:
            send_sms_otp(user_data.phone_number, otp_code)
        
        # Generate QR code for Google Authenticator
        qr_code = generate_qr_code(user_data.email, totp_secret)
        
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
        
        # Create access token (temporary, still needs 2FA verification)
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_id, "email": created_user.get("email"), "requires_2fa": True},
            expires_delta=access_token_expires
        )
        
        logger.info(f"New user created with 2FA: {user_data.email}")
        
        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            user={
                "id": user_id,
                "email": created_user.get("email"),
                "full_name": created_user.get("full_name", ""),
                "phone_number": created_user.get("phone_number"),
                "created_at": created_user.get("created_at")
            },
            requires_2fa=True,
            qr_code=qr_code,
            requires_otp=bool(user_data.phone_number),
            otp_sent=bool(user_data.phone_number),
            otp_code_demo=otp_code if user_data.phone_number else None  # REMOVE IN PRODUCTION
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
