from dotenv import load_dotenv
import os
from supabase import create_client

load_dotenv("backend/.env")

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_ANON_KEY")

print("URL:", url)
print("KEY:", key[:10] + "..." if key else None)

try:
    supabase = create_client(url, key)
    res = supabase.table("stations").select("*").limit(1).execute()
    print("Success! Data:", res.data)
except Exception as e:
    import traceback
    traceback.print_exc()
