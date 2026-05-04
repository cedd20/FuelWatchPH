import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.services.supabase_client import supabase_admin

sql = """
ALTER TABLE price_verifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_price_verifications_user_id ON price_verifications(user_id);
ALTER TABLE price_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anyone to read verifications" ON price_verifications;
CREATE POLICY "Allow anyone to read verifications" ON price_verifications FOR SELECT TO authenticated, anon USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to insert verifications" ON price_verifications;
CREATE POLICY "Allow authenticated users to insert verifications" ON price_verifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
"""

try:
    # Supabase-py doesn't have a direct 'execute' for raw SQL in the same way the CLI does,
    # but we can use the rpc method if we have a custom function, or just use the REST API.
    # However, for DDL, the best way is usually the SQL Editor.
    # Let's see if we can use 'postgrest' to run it.
    
    # Actually, supabase-py doesn't support raw SQL DDL directly.
    # I will have to ask the user to paste this into the Supabase SQL Editor.
    print("Please paste the following SQL into your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql):")
    print(sql)
except Exception as e:
    print(f"Error: {e}")
