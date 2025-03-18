-- NAPPS Summit - Clean Database Schema for New Cluster
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles Table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'validator', 'participant')),
    school_name TEXT,
    school_state TEXT,
    napps_chapter TEXT,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'proof_submitted', 'completed')),
    payment_reference TEXT UNIQUE,
    payment_amount INTEGER,
    payment_date TIMESTAMPTZ,
    payment_proof TEXT,
    accreditation_status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (accreditation_status IN ('pending', 'completed')),
    accreditation_date TIMESTAMPTZ,
    qr_code TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(full_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(email, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(school_name, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(napps_chapter, '')), 'D')
    ) STORED
);

-- Config Table
CREATE TABLE config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hotels Table
CREATE TABLE hotels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    price_per_night INTEGER NOT NULL,
    available_rooms INTEGER NOT NULL DEFAULT 0,
    amenities JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings Table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    payment_reference TEXT UNIQUE,
    payment_status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'completed')),
    total_amount INTEGER NOT NULL,
    payment_proof TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scans Table
CREATE TABLE scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    scanned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    scan_type TEXT NOT NULL CHECK (scan_type IN ('accreditation', 'attendance')),
    location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accreditations Table
CREATE TABLE accreditations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    accreditation_date DATE,
    accreditation_time TIME,
    validator UUID REFERENCES profiles(id),
    location TEXT,
    badge_collected BOOLEAN DEFAULT FALSE,
    badge_collection_time TIMESTAMPTZ,
    materials_collected BOOLEAN DEFAULT FALSE,
    materials_collection_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_profiles_email ON profiles USING btree (email);
CREATE INDEX idx_profiles_payment_status ON profiles USING btree (payment_status);
CREATE INDEX idx_profiles_accreditation_status ON profiles USING btree (accreditation_status);
CREATE INDEX idx_profiles_role ON profiles USING btree (role);
CREATE INDEX idx_profiles_search ON profiles USING gin(search_vector);
CREATE INDEX idx_profiles_phone_trgm ON profiles USING gin (phone gin_trgm_ops);
CREATE INDEX idx_profiles_full_name_trgm ON profiles USING gin (full_name gin_trgm_ops);
CREATE INDEX idx_bookings_user_id ON bookings USING btree (user_id);
CREATE INDEX idx_bookings_hotel_id ON bookings USING btree (hotel_id);
CREATE INDEX idx_bookings_dates ON bookings USING btree (check_in_date, check_out_date);
CREATE INDEX idx_scans_user_id ON scans USING btree (user_id);
CREATE INDEX idx_scans_scanned_by ON scans USING btree (scanned_by);
CREATE INDEX idx_scans_created_at ON scans USING btree (created_at DESC);
CREATE INDEX idx_accreditations_user_id ON accreditations USING btree (user_id);
CREATE INDEX idx_accreditations_validator ON accreditations USING btree (validator);

-- Updated_at Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Updated_at Triggers
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

CREATE TRIGGER update_accreditations_updated_at
    BEFORE UPDATE ON accreditations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Initial Data
INSERT INTO config (key, value, description)
VALUES 
    ('registrationAmount', '"20000"'::jsonb, 'Registration fee amount in Naira'),
    ('bankDetails', '{"bankName": "Unity Bank", "accountName": "N.A.A.PS NASARAWA STATE", "accountNumber": "0017190877"}'::jsonb, 'Bank transfer details'),
    ('eventDates', '{"startDate": "2025-03-21", "endDate": "2025-03-22"}'::jsonb, 'Summit date range')
ON CONFLICT (key) DO NOTHING;

-- Create an initial admin account (change password in production)
INSERT INTO users (email, password_hash) 
VALUES ('admin@napps.com', '$2a$12$K8HFqr.1ge0GH.qTP1GGBOpYx6T8u3vyX0Y2HB8cnbVpJEk0yDgMu')
ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (
    id, 
    email, 
    full_name, 
    phone, 
    role, 
    payment_status, 
    accreditation_status
)
SELECT 
    id, 
    email, 
    'Admin User', 
    '08012345678', 
    'admin', 
    'completed', 
    'completed'
FROM users 
WHERE email = 'admin@napps.com'
ON CONFLICT (email) DO NOTHING;