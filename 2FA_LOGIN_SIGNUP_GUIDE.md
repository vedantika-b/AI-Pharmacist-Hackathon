# Two-Factor Authentication (2FA) Implementation Guide

## Overview

AI Pharmacist now has **comprehensive Two-Factor Authentication (2FA)** integrated into the login and signup process using **Google Authenticator** for TOTP (Time-based One-Time Password) codes.

---

## 🔐 Features

### ✅ Signup with Automatic 2FA Setup
- **All new users** automatically get 2FA enabled during signup
- **Step 1**: Phone OTP verification (optional but recommended)
- **Step 2**: Google Authenticator QR code setup (mandatory)
- QR code displayed immediately after account creation
- Clear instructions for scanning with Google Authenticator

### ✅ Login with 2FA Verification
- Automatic detection if user has 2FA enabled- Two-step login process:
  1. Email + Password verification
  2. 6-digit TOTP code from Google Authenticator
- Clear visual indicators showing 2FA status
- Auto-focus on code input field for better UX

### ✅ Settings Page 2FA Management
- View current 2FA status
- Enable/disable 2FA
- Generate new QR codes
- Test 2FA codes

---

## 📱 User Flow

### New User Signup

```
1. User fills signup form → Email, Password, Phone (optional)
   └─> Shows: "2FA Protection Enabled: Your account will be secured"

2. Account created → Phone OTP verification (if phone provided)
   └─> Shows: "Step 1 of 2: Verify Phone"

3. OTP verified → QR Code displayed
   └─> Shows: "Step 2 of 2: Setup Google Authenticator"
   └─> User scans QR code with Google Authenticator app

4. User clicks "I've Saved It" → Dashboard
   └─> 2FA now active for all future logins
```

### Existing User Login

```
1. User enters Email + Password
   └─> Backend checks if user has totp_secret

2. If 2FA enabled:
   └─> Page shows: "🔒 Your account is protected with 2FA"
   └─> User opens Google Authenticator app
   └─> User enters current 6-digit code
   └─> Backend validates TOTP code
   └─> Success → Dashboard

3. If 2FA not enabled:
   └─> Direct login → Dashboard
```

---

## 🛠️ Technical Implementation

### Backend (FastAPI + Supabase)

#### Database Schema
```sql
-- users table includes:
totp_secret VARCHAR        -- Base32 secret for TOTP generation
otp_code VARCHAR          -- Phone OTP code (temporary)
otp_expires_at TIMESTAMP  -- OTP expiration time
```

#### Key Endpoints

**POST /api/v1/auth/signup**
```python
# Creates user with automatic TOTP secret generation
{
  "email": "user@example.com",
  "password": "securepass123",
  "full_name": "John Doe",
  "phone_number": "+919876543210"  # Optional
}

# Response includes:
{
  "access_token": "jwt_token...",
  "qr_code": "data:image/png;base64,...",  # QR code for Google Authenticator
  "otp_sent": true,
  "otp_code_demo": "123456"  # Demo only - remove in production
}
```

**POST /api/v1/auth/login**
```python
# Step 1: Email + Password
{
  "email": "user@example.com",
  "password": "securepass123"
}

# If 2FA enabled, response:
{
  "requires_2fa": true,
  "user": { "id": "...", "email": "..." }
}

# Step 2: Send TOTP code
{
  "email": "user@example.com",
  "password": "securepass123",
  "totp_code": "123456"
}

# Success response:
{
  "access_token": "jwt_token...",
  "user": { ... },
  "requires_2fa": false
}
```

#### TOTP Generation (pyotp)
```python
import pyotp
import qrcode

# Generate secret
secret = pyotp.random_base32()  # e.g., "JBSWY3DPEHPK3PXP"

# Generate QR code
totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
    name=email,
    issuer_name="AI Pharmacist"
)
# Creates: otpauth://totp/AI%20Pharmacist:user@example.com?secret=JBSWY3D...

# Verify code
totp = pyotp.TOTP(secret)
is_valid = totp.verify("123456", valid_window=1)  # Allows 30s clock drift
```

### Frontend (Next.js + React)

#### Signup Page States
```tsx
const [showQrCode, setShowQrCode] = useState(false)      // Show QR code screen
const [otpSent, setOtpSent] = useState(false)           // Show OTP verification
const [qrCode, setQrCode] = useState<string | null>(null) // QR code data URL

// Flow:
// 1. Submit form → Set qrCode from backend
// 2. If phone provided → Set otpSent=true (Step 1)
// 3. OTP verified → Set showQrCode=true (Step 2)
// 4. QR scanned → Dashboard
```

