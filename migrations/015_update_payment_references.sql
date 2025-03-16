-- Update payment references to use phone numbers
UPDATE profiles p
SET payment_reference = u.phone
FROM users u
WHERE p.id = u.id
AND p.payment_reference IS NOT NULL;

-- Drop the unique constraint if it exists
DROP INDEX IF EXISTS idx_profiles_payment_reference;