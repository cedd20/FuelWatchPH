---
name: AGENTS
description: >-
  Project-level guidance for AI coding agents. Minimal, actionable, and
  link-first. Place this file at the repository root so agents and humans can
  quickly discover workspace conventions.
---

# AGENTS: FuelWatchPH

Purpose: Help coding agents work safely and quickly in this repository with
accurate commands, architecture boundaries, and link-first references.

Quick Links
- Root docs: [README.md](README.md), [SETUP.md](SETUP.md), [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- Frontend app: [client/README.md](client/README.md)
- Backend service: [backend/README.md](backend/README.md)
- Agent architecture/rules: [.github/agent-docs/architecture.md](.github/agent-docs/architecture.md), [.github/agent-docs/rules.md](.github/agent-docs/rules.md)
- Database schema/seeds: [backend/supabase/migrations/001_initial_schema.sql](backend/supabase/migrations/001_initial_schema.sql), [backend/supabase/seed.sql](backend/supabase/seed.sql)
- Archive scope (reference-only): [archive/README.md](archive/README.md)

Verified Commands
- Install workspace deps (root): `npm install`
- Start frontend dev server (root): `npm run dev`
- Build frontend (root): `npm run build`
- Preview frontend build (root): `npm run preview`
- Lint frontend (root): `npm run lint --workspace=@fuelwatchph/client`
- Install backend deps (root): `pip install -r backend/requirements.txt`
- Run backend (root): `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --app-dir backend`
- Run backend tests (root): `pytest backend/tests`

Architecture Boundaries
- Monorepo with active runtime code in `client/` and `backend/`; `archive/` is not runtime code.
- Frontend uses React + Vite with feature modules in `client/src/features` and shared UI in `client/src/shared`.
- Backend FastAPI in `backend/app` is the API gateway for station/price domain operations and authoritative writes.
- Frontend currently uses Supabase client for auth/session helpers; keep sensitive writes and verification logic server-side.
- Never expose service role keys to clients.

Environment Baseline
- Frontend env in `client/.env` typically includes `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and API base vars (`VITE_API_URL` / `VITE_BACKEND_API_URL`).
- Backend env in `backend/.env` includes `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, plus host/port settings.
- Keep secrets out of git and update `.env.example` when adding new variables.

Agent Operating Rules
- Link, do not embed: point to docs above instead of duplicating long guidance.
- Make minimal scoped changes; avoid unrelated refactors.
- For schema changes, update migration(s) and `backend/supabase/seed.sql` together.
- Avoid destructive DB or deployment commands without explicit user approval.
- Prefer root workspace commands unless a file explicitly documents otherwise.

Common Pitfalls
- Root `package.json` has no `lint` or `format` script; lint is client workspace only.
- `archive/` contains reference assets and legacy code; do not treat it as active app code.
- Backend tests may lag current API contracts; verify assertions against current routes/schemas before "fixing" production code to satisfy outdated tests.

Testing Expectations
- For frontend logic/UI updates, run client lint and provide manual verification steps (especially map/geolocation flows).
- For backend/API updates, run `pytest backend/tests` and document any known test-contract mismatch.

If uncertain, ask a clarifying question before making broad changes.