#### Login Page States
```tsx
const [requires2FA, setRequires2FA] = useState(false)    // Show 2FA input
const [totpCode, setTotpCode] = useState("")            // 6-digit code

// Flow:
// 1 Submit email+password
// 2. If requires_2fa=true → Show 2FA input
// 3. User enters TOTP code → Submit with code
// 4. Success → Dashboard
```

---

## 🧪 Testing the 2FA System

### Option 1: Quick Test with Demo Account

1. **Enable 2FA for demo account:**
   ```bash
   cd backend
   python enable_2fa_demo_account.py
   ```

2. **Scan the QR code** displayed in browser with Google Authenticator

3. **Login:**
   - URL: http://localhost:3000/auth/login
   - Email: `vedantikabhoyar135@gmail.com`
   - Password: `admin123`
   - Enter 6-digit code from Google Authenticator

### Option 2: Create New Test Account

1. **Signup:**
   - URL: http://localhost:3000/auth/signup
   - Fill in details (use real email format)
   - (Optional) Add phone for OTP test

2. **Verify OTP** (if phone provided):
   - Check terminal for demo OTP code
   - Enter the 6-digit code

3. **Scan QR Code:**
   - Open Google Authenticator app
   - Tap **+** → Scan QR Code
   - Point camera at QR code on screen

4. **Test Login:**
   - Logout
   - Login with email + password
   - You'll be prompted for 2FA code
   - Enter code from Google Authenticator

---

## 📋 Configuration

### Environment Variables

**.env (Backend)**
```bash
# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this

# 2FA Settings (in code)
ACCESS_TOKEN_EXPIRE_MINUTES=30
OTP_EXPIRE_MINUTES=5

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

### Security Best Practices

#### ✅ DO:
- Use strong TOTP secrets (32+ characters base32)
- Allow ±1 window for clock drift (`valid_window=1`)
- Clear OTP codes after verification
- Set OTP expiration (5 minutes recommended)
- Use HTTPS in production
- Store TOTP secrets encrypted in production
- Rate limit 2FA attempts

#### ❌ DON'T:
- Return OTP codes in API responses (production)
- Allow unlimited 2FA retry attempts
- Use predictable TOTP secrets
- Skip HTTPS in production
- Allow 2FA bypass without proper recovery flow

---

## 🚀 Production Checklist

### Before Deploying to Production:

- [ ] Remove `otp_code_demo` from all API responses
- [ ] Integrate real SMS service (Twilio, AWS SNS, etc.)
- [ ] Enable HTTPS only
- [ ] Encrypt `totp_secret` in database
- [ ] Add rate limiting (max 5 attempts per 15 minutes)
- [ ] Implement 2FA recovery codes (backup codes)
- [ ] Add "Trust this device" option
- [ ] Email notifications for 2FA changes
- [ ] Audit logging for 2FA events
- [ ] Test 2FA with real phone numbers
- [ ] Add 2FA bypass for account recovery (support tickets)
- [ ] Document 2FA setup for support team

### SMS Service Integration (Example: Twilio)

```python
# Install: pip install twilio
from twilio.rest import Client

def send_sms_otp(phone_number: str, otp_code: str) -> bool:
    client = Client(account_sid, auth_token)
    
    message = client.messages.create(
        body=f"Your AI Pharmacist OTP is: {otp_code}. Valid for 5 minutes.",
        from_='+1234567890',  # Your Twilio number
        to=phone_number
    )
    
    return message.sid is not None
```

---

## 🔧 Troubleshooting

### Issue: "Invalid 2FA code" error

**Causes:**
1. Clock drift between server and phone
2. User entering old/expired code
3. Wrong secret stored in database

**Solutions:**
- Increase `valid_window` to 2 (allows ±60 seconds)
- Check server NTP sync
- Regenerate QR code if persists

### Issue: QR code not scanning

**Solutions:**
- Increase QR code size (change `box_size=10` to `15`)
- Ensure high contrast (black on white)
- Try manual entry with TOTP secret

### Issue: Demo account 2FA not working

**Solutions:**
```bash
# Re-run setup script
python backend/enable_2fa_demo_account.py

# Check database
# Verify totp_secret is not NULL
```

---

## 📚 Additional Resources

- [Google Authenticator](https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2)
- [RFC 6238 - TOTP Specification](https://tools.ietf.org/html/rfc6238)
- [pyotp Documentation](https://pyauth.github.io/pyotp/)
- [QR Code Library](https://github.com/lincolnloop/python-qrcode)

---

## 📞 Support

If you encounter issues with 2FA:

1. Check this documentation
2. Review terminal logs for error messages
3. Verify Supabase connection
4. Test with demo account first
5. Check Google Authenticator app is installed

---

**Last Updated:** March 1, 2026  
**Version:** 1.0.0  
**Author:** AI Pharmacist Development Team
