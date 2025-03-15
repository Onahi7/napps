-- Backfill payment references for existing users
-- Generate references for users who don't have one but have completed payments
UPDATE profiles
SET payment_reference = 'NAPPS-2025-' || SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 4)
WHERE payment_reference IS NULL 
AND payment_status = 'completed';

-- Generate references for users who don't have one but have submitted proof
UPDATE profiles
SET payment_reference = 'NAPPS-2025-' || SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 4)
WHERE payment_reference IS NULL 
AND payment_status = 'proof_submitted';

-- Generate references for users who don't have one and are pending
UPDATE profiles
SET payment_reference = 'NAPPS-2025-' || SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 4)
WHERE payment_reference IS NULL 
AND payment_status = 'pending';

-- Create index for payment reference if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_profiles_payment_reference ON profiles(payment_reference);

-- Add NOT NULL constraint after backfilling
ALTER TABLE profiles ALTER COLUMN payment_reference SET NOT NULL;