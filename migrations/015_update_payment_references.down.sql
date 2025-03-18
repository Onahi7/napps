-- Recreate the unique index for payment references
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_payment_reference ON profiles(payment_reference);