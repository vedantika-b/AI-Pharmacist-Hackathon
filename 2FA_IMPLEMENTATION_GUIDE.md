# Google Authenticator 2FA Implementation Guide

## Overview
This guide documents the complete implementation of Google Authenticator 2FA (Two-Factor Authentication) for the AI Pharmacist application using TOTP (Time-based One-Time Password) protocol.

## Architecture

### Backend Implementation

#### Dependencies
- **pyotp**: TOTP generation and verification
- **qrcode**: QR code generation for Google Authenticator
- **bcrypt**: Password hashing
- **PyJWT**: JWT token generation

#### Database Schema
A new column has been added to the `users` table:
```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS totp_secret TEXT;
```

This column stores the unique TOTP secret for each user's 2FA setup.

#### API Endpoints

##### 1. Signup Endpoint: `/api/v1/auth/signup`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2026-02-28T10:00:00"
  },
  "requires_2fa": true,
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**Flow:**
1. Validates email uniqueness
2. Hashes password using bcrypt
3. Generates unique TOTP secret using `pyotp.random_base32()`
4. Creates user record with email, password_hash, and totp_secret
5. Generates QR code containing TOTP provisioning URI
6. Returns QR code as base64-encoded PNG image

##### 2. Login Endpoint: `/api/v1/auth/login`
**Request (Step 1 - Email & Password):**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (2FA Required):**
```json
{
  "access_token": "",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe"
  },
  "requires_2fa": true
}
```

**Request (Step 2 - With 2FA Code):**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "totp_code": "123456"
}
```

**Response (Success):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2026-02-28T10:00:00"
  },
  "requires_2fa": false
}
```

**Flow:**
1. Verifies email and password using bcrypt
2. Checks if user has `totp_secret` in database
3. If 2FA enabled and no code provided, returns `requires_2fa: true`
4. If 2FA code provided, verifies using `pyotp.TOTP(secret).verify(code)`
5. Returns JWT token only after both password and TOTP are verified

#### Core Functions

```python
def generate_totp_secret() -> str:
    """Generate a new TOTP secret."""
    return pyotp.random_base32()

def generate_qr_code(email: str, secret: str, issuer: str = "AI Pharmacist") -> str:
    """Generate QR code URL for Google Authenticator."""
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=email,
        issuer_name=issuer
    )
    # Generate and return base64-encoded QR code image
    
def verify_totp(secret: str, code: str) -> bool:
    """Verify a TOTP code."""
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)
```

### Frontend Implementation

#### Updated Components

##### 1. AuthContext (`frontend/contexts/AuthContext.tsx`)
**Updated Interfaces:**
```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, totpCode?: string) => Promise<{ requires_2fa?: boolean }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ qr_code?: string; requires_2fa?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}
```

**Key Changes:**
- `signIn` now accepts optional `totpCode` parameter
- Both `signIn` and `signUp` return objects with 2FA status
- Handles API responses for 2FA requirements

##### 2. Signup Page (`frontend/app/auth/signup/page.tsx`)
**Features:**
- Displays QR code after successful signup
- Step-by-step instructions for Google Authenticator setup
- Conditional rendering: signup form → QR code display → dashboard

**User Flow:**
1. User fills signup form
2. Upon successful signup, sees QR code screen
3. Scans QR code with Google Authenticator
4. Clicks "Continue to Dashboard"

##### 3. Login Page (`frontend/app/auth/login/page.tsx`)
**Features:**
- Two-step authentication process
- Conditional rendering: login form → 2FA code input
- 6-digit TOTP code input with validation
- "Back to Login" option to restart flow

**User Flow:**
1. User enters email and password
2. If 2FA enabled, sees 2FA code input screen
3. Opens Google Authenticator app
4. Enters 6-digit code
5. Successfully logs in

## Setup Instructions

### Backend Setup

1. **Install Dependencies:**
```bash
cd backend
pip install pyotp qrcode bcrypt PyJWT
```

2. **Update Database Schema:**
```bash
# Using Supabase SQL editor or psql
psql -U your_user -d your_database -f database/add_2fa_column.sql
```

Or run directly:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret TEXT;
```

3. **Verify Backend Server:**
```bash
cd backend
python run.py
```

### Frontend Setup

1. **No additional dependencies needed** (React, Next.js already installed)

2. **Environment Variables:**
Ensure `frontend/.env.local` has:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. **Start Frontend:**
```bash
cd frontend
npm run dev
```

## Testing the 2FA Flow

### Test Signup with 2FA

1. **Navigate to** `http://localhost:3000/auth/signup`

