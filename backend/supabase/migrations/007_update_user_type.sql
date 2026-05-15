-- 007_update_user_type.sql
-- Add user_type column to user_profiles
-- 0 = Admin, 1 = User

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS user_type INTEGER;

-- Migrate existing roles to user_type
UPDATE user_profiles 
SET user_type = CASE 
    WHEN role = 'admin' THEN 0 
    ELSE 1 
END;

-- Set default for future records
ALTER TABLE user_profiles ALTER COLUMN user_type SET DEFAULT 1;

-- Update RLS policies to use user_type
-- Note: We'll keep the role column for now to avoid breaking existing code immediately, 
-- but we should transition to user_type.

-- Update stations policies
DROP POLICY IF EXISTS "Owners and mods can update stations" ON stations;
CREATE POLICY "Owners and mods can update stations" ON stations FOR UPDATE USING (
  created_by = auth.uid() OR
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (role IN ('moderator', 'admin') OR user_type = 0))
);

-- Update price reports policies
DROP POLICY IF EXISTS "Owners and mods can update price reports" ON price_reports;
CREATE POLICY "Owners and mods can update price reports" ON price_reports FOR UPDATE USING (
  reported_by = auth.uid() OR
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (role IN ('moderator', 'admin') OR user_type = 0))
);
