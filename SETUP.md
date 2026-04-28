# FuelWatchPH — Setup & Development Guide

This document provides a complete guide to setting up and running the FuelWatchPH project locally.

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/cedd20/FuelWatchPH.git
cd FuelWatchPH
npm install
```

### 2. Configure Environment

#### Frontend (`client/.env`)

```bash
cd client
cp .env.example .env
# Edit .env and add your Supabase credentials
```

Example `client/.env`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BACKEND_API_URL=http://localhost:8000/api
```

#### Backend (`backend/.env`)

```bash
cd ../backend
cp .env.example .env
# Edit .env and add your Supabase service role key
```

Example `backend/.env`:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service-role-xxxxxxxxxxxxxxxx
BACKEND_HOST=127.0.0.1
BACKEND_PORT=8000
```

### 3. Install Backend Dependencies

From the repository root:

```bash
pip install -r backend/requirements.txt
```

### 4. Run Backend & Frontend

#### Backend (Terminal 1)

From the repository root:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --app-dir backend
```

Backend will be available at `http://localhost:8000`

#### Frontend (Terminal 2)

From the repository root:

```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

## Project Structure

```
FuelWatchPH/
├── client/                   # React + Vite frontend application
│   ├── src/
│   │   ├── app/              # Global app config and routing
│   │   ├── features/         # Feature-oriented modules
│   │   ├── lib/              # Utility libraries (Supabase client, etc)
│   │   ├── shared/           # Shared UI components
│   │   └── styles/           # Global styles and Tailwind config
│   ├── .env.example          # Frontend env template
│   ├── .env                  # Frontend env (git-ignored)
│   ├── package.json          # Frontend dependencies
│   └── vite.config.js        # Vite configuration
├── backend/                  # Python FastAPI backend service
│   ├── supabase/             # Supabase schema & seed data
│   ├── app/
│   │   ├── main.py           # FastAPI app entry point
│   │   ├── api/routes.py     # API routes
│   │   ├── models/schemas.py # Pydantic models
│   │   ├── services/         # Business logic
│   │   ├── repositories/     # Data access layer
│   │   └── core/config.py    # Configuration
│   ├── tests/test_basic.py   # Backend tests
│   ├── .env.example          # Backend env template
│   ├── .env                  # Backend env (git-ignored)
│   ├── requirements.txt      # Python dependencies
│   └── README.md             # Backend documentation
├── archive/                  # Archived reference-only files
│   ├── figma/                # Archived design system
│   └── client-legacy/        # Archived legacy client files
├── .github/agent-docs/       # AI agent guidance
│   ├── rules.md
│   ├── architecture.md
│   └── readme.md
├── AGENTS.md                 # Top-level agent guidance
├── PROJECT_STRUCTURE.md      # Detailed structure reference
├── SETUP.md                  # This file
├── README.md                 # Main project README
└── package.json              # Root workspace configuration
```

## API Architecture

The **frontend never calls Supabase directly** for sensitive operations. Instead:

1. **Frontend** sends requests to `http://localhost:8000/api`
2. **Backend** receives requests, validates them, and optionally writes to Supabase using the service role key
3. **Supabase** stores data and provides auth/realtime features

### API Endpoints

#### Health

- `GET /health` → `{ "status": "ok" }`

#### Reports

- `POST /api/reports`
  - Body: `{ station_id, fuel_type, price, reported_by, timestamp }`
  - Returns: `{ status: "ok", saved: {...} }`

## Key Environment Variables

### Frontend (client/.env)

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anon key | (provided by Supabase) |
| `VITE_BACKEND_API_URL` | Backend API base URL | `http://localhost:8000/api` |

### Backend (backend/.env)

| Variable | Purpose | Example |
|----------|---------|---------|
| `SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (PRIVATE) | (generated in Supabase dashboard) |
| `BACKEND_HOST` | Host to bind to | `127.0.0.1` |
| `BACKEND_PORT` | Port to run on | `8000` |

## Running Tests

### Backend Tests

```bash
pytest backend/tests
```

## Troubleshooting

### Port Already in Use

If port 8000 or 5173 is already in use:

**For Backend** (8000):
```bash
uvicorn app.main:app --reload --port 9000 --app-dir backend
# Then update VITE_BACKEND_API_URL in client/.env
```

**For Frontend** (5173):
```bash
npm run dev -- --port 3000
```

### Missing Supabase Credentials

- Get your Supabase URL and anon key from the Supabase dashboard
- For service role key, go to Project Settings → API → Service Role Key (keep secret!)
- Never commit real credentials; use `.env.example` as a template

### Backend Import Errors

Ensure the virtual environment is activated and dependencies are installed:

```bash
pip install -r backend/requirements.txt
```

## Development Workflow

1. Make changes in `client/` or `backend/`
2. Frontend changes hot-reload automatically in the browser
3. Backend changes require a manual restart (Uvicorn's `--reload` should detect file changes)
4. Test changes: run `pytest backend/tests` or add client tests in `client/`
5. Lint/Format: run `npm run lint` from root
6. Commit with descriptive messages using conventional commits

## Deployment

For production:

- **Frontend**: Build with `npm run build` and host on Vercel/Netlify/CloudFlare Pages
- **Backend**: Deploy Python service to Heroku/Railway/Fly.io/AWS Lambda
- **Database**: Use managed Supabase instance

See individual README files (`client/README.md`, `backend/README.md`) for more details.

## Contributing

See [AGENTS.md](AGENTS.md) and [README.md](README.md) for contribution guidelines.

---

For more details on architecture, see [.github/agent-docs/architecture.md](.github/agent-docs/architecture.md).
For rules and conventions, see [.github/agent-docs/rules.md](.github/agent-docs/rules.md).
