-- Add phone number search index
CREATE INDEX IF NOT EXISTS idx_profiles_phone_trgm ON profiles USING gin (phone gin_trgm_ops);

-- Add full name search index
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm ON profiles USING gin (full_name gin_trgm_ops);

-- Add unique constraint for email across users and profiles
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_lower ON profiles (LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));

-- Add index for payment reference
CREATE INDEX IF NOT EXISTS idx_profiles_payment_reference ON profiles (payment_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_reference ON bookings (payment_reference);

-- Add unique constraint for QR codes
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_qr_code ON profiles (qr_code) WHERE qr_code IS NOT NULL;

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_scans_user_date ON scans (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_validator_date ON scans (scanned_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings (check_in_date, check_out_date);

-- Add text search capabilities
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles USING gin(search_vector);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION profiles_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.full_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.email, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.organization, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.state, '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(NEW.chapter, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search vector
CREATE TRIGGER profiles_search_vector_update
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION profiles_search_vector_update();

-- Update existing profiles
UPDATE profiles SET search_vector = 
  setweight(to_tsvector('english', COALESCE(full_name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(email, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(organization, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(state, '')), 'D') ||
  setweight(to_tsvector('english', COALESCE(chapter, '')), 'D');