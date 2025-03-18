-- Remove NOT NULL constraint
ALTER TABLE profiles ALTER COLUMN payment_reference DROP NOT NULL;

-- Drop the payment reference index
DROP INDEX IF EXISTS idx_profiles_payment_reference;