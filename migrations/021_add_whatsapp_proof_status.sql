-- Update payment_status constraint to include whatsapp_proof_submitted
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_payment_status_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_payment_status_check 
CHECK (payment_status IN ('pending', 'whatsapp_proof_submitted', 'completed'));