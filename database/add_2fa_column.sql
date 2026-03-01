-- Add 2FA TOTP secret column to users table
-- This column stores the secret key for Google Authenticator

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS totp_secret TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_totp_secret ON users(totp_secret) WHERE totp_secret IS NOT NULL;

-- Add comment
COMMENT ON COLUMN users.totp_secret IS 'TOTP secret for Google Authenticator 2FA';
