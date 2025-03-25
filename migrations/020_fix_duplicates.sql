-- Remove duplicate profiles while keeping the most recently updated one
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY phone ORDER BY updated_at DESC) as row_num
  FROM profiles p
  JOIN users u ON p.id = u.id
)
DELETE FROM profiles 
WHERE id IN (
  SELECT id 
  FROM duplicates 
  WHERE row_num > 1
);

-- Add unique constraint on phone number in users table
ALTER TABLE users 
ADD CONSTRAINT users_phone_unique UNIQUE (phone);

-- Add foreign key constraint to ensure profile-user relationship integrity
ALTER TABLE profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES users(id) 
ON DELETE CASCADE;