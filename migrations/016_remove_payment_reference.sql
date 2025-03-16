-- Remove payment_reference column
ALTER TABLE profiles DROP COLUMN IF EXISTS payment_reference;

-- Drop any remaining indexes or constraints related to payment_reference
DROP INDEX IF EXISTS idx_profiles_payment_reference;