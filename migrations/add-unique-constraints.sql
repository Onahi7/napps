-- Add unique constraints for email and phone
DROP INDEX IF EXISTS idx_profiles_email;
DROP INDEX IF EXISTS idx_profiles_phone;

-- Create unique indexes
CREATE UNIQUE INDEX idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;

-- Add check constraints to ensure valid formats
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_email_format;
ALTER TABLE profiles ADD CONSTRAINT check_email_format 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_phone_format;
ALTER TABLE profiles ADD CONSTRAINT check_phone_format 
  CHECK (phone ~* '^\d{10,11}$');