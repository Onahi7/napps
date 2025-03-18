-- Add payment_proof column and new payment status
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS payment_proof TEXT,
DROP CONSTRAINT IF EXISTS check_payment_status,
ALTER COLUMN payment_status TYPE VARCHAR(20),
ADD CONSTRAINT check_payment_status 
  CHECK (payment_status IN ('pending', 'proof_submitted', 'completed'));