-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT UNIQUE,
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
  unique_id TEXT
);

-- Create RLS policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own profile
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

-- Policy for users to update their own profile
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Policy for users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
  ON profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Policy for admins to update all profiles
CREATE POLICY "Admins can update all profiles" 
  ON profiles FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if a profile already exists for this user
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = new.id) THEN
    -- Update the existing profile with any new metadata
    UPDATE public.profiles 
    SET 
      email = COALESCE(new.email, profiles.email),
      full_name = COALESCE(new.raw_user_meta_data->>'full_name', profiles.full_name),
      phone = COALESCE(new.raw_user_meta_data->>'phone', profiles.phone),
      updated_at = NOW()
    WHERE id = new.id;
    RETURN new;
  END IF;
  
  -- Insert new profile with minimal required fields
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    phone,
    role
  ) VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    'participant'
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

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create config table
CREATE TABLE IF NOT EXISTS config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT
);

-- Insert default config values
INSERT INTO config (key, value, description)
VALUES 
  ('registrationAmount', '15000', 'Registration fee amount in Naira'),
  ('conference_name', '"6th Annual NAPPS North Central Zonal Education Summit 2025"', 'Name of the conference'),
  ('conference_date', '"May 21-22, 2025"', 'Date of the conference'),
  ('conference_venue', '"Lafia City Hall, Lafia"', 'Venue of the conference'),
  ('conference_theme', '"ADVANCING INTEGRATED TECHNOLOGY FOR SUSTAINABLE PRIVATE EDUCATION PRACTICE"', 'Theme of the conference'),
  ('payment_split_code', 'null', 'Paystack split code for payment distribution')
ON CONFLICT (key) DO NOTHING;

-- Create RLS policies for config
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- Policy for all users to view config
CREATE POLICY "All users can view config" 
  ON config FOR SELECT 
  TO authenticated, anon
  USING (true);

-- Policy for admins to update config
CREATE POLICY "Admins can update config" 
  ON config FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create function to generate unique ID for new users
CREATE OR REPLACE FUNCTION public.generate_unique_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.unique_id := 'NAPPS-' || SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 8);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to generate unique ID for new users
DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
BEFORE INSERT ON profiles
FOR EACH ROW EXECUTE PROCEDURE public.generate_unique_id();

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id),
  hotel_id UUID,
  check_in_date DATE,
  check_out_date DATE,
  status TEXT DEFAULT 'pending',
  payment_reference TEXT,
  payment_status TEXT DEFAULT 'pending',
  total_amount NUMERIC
);

-- Create RLS policies for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own bookings
CREATE POLICY "Users can view own bookings" 
  ON bookings FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for admins to view all bookings
CREATE POLICY "Admins can view all bookings" 
  ON bookings FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create hotels table
CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  price_per_night NUMERIC NOT NULL,
  image_url TEXT,
  available_rooms INTEGER DEFAULT 0,
  amenities JSONB
);

-- Create RLS policies for hotels
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;

-- Policy for all users to view hotels
CREATE POLICY "All users can view hotels" 
  ON hotels FOR SELECT 
  TO authenticated, anon
  USING (true);

-- Policy for admins to manage hotels
CREATE POLICY "Admins can manage hotels" 
  ON hotels FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  type TEXT,
  is_public BOOLEAN DEFAULT false
);

-- Create RLS policies for resources
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Policy for all authenticated users to view public resources
CREATE POLICY "All users can view public resources" 
  ON resources FOR SELECT 
  TO authenticated
  USING (is_public = true);

-- Policy for admins to manage resources
CREATE POLICY "Admins can manage resources" 
  ON resources FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create scans table for accreditation
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id),
  scanned_by UUID REFERENCES profiles(id),
  scan_type TEXT DEFAULT 'accreditation',
  location TEXT,
  notes TEXT
);

-- Create RLS policies for scans
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own scans
CREATE POLICY "Users can view own scans" 
  ON scans FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for validators to create scans
CREATE POLICY "Validators can create scans" 
  ON scans FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND (profiles.role = 'validator' OR profiles.role = 'admin')
    )
  );

-- Policy for admins to view all scans
CREATE POLICY "Admins can view all scans" 
  ON scans FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

