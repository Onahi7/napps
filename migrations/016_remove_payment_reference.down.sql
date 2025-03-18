-- Recreate payment_reference column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);