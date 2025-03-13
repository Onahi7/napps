-- Drop triggers first
DROP TRIGGER IF EXISTS update_resources_updated_at ON resources;
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
DROP TRIGGER IF EXISTS update_hotels_updated_at ON hotels;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop trigger function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables in correct order
DROP TABLE IF EXISTS scans;
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS hotels;
DROP TABLE IF EXISTS config;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS users;

-- Drop extensions
DROP EXTENSION IF EXISTS pg_trgm;
DROP EXTENSION IF EXISTS uuid-ossp;