-- Add payment_proof column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS payment_proof TEXT;

-- Add constraint to payment_status to ensure valid values
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS check_payment_status;

ALTER TABLE profiles 
ADD CONSTRAINT check_payment_status 
CHECK (payment_status IN ('pending', 'proof_submitted', 'completed'));