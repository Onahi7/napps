-- NAPPS Summit - Consolidated Database Schema
-- This file combines all migrations into a single setup script

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table with all fields
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'validator', 'participant')),
  state TEXT,
  lga TEXT,
  chapter TEXT,
  organization TEXT,
  position TEXT,
  avatar_url TEXT,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'proof_submitted', 'completed')),
  payment_reference TEXT UNIQUE,
  payment_amount INTEGER,
  payment_date TIMESTAMP WITH TIME ZONE,
  payment_proof TEXT,
  accreditation_status TEXT NOT NULL DEFAULT 'pending' CHECK (accreditation_status IN ('pending', 'completed')),
  accreditation_date TIMESTAMP WITH TIME ZONE,
  qr_code TEXT,
  unique_id TEXT UNIQUE,
  -- School-related fields from phone-login-update.sql
  school_name TEXT,
  school_address TEXT,
  school_city TEXT,
  school_state TEXT,
  school_type TEXT,
  napps_position TEXT,
  napps_chapter TEXT,
  -- Search vector for full-text search
  search_vector tsvector,
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

-- Create hotels table
CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  price_per_night INTEGER NOT NULL,
  image_url TEXT,
  available_rooms INTEGER NOT NULL DEFAULT 0,
  amenities JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  payment_reference TEXT UNIQUE,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed')),
  total_amount INTEGER NOT NULL,
  payment_proof VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  type TEXT DEFAULT 'document',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scans table
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scanned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('accreditation', 'attendance')),
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add all indexes from various migration files
-- Core indexes from 001_init_postgresql.sql
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles USING btree (email);
CREATE INDEX IF NOT EXISTS idx_profiles_payment_status ON profiles USING btree (payment_status);
CREATE INDEX IF NOT EXISTS idx_profiles_accreditation_status ON profiles USING btree (accreditation_status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles USING btree (role);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_hotel_id ON bookings USING btree (hotel_id);
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_scans_scanned_by ON scans USING btree (scanned_by);

-- Additional indexes from 002_add_unique_constraints.sql
CREATE INDEX IF NOT EXISTS idx_profiles_phone_trgm ON profiles USING gin (phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm ON profiles USING gin (full_name gin_trgm_ops);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_lower ON profiles (LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_profiles_payment_reference ON profiles (payment_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_reference ON bookings (payment_reference);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_qr_code ON profiles (qr_code) WHERE qr_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scans_user_date ON scans (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_validator_date ON scans (scanned_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings (check_in_date, check_out_date);

-- Phone login index from phone-login-update.sql
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
ALTER TABLE profiles ADD CONSTRAINT unique_phone UNIQUE (phone);

-- Search index
CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles USING gin(search_vector);

-- Create function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to update search vector
CREATE OR REPLACE FUNCTION profiles_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.full_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.email, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.organization, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.state, '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(NEW.chapter, '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(NEW.school_name, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.napps_chapter, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Handler for new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if a profile already exists for this user
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = new.id) THEN
    RETURN new;
  END IF;
  
  -- Insert new profile with minimal required fields
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    phone,
    role,
    school_name,
    school_address,
    school_city,
    school_state,
    school_type,
    napps_position,
    napps_chapter
  ) VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    'participant',
    COALESCE(new.raw_user_meta_data->>'school_name', ''),
    COALESCE(new.raw_user_meta_data->>'school_address', ''),
    COALESCE(new.raw_user_meta_data->>'school_city', ''),
    COALESCE(new.raw_user_meta_data->>'school_state', ''),
    COALESCE(new.raw_user_meta_data->>'school_type', ''),
    COALESCE(new.raw_user_meta_data->>'napps_position', ''),
    COALESCE(new.raw_user_meta_data->>'napps_chapter', '')
  );
  
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log error details to Postgres logs
    RAISE LOG 'Error in handle_new_user function: %', SQLERRM;
    -- Return new user anyway to prevent auth signup failure
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create all triggers
-- Triggers for updated_at timestamps
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotels_updated_at
  BEFORE UPDATE ON hotels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for search vector updates
CREATE TRIGGER profiles_search_vector_update
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION profiles_search_vector_update();

-- Insert initial admin account
-- Note: Replace with a secure default password in production
INSERT INTO users (email, password_hash) 
VALUES ('admin@napps.com', '$2a$10$xJwA9OJIHiSbvJG3sjmb1ORpj.i4QrwZxUDdJU19GhZZN9L3wE8jO') 
ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (id, email, full_name, phone, role, payment_status, accreditation_status) 
SELECT id, email, 'Admin User', '08012345678', 'admin', 'completed', 'completed' 
FROM users WHERE email = 'admin@napps.com'
ON CONFLICT (email) DO NOTHING;

-- Initialize NAPPS summit configuration
INSERT INTO config (key, value, description)
VALUES 
  ('registrationAmount', '15000', 'Registration fee amount in Naira'),
  ('bankDetails', '{"name": "NAPPS Summit Account", "bank": "First Bank", "number": "1234567890"}', 'Bank details for manual transfers'),
  ('eventDates', '{"startDate": "2025-05-21", "endDate": "2025-05-22"}', 'Summit date range')
ON CONFLICT (key) DO NOTHING;