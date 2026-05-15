-- Migration 006: User Verification System

-- 1. Add is_verified to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- 2. Create verification_requests table
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    id_type TEXT NOT NULL,
    id_number TEXT NOT NULL,
    id_front_url TEXT NOT NULL,
    id_back_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_correction')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Users can view their own requests
DROP POLICY IF EXISTS "Users can view own verification requests" ON verification_requests;
CREATE POLICY "Users can view own verification requests" 
ON verification_requests FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own requests
DROP POLICY IF EXISTS "Users can insert own verification requests" ON verification_requests;
CREATE POLICY "Users can insert own verification requests" 
ON verification_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admins can do anything
DROP POLICY IF EXISTS "Admins can manage all verification requests" ON verification_requests;
CREATE POLICY "Admins can manage all verification requests" 
ON verification_requests FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 5. Storage bucket for ID images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification-ids', 'verification-ids', false)
ON CONFLICT (id) DO NOTHING;

-- Policies for verification-ids bucket
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload own ID' AND tablename = 'objects') THEN
        CREATE POLICY "Users can upload own ID" ON storage.objects FOR INSERT 
        WITH CHECK (bucket_id = 'verification-ids' AND (auth.uid())::text = (storage.foldername(name))[1]);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own ID' AND tablename = 'objects') THEN
        CREATE POLICY "Users can read own ID" ON storage.objects FOR SELECT 
        USING (bucket_id = 'verification-ids' AND (auth.uid())::text = (storage.foldername(name))[1]);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all IDs' AND tablename = 'objects') THEN
        CREATE POLICY "Admins can read all IDs" ON storage.objects FOR SELECT 
        USING (bucket_id = 'verification-ids' AND EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ));
    END IF;
END $$;
