import os
from pathlib import Path

from supabase import create_client, Client, ClientOptions
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]
ROOT_DIR = BACKEND_DIR.parent

load_dotenv(dotenv_path=BACKEND_DIR / ".env")
load_dotenv(dotenv_path=ROOT_DIR / ".env")

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
