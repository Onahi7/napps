-- Drop triggers
DROP TRIGGER IF EXISTS profiles_search_vector_update ON profiles;

-- Drop functions
DROP FUNCTION IF EXISTS profiles_search_vector_update();

-- Drop search vector
DROP INDEX IF EXISTS idx_profiles_search;
ALTER TABLE profiles DROP COLUMN IF EXISTS search_vector;

-- Drop composite indexes
DROP INDEX IF EXISTS idx_bookings_dates;
DROP INDEX IF EXISTS idx_scans_validator_date;
DROP INDEX IF EXISTS idx_scans_user_date;

-- Drop unique indexes
DROP INDEX IF EXISTS idx_profiles_qr_code;
DROP INDEX IF EXISTS idx_users_email_lower;
DROP INDEX IF EXISTS idx_profiles_email_lower;

-- Drop payment reference indexes
DROP INDEX IF EXISTS idx_bookings_payment_reference;
DROP INDEX IF EXISTS idx_profiles_payment_reference;

-- Drop search indexes
DROP INDEX IF EXISTS idx_profiles_full_name_trgm;
DROP INDEX IF EXISTS idx_profiles_phone_trgm;