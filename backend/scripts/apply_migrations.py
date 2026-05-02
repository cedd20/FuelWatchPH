import os
import sys
from supabase import create_client
from dotenv import load_dotenv

# Try loading from local .env first, then fallback to backend/.env if running from root
if not load_dotenv():
    load_dotenv(dotenv_path="backend/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def apply_migration(file_path):
    print(f"Reading migration file: {file_path}")
    with open(file_path, 'r') as f:
        sql = f.read()
    
    print("Applying migration...")
    try:
        # Supabase-py doesn't have a direct 'execute_sql' method for raw SQL
        # We usually use the 'rpc' method or an external tool.
        # However, for simple DDL, we can try using the 'query' endpoint if exposed,
        # but supabase-py v2+ doesn't expose it easily for DDL.
        # So we'll advise the user to use the SQL Editor.
        print("Note: Automated DDL execution via supabase-py is restricted.")
        print("Please copy the contents of 002_notifications_and_profile_fields.sql into the Supabase SQL Editor.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    apply_migration("backend/supabase/migrations/002_notifications_and_profile_fields.sql")
