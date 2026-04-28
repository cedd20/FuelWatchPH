# Recommended Project Structure

This project uses a monorepo layout. To make responsibilities clear and
enforce that all client API requests go through a server-side layer, the
recommended top-level structure is:

```
client/              # client application source (React + Vite)
backend/             # Python API server (FastAPI scaffold)
  supabase/          # DB schema, seeds, and migrations
archive/figma/       # archived design system and reference components
archive/client-legacy/ # archived legacy client files
public/              # public assets (icons, images)
AGENTS.md            # agent guidance
.github/agent-docs/  # agent docs (rules, architecture, readme)
```

Current mapping in this repo
- `client/` → frontend implementation (Vite + React).
- `backend/` → Python FastAPI scaffold for all API endpoints.
- `backend/supabase/` → existing DB schema and seed data.
- `archive/figma` → archived design reference materials.
- `archive/client-legacy` → archived legacy client files and backups.

Notes
- The frontend now lives in `client/`; older reference-only material is kept under `archive/`.
- Ensure the frontend's network code targets the backend (e.g., `http://localhost:8000/api/...`) and not Supabase directly for sensitive operations.
