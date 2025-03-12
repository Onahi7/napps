-- Add missing RLS policy for profile inserts
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Update the handle_new_user function to better handle existing users
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
    RAISE LOG 'Error in handle_new_user function: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;