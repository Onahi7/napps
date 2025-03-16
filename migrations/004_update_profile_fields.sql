-- Add new columns for school information
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS school_name TEXT,
ADD COLUMN IF NOT EXISTS school_address TEXT,
ADD COLUMN IF NOT EXISTS school_state TEXT,
ADD COLUMN IF NOT EXISTS napps_chapter TEXT;

-- Update existing columns to support registration data
ALTER TABLE profiles
ALTER COLUMN state DROP NOT NULL,
ALTER COLUMN lga DROP NOT NULL,
ALTER COLUMN chapter DROP NOT NULL,
ALTER COLUMN organization DROP NOT NULL,
ALTER COLUMN position DROP NOT NULL;