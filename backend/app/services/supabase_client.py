import os
from supabase import create_client, Client, ClientOptions
from dotenv import load_dotenv

# Try loading from local .env first, then fallback to backend/.env if running from root
if not load_dotenv():
    load_dotenv(dotenv_path="backend/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment")

# Anon client for read operations (subject to RLS)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Service role client for trusted server-side writes (bypasses RLS).
# Falls back to anon key if SUPABASE_SERVICE_ROLE_KEY is not set.
supabase_admin: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY,
)

def get_authenticated_client(jwt_token: str) -> Client:
    """
    Returns a Supabase client with the user's JWT set for RLS-gated writes.
    """
    return create_client(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        options=ClientOptions(
            headers={"Authorization": f"Bearer {jwt_token}"}
        )
    )
