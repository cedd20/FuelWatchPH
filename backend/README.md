# Backend — FuelWatchPH

This folder contains a Python FastAPI backend service. The backend is the **single API surface** for the frontend: all client API requests must go through this service, and the backend talks to Supabase using server-side credentials (service role key).

## Development Setup

The project uses a shared Python virtual environment at the repository root (`.venv`).

### Install Dependencies

From the repository root:

```bash
pip install -r backend/requirements.txt
```

### Run the Backend (Development)

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --app-dir backend
```

The backend will be available at `http://localhost:8000`. The frontend should target `http://localhost:8000/api` for API requests.

## API Reference

### Health Check
- `GET /health` — Simple health check; returns `{"status": "ok"}`

### Reports (Price Reports)
- `POST /api/reports` — Submit a price report for a station
  - **Body**: `{ station_id, fuel_type, price, reported_by, timestamp }`
  - **Returns**: `{ status: "ok", saved: {...} }`

## Environment Variables

The backend reads from `backend/.env` (create from `.env.example`):

- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (NEVER expose to client)
- `BACKEND_HOST` — Host to bind to (default: `127.0.0.1`)
- `BACKEND_PORT` — Port to run on (default: `8000`)

## Architecture Notes

- **Authoritative writes**: The backend owns all database writes using the service role key.
- **Client isolation**: Clients only have the anon key and should never make direct Supabase calls for writes.
- **Verification**: Price reports, reputation changes, and sensitive operations are validated server-side.

## Testing

```bash
pytest backend/tests
```

## Expand the Backend

The current scaffold is minimal. Expand by:

- Adding more routes in `backend/app/api/routes.py`
- Implementing services in `backend/app/services/`
- Adding database repositories in `backend/app/repositories/`
- Persisting data to Supabase using the service role key
- Keeping seed data and schema fixtures in `backend/supabase/`
