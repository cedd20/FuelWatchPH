---
name: AGENTS
description: >-
  Project-level guidance for AI coding agents. Minimal, actionable, and
  link-first. Place this file at the repository root so agents and humans can
  quickly discover workspace conventions.
---

# AGENTS: FuelWatchPH

Purpose: Help AI agents be immediately productive with concise, link-first
guidance, repository conventions, and safe operation rules specific to
FuelWatchPH.

Quick Links
- Root README: [README.md](README.md)
- Web app (Vite + React): [client](client)
- Design system & reference UI: [archive/figma](archive/figma)
- Archived legacy client files: [archive/client-legacy](archive/client-legacy)
- Supabase schema & seeds: [backend/supabase/seed.sql](backend/supabase/seed.sql)

Dev Commands (root)
- Install dependencies: `npm install`
- Start dev server: `npm run dev` (starts the workspace and serves client at http://localhost:5173)
- Build production: `npm run build`
- Lint: `npm run lint`
- Format: `npm run format` (if available)

Project Overview
- Frontend: React + Vite, TypeScript/JSX in `client/src`.
- State & fetching: TanStack Query for remote state and caching.
- Mapping: React-Leaflet for maps and markers.
- Backend/Auth: Python backend in `backend/` owns API access and talks to Supabase for auth, storage, and realtime events.

Backend guidance
- A Python backend scaffold lives in `backend/` and is intended to be the single API surface for client requests. The backend should perform authoritative operations (writes, verification) against Supabase using a service role key. Clients must never use service role keys directly.

Running locally
- Backend (FastAPI): `uvicorn app.main:app --reload --port 8000` from `backend/`.
- Frontend (Vite): `npm run dev` from repository root (serves `client`).

Key Conventions
- Workspace package manager: `npm` (root workspace). Run workspace scripts from the repository root.
- Node: target Node.js v18+ for local development and CI.
- Environment variables: `client/.env` should define `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; `backend/.env` should define `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- Styling: Tailwind CSS + global `client/src/styles`.

Agent Behavior (detailed)
- Link, don't embed: reference existing docs and source files; avoid duplicating long docs.
- Make the minimal scoped change to meet the user's request. For larger changes propose a plan first.
- Never add secrets or real API keys to the repository. Use `.env.example` for placeholders.
- Avoid running destructive database or deploy commands without explicit user approval.
- When adding or changing data models, include migration plan and supabase seed updates.

Code Review & PR Guidance
- Use descriptive branch names: `feature/`, `fix/`, `chore/`.
- Provide a short PR description, testing steps, and screenshots for UI changes.
- Run `npm run lint` and `npm run format` before opening a PR.

Testing & Verification
- Add unit or integration tests for logic changes. Frontend UI changes should include basic rendering tests.
- If the change affects map behavior or geolocation, include manual test steps and example coordinates.

If uncertain, ask clarifying questions before making changes or running commands.
