-- Migration: Add support for phone number login and new profile fields
-- Date: 2025-03-12

-- Add new school-related fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS school_name TEXT,
ADD COLUMN IF NOT EXISTS school_address TEXT,
ADD COLUMN IF NOT EXISTS school_city TEXT,
ADD COLUMN IF NOT EXISTS school_state TEXT,
ADD COLUMN IF NOT EXISTS school_type TEXT,
ADD COLUMN IF NOT EXISTS napps_position TEXT,
ADD COLUMN IF NOT EXISTS napps_chapter TEXT;

-- Create index on phone number for faster lookups during login
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- Ensure phone numbers are unique
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS unique_phone;
ALTER TABLE profiles ADD CONSTRAINT unique_phone UNIQUE (phone);

-- Update the handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
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
