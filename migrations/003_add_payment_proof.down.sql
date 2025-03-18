-- Revert payment_proof column and payment status changes
ALTER TABLE profiles 
DROP COLUMN IF EXISTS payment_proof,
DROP CONSTRAINT IF EXISTS check_payment_status,
ALTER COLUMN payment_status TYPE VARCHAR(10),
ADD CONSTRAINT check_payment_status 
  CHECK (payment_status IN ('pending', 'completed'));