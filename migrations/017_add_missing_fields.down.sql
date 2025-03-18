-- Remove indexes first
DROP INDEX IF EXISTS idx_profiles_accommodation_status;
DROP INDEX IF EXISTS idx_profiles_reference_code;

-- Remove constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_unique_id_format;

-- Remove columns
ALTER TABLE profiles
DROP COLUMN IF EXISTS accommodation_status,
DROP COLUMN IF EXISTS reference_code,
DROP COLUMN IF EXISTS school_city,
DROP COLUMN IF EXISTS raw_user_meta_data;