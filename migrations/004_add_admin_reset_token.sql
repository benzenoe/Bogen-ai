-- Add password reset token fields to admin_users
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;
