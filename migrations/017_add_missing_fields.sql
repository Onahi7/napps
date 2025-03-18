-- Add missing fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS accommodation_status VARCHAR(20) DEFAULT 'not_booked' 
  CHECK (accommodation_status IN ('not_booked', 'booked', 'checked_in')),
ADD COLUMN IF NOT EXISTS reference_code VARCHAR(255),
ADD COLUMN IF NOT EXISTS school_city TEXT,
ADD COLUMN IF NOT EXISTS raw_user_meta_data JSONB;

-- Add constraint for unique_id format
ALTER TABLE profiles
ADD CONSTRAINT check_unique_id_format 
  CHECK (unique_id ~ '^NAPPS-[A-Za-z0-9]{8}$');

-- Create index for accommodation status
CREATE INDEX IF NOT EXISTS idx_profiles_accommodation_status 
  ON profiles(accommodation_status);

-- Create index for reference_code
CREATE INDEX IF NOT EXISTS idx_profiles_reference_code 
  ON profiles(reference_code);