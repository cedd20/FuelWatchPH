import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Try loading from local .env first, then fallback to backend/.env if running from root
if not load_dotenv():
    load_dotenv(dotenv_path="backend/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment")

# Anon client for read operations
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def get_authenticated_client(jwt_token: str) -> Client:
    """
    Returns a Supabase client with the user's JWT set for RLS-gated writes.
    Uses the auth header approach compatible with Supabase Python v2.
    """
    from supabase.lib.client_options import ClientOptions
    client = create_client(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        options=ClientOptions(
            headers={"Authorization": f"Bearer {jwt_token}"}
        )
    )
    return client
