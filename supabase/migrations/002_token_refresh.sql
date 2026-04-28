-- Add refresh token and expiry tracking for Shopify's expiring offline tokens
ALTER TABLE merchants ADD COLUMN encrypted_refresh_token TEXT;
ALTER TABLE merchants ADD COLUMN access_token_expires_at TIMESTAMPTZ;
