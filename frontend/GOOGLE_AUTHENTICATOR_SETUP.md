# Google Authenticator Integration

## ✅ What's Implemented

### Frontend (Settings Page)
1. **QR Code Generation**
   - Generates a random Base32 secret (32 characters)
   - Creates `otpauth://` URL format for Google Authenticator
   - Displays QR code using `qrcode` library
   - Shows secret key for manual entry

2. **User Interface**
   - Step-by-step instructions
   - QR code display (256x256px)
   - Manual secret code display
   - 6-digit verification code input
   - Enable/Disable 2FA functionality

3. **Libraries Used**
   - `qrcode` - For generating QR code images
   - `@types/qrcode` - TypeScript types

## 🔧 How It Works

### Enabling 2FA
1. User clicks "Enable Two-Factor Authentication" button
2. System generates a random Base32 secret
3. Creates otpauth URL: `otpauth://totp/AI%20Pharmacist:{email}?secret={secret}&issuer=AI%20Pharmacist`
4. Generates QR code from the URL
5. User scans QR code with Google Authenticator app
6. User enters the 6-digit code from app
7. System verifies code and enables 2FA

### Secret Format
- **Length**: 32 characters
- **Character Set**: A-Z, 2-7 (Base32)
- **Example**: `JBSWY3DPEHPK3PXP7Q2VGQKO3MMXNH6P`

### OTPAuth URL Format
```
otpauth://totp/AI%20Pharmacist:user@example.com?secret=SECRETKEY&issuer=AI%20Pharmacist
```

## 📱 Supported Authenticator Apps

The generated QR codes work with:
- ✅ Google Authenticator
- ✅ Microsoft Authenticator
- ✅ Authy
- ✅ 1Password
- ✅ LastPass Authenticator
- ✅ Any TOTP-compatible app

## 🚀 Backend Implementation Needed

To complete the 2FA implementation, you need to implement these backend endpoints:

### 1. Enable 2FA
**Endpoint**: `POST /api/2fa/enable`

**Request Body**:
```json
{
  "userId": "user-id",
  "secret": "JBSWY3DPEHPK3PXP...",
  "code": "123456"
}
```

**Backend Logic**:
```python
from pyotp import TOTP

def enable_2fa(user_id, secret, code):
    # 1. Verify the TOTP code
    totp = TOTP(secret)
    is_valid = totp.verify(code, valid_window=1)
    
    if not is_valid:
        return {"error": "Invalid verification code"}
    
    # 2. Save secret to user's profile (ENCRYPTED!)
    user = get_user(user_id)
    user.two_factor_secret = encrypt(secret)  # Use encryption!
    user.two_factor_enabled = True
    save_user(user)
    
    return {"success": True}
```

### 2. Verify 2FA During Login
**Endpoint**: `POST /api/auth/verify-2fa`

**Request Body**:
```json
{
  "userId": "user-id",
  "code": "123456"
}
```

**Backend Logic**:
```python
def verify_2fa_login(user_id, code):
    user = get_user(user_id)
    
    if not user.two_factor_enabled:
        return {"error": "2FA not enabled"}
    
    secret = decrypt(user.two_factor_secret)
    totp = TOTP(secret)
    is_valid = totp.verify(code, valid_window=1)
    
    return {"valid": is_valid}
```

### 3. Disable 2FA
**Endpoint**: `POST /api/2fa/disable`

**Request Body**:
```json
{
  "userId": "user-id",
  "password": "user-password"  // Require password confirmation
}
```

## 📦 Python Backend Dependencies

```bash
pip install pyotp cryptography
```

### Example Backend Code

```python
from pyotp import TOTP, random_base32
from cryptography.fernet import Fernet

# Generate secret (alternative to frontend generation)
def generate_2fa_secret():
    return random_base32()

# Verify TOTP code
def verify_totp_code(secret: str, code: str) -> bool:
    totp = TOTP(secret)
    return totp.verify(code, valid_window=1)  # 1 = 30 seconds before/after

# Get current code (for testing)
def get_current_code(secret: str) -> str:
    totp = TOTP(secret)
    return totp.now()
```

## 🔒 Security Best Practices

1. **Encrypt Secrets**
   - NEVER store 2FA secrets in plain text
   - Use strong encryption (AES-256, Fernet, etc.)
   - Store encryption key separately (env variables, key management service)

2. **Backup Codes**
   - Generate 10-12 single-use backup codes
   - Store them hashed (like passwords)
   - Allow user to regenerate them

3. **Rate Limiting**
   - Limit 2FA verification attempts (5-10 per hour)
   - Add delays after failed attempts
   - Lock account after too many failures

4. **Recovery Options**
   - Email verification for 2FA reset
   - SMS backup (if phone number verified)
   - Admin support for account recovery

## 🧪 Testing

### Test Without Backend
1. Enable 2FA in the app
2. QR code will be generated
3. Scan with Google Authenticator
4. Enter any 6-digit code to "enable" (currently not verified)

### Test With Backend
1. Implement the `/api/2fa/enable` endpoint
2. Update `handleEnable2FA` to call your API
3. Scan QR code with Google Authenticator
4. Enter the 6-digit code from the app
5. Backend should verify the code matches

## 📝 Database Schema

Add these fields to your `users` table:

```sql
ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN two_factor_secret TEXT; -- Encrypted!
ALTER TABLE users ADD COLUMN two_factor_backup_codes TEXT[]; -- Hashed!
```

## 🔄 Login Flow With 2FA

```
1. User enters email + password
   ↓
2. Backend verifies credentials
   ↓
3. If 2FA enabled → Send "2FA_REQUIRED" response
   ↓
4. Frontend shows 2FA code input
   ↓
5. User enters 6-digit code from authenticator app
   ↓
6. Backend verifies code against user's secret
   ↓
7. If valid → Issue session token
   If invalid → Show error, allow retry
```

## 📞 Support

For issues or questions:
- Check that secret is Base32 (A-Z, 2-7)
- Verify time sync on server (TOTP is time-based)
- Use `valid_window=1` for 30-second tolerance
- Test with known working code first

## 🎯 Next Steps

1. ✅ Install dependencies: `npm install qrcode @types/qrcode`
2. ✅ Frontend implementation complete
3. ⏳ Implement backend verification endpoint
4. ⏳ Add encrypted storage for secrets
5. ⏳ Integrate 2FA into login flow
6. ⏳ Add backup codes feature
7. ⏳ Add rate limiting
8. ⏳ Add recovery options
