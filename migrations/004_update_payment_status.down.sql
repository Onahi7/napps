-- Revert payment_status check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_payment_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_payment_status_check 
  CHECK (payment_status IN ('pending', 'completed'));

-- Update any proof_submitted statuses to pending
UPDATE profiles SET payment_status = 'pending' WHERE payment_status = 'proof_submitted';