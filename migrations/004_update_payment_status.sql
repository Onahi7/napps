-- Update payment_status check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_payment_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_payment_status_check 
  CHECK (payment_status IN ('pending', 'proof_submitted', 'completed'));

-- Update existing pending payments to avoid constraint violation
UPDATE profiles SET payment_status = 'pending' WHERE payment_status NOT IN ('pending', 'proof_submitted', 'completed');