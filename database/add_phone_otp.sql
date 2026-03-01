-- Add phone number and OTP columns to users table for SMS OTP authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(15);
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP;

-- Create index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);

-- Add comments
COMMENT ON COLUMN users.phone_number IS 'User phone number for OTP verification';
COMMENT ON COLUMN users.otp_code IS 'Current OTP code (6 digits)';
COMMENT ON COLUMN users.otp_expires_at IS 'OTP expiration timestamp (5 minutes from generation)';
