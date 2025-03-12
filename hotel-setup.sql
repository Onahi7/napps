-- Create hotels table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  price_per_night INTEGER NOT NULL,
  price_category TEXT NOT NULL CHECK (price_category IN ('economy', 'standard', 'premium')),
  distance_from_venue DECIMAL(5,2) NOT NULL,
  rating DECIMAL(3,1) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  image_url TEXT,
  available_rooms INTEGER DEFAULT 0,
  amenities TEXT[] DEFAULT '{}',
  contact_phone TEXT,
  contact_whatsapp TEXT,
  featured BOOLEAN DEFAULT false
);

-- Create bookings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_type TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  total_nights INTEGER NOT NULL,
  price_per_night INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  special_requests TEXT,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed')) DEFAULT 'pending',
  payment_reference TEXT
);

-- Create function to decrement available rooms
CREATE OR REPLACE FUNCTION decrement_available_rooms(hotel_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.hotels
  SET available_rooms = GREATEST(0, available_rooms - 1)
  WHERE id = hotel_id_param;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for hotels
CREATE POLICY "Hotels are viewable by everyone"
  ON public.hotels FOR SELECT
  USING (true);

CREATE POLICY "Hotels are insertable by admins only"
  ON public.hotels FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Hotels are updatable by admins only"
  ON public.hotels FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Hotels are deletable by admins only"
  ON public.hotels FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

-- Create policies for bookings
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
  ON public.bookings FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Users can insert their own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all bookings"
  ON public.bookings FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

