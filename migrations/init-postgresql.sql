-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'participant',
  state TEXT,
  lga TEXT,
  chapter TEXT,
  organization TEXT,
  position TEXT,
  avatar_url TEXT,
  payment_status TEXT DEFAULT 'pending',
  payment_reference TEXT,
  payment_amount NUMERIC,
  payment_date TIMESTAMP WITH TIME ZONE,
  accreditation_status TEXT DEFAULT 'pending',
  accreditation_date TIMESTAMP WITH TIME ZONE,
  qr_code TEXT,
  unique_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create config table
CREATE TABLE IF NOT EXISTS config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  hotel_id UUID,
  check_in_date DATE,
  check_out_date DATE,
  status TEXT DEFAULT 'pending',
  payment_reference TEXT,
  payment_status TEXT DEFAULT 'pending',
  total_amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hotels table
CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  price_per_night NUMERIC NOT NULL,
  image_url TEXT,
  available_rooms INTEGER DEFAULT 0,
  amenities JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  type TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scans table for accreditation
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  scanned_by UUID REFERENCES users(id),
  scan_type TEXT DEFAULT 'accreditation',
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to generate unique ID for profiles
CREATE OR REPLACE FUNCTION generate_profile_unique_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.unique_id := 'NAPPS-' || SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 8);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for unique ID generation
CREATE TRIGGER profile_unique_id_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_profile_unique_id();

-- Insert default config values
INSERT INTO config (key, value, description) VALUES 
  ('registrationAmount', '15000', 'Registration fee amount in Naira'),
  ('conference_name', '"6th Annual NAPPS North Central Zonal Education Summit 2025"', 'Name of the conference'),
  ('conference_date', '"May 21-22, 2025"', 'Date of the conference'),
  ('conference_venue', '"Lafia City Hall, Lafia"', 'Venue of the conference'),
  ('conference_theme', '"ADVANCING INTEGRATED TECHNOLOGY FOR SUSTAINABLE PRIVATE EDUCATION PRACTICE"', 'Theme of the conference'),
  ('payment_split_code', 'null', 'Paystack split code for payment distribution')
ON CONFLICT (key) DO NOTHING;