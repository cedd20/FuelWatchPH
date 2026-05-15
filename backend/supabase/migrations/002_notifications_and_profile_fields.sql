-- Migration 002: Notifications and User Profile enhancements

-- Update user_profiles table with missing fields
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Leaderboard view
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  p.id,
  p.username,
  p.reputation,
  p.avatar_url,
  p.bio,
  COUNT(r.id) as total_updates
FROM 
  user_profiles p
LEFT JOIN 
  price_reports r ON p.id = r.reported_by
GROUP BY 
  p.id, p.username, p.reputation, p.avatar_url, p.bio;

-- Function to handle new user signup automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_username TEXT;
BEGIN
  v_username := COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  
  -- Insert into user_profiles, handling both ID and username conflicts
  -- If username exists, we fallback to a more unique username (id-based)
  INSERT INTO public.user_profiles (id, username, reputation)
  VALUES (new.id, v_username, 0)
  ON CONFLICT (id) DO NOTHING;
  
  -- If the profile wasn't created (likely due to username conflict), 
  -- try again with a guaranteed unique username
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = new.id) THEN
    INSERT INTO public.user_profiles (id, username, reputation)
    VALUES (new.id, v_username || '_' || substring(new.id::text, 1, 5), 0)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── STORAGE SETUP ──
-- Enable storage if not already enabled (this is usually enabled by default)
-- Create 'avatars' bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read avatars
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'objects') THEN
        CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload their own avatar' AND tablename = 'objects') THEN
        CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT 
        WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own avatar' AND tablename = 'objects') THEN
        CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE
        USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
    END IF;
END $$;