2. **Fill signup form:**
   - Full Name: Test User
   - Email: test@example.com
   - Password: password123
   - Confirm Password: password123

3. **Submit form** → See QR code screen

4. **Scan QR code:**
   - Install Google Authenticator (iOS/Android)
   - Open app → Tap "+" → Scan QR code
   - App displays 6-digit code that refreshes every 30 seconds

5. **Save the entry** in Google Authenticator

6. **Click "Continue to Dashboard"**

### Test Login with 2FA

1. **Navigate to** `http://localhost:3000/auth/login`

2. **Enter credentials:**
   - Email: test@example.com
   - Password: password123

3. **Submit** → See 2FA code input screen

4. **Open Google Authenticator** and find "AI Pharmacist" entry

5. **Enter the current 6-digit code**

6. **Submit** → Successfully logged in to dashboard

### Test with API Directly

**Signup:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'
```

**Login (Step 1):**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Login (Step 2 with TOTP):**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "totp_code": "123456"
  }'
```

## Security Features

### TOTP Implementation
- **Algorithm:** HMAC-SHA1
- **Time Step:** 30 seconds
- **Code Length:** 6 digits
- **Valid Window:** ±1 time step (90 seconds total)

### Password Security
- **Hashing:** bcrypt with auto-generated salt
- **Min Length:** 6 characters (configurable)
- **Storage:** Never stored in plain text

### JWT Tokens
- **Algorithm:** HS256
- **Expiration:** 30 minutes (configurable)
- **Claims:** user_id, email

### Additional Security
- Email uniqueness validation
- Rate limiting (recommended for production)
- HTTPS required for production
- Secure secret storage (environment variables)

## File Structure

```
backend/
├── routers/
│   └── auth.py                 # Updated with 2FA endpoints
├── requirements.txt            # Updated with pyotp, qrcode
└── database/
    └── add_2fa_column.sql     # Database migration

frontend/
├── app/
│   └── auth/
│       ├── signup/
│       │   └── page.tsx       # Updated with QR code display
│       └── login/
│           └── page.tsx       # Updated with 2FA input
└── contexts/
    └── AuthContext.tsx        # Updated with 2FA support
```

## Troubleshooting

### QR Code Not Displaying
- Check backend logs for QR code generation errors
- Verify `qrcode` library is installed
- Check browser console for image loading errors

### Invalid 2FA Code
- Ensure device time is synchronized (TOTP is time-based)
- Check if code has expired (30-second window)
- Verify secret was saved correctly in database
- Try previous or next code (valid_window=1)

### Database Errors
- Run migration script: `database/add_2fa_column.sql`
- Verify `totp_secret` column exists
- Check database connection settings

### Frontend Not Showing 2FA Screen
- Check API response includes `requires_2fa: true`
- Verify AuthContext is properly handling response
- Check browser console for JavaScript errors

## Production Considerations

1. **Environment Variables:**
   - Store JWT secret in secure environment variable
   - Use different secrets for dev/staging/prod
   - Never commit secrets to version control

2. **HTTPS Required:**
   - Always use HTTPS in production
   - QR codes and tokens must be transmitted securely

3. **Backup Codes:**
   - Implement backup codes for account recovery
   - Store securely hashed like passwords

4. **Rate Limiting:**
   - Limit login attempts (prevent brute force)
   - Limit 2FA verification attempts
   - Consider temporary lockout after failures

5. **Audit Logging:**
   - Log all authentication attempts
   - Track 2FA setup and changes
   - Monitor for suspicious activity

6. **User Experience:**
   - Provide clear setup instructions
   - Include help/support links
   - Allow 2FA disable with password verification
   - Email notifications for 2FA changes

## API Response Examples

### Successful Signup
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "full_name": "Test User",
    "created_at": "2026-02-28T12:00:00.000000"
  },
  "requires_2fa": true,
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAEs..."
}
```

### Login - 2FA Required
```json
{
  "access_token": "",
  "token_type": "bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "full_name": "Test User"
  },
  "requires_2fa": true
}
```

### Login - Success with 2FA
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "full_name": "Test User",
    "created_at": "2026-02-28T12:00:00.000000"
  },
  "requires_2fa": false
}
```

### Error - Invalid 2FA Code
```json
{
  "detail": "Invalid 2FA code"
}
```

## Support

For issues or questions:
1. Check error logs in backend console
2. Verify database schema is updated
3. Ensure all dependencies are installed
4. Check API endpoint responses in browser network tab
5. Review this guide's troubleshooting section

## License
This implementation is part of the AI Pharmacist project.
