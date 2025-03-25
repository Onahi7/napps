-- Revert payment_status constraint to original state
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_payment_status_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_payment_status_check 
CHECK (payment_status IN ('pending', 'completed'));