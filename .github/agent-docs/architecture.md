# Architecture — FuelWatchPH

## 1. Product Architecture Summary

FuelWatchPH is a community-driven, mobile-first web application for discovering
and reporting fuel prices in the Philippines. The current repository is a
monorepo containing:

- `client` — Primary React (Vite) application that serves the client UI.
- `backend` — Python FastAPI service that acts as the single API gateway for the client.
- `archive/figma` — Archived design system and reference components implemented in TypeScript/TSX.
- `backend/supabase` — Database schema and seed data for Supabase (Postgres + RLS + functions).

Core technologies:
- Frontend: React + Vite, TypeScript/JSX, Tailwind CSS, React-Leaflet for maps.
- Data fetching: TanStack Query for caching and background updates.
- Backend: Python FastAPI (all API requests from client route here).
- Auth & Storage: Supabase (Postgres, RLS, realtime subscriptions, edge functions).

Deployment mode: React SPA hosted on static hosting (Vercel/Netlify/S3) + Python FastAPI backend service + Supabase (managed database).

## 2. Architectural Style

### Frontend
- Vite-powered React SPA with feature-based organization under `client/src/features`.
- Component-driven architecture with shared UI primitives under `client/src/shared` and design references in `archive/figma`.
- Network layer: TanStack Query for queries/mutations, with optimistic updates for reporting flows.
- Mapping: React-Leaflet for map rendering; markers, clusters, and custom popups for station details.
- Progressive enhancement: mobile-first responsive design; optional PWA capabilities for short-term offline use.

### Backend
- This project introduces a Python backend service (scaffolded in `backend/`) which
	acts as the single API surface for the frontend. The backend should be implemented
	in Python (FastAPI recommended) and will perform authoritative operations against
	Supabase or other downstream services using server-side credentials.
- Supabase (Postgres) is still used for storage and realtime features; however,
	sensitive writes, verification, reputation changes, and aggregation logic must
	be executed server-side via the Python backend or Supabase edge functions that
	are invoked from the backend.
- Recommended responsibilities for the Python backend:
	- Accept and validate client requests (all writes go here)
	- Perform verification and anti-abuse checks
	- Persist canonical records to Supabase using a service role key
	- Provide aggregation endpoints for analytics
	- Handle uploads / sanitize media before making public


## 3. Core Frontend Modules

### Public / Shared
- Landing / Splash — branded entry and app loading sequence.
- Auth screens — Login, SignUp, password reset flows.
- Onboarding — location permission and basic app tour.

### Map & Discovery
- Map view — shows stations around the user, clustered markers, quick price previews.
- Price Legend & Filters — fuel type, price range, sorting by distance/price.
- Station labels & popups — brief summary and quick actions (save, report price, directions).

### Station & Reporting
- Station Detail — full station information, recent price history, user reports.
- Report Price — guided form to submit a price (fuel type, price, timestamp, optional photo).
- Update Price / Verify — workflows for users or moderators to confirm reported prices.

### User & Social
- Profile & Contributions — user profile, contribution history, reputation/role.
- Saved Stations — favorites list and quick access.
- Notifications — in-app notifications for price changes or confirmation requests.

### Utilities / Admin (internal)
- Contribution History / Moderation — tools to review and verify reports (may be a protected route or separate admin UI).

## 4. Backend Domains

### Auth Domain
- signup/login
- role resolution (user, moderator, admin)
- token lifecycle and refresh

### Stations Domain
- station registry (name/address/geo coords)
- station metadata (brand, amenities)

### Pricing Domain
- price reports (user-submitted)
- canonical station price (aggregated, verified)
- historical price entries for charting and analytics

### Contributions & Verification Domain
- user reports queue
- verification tasks (community verification or moderator actions)
- reputation and anti-abuse heuristics

### Notifications Domain
- in-app notifications for price alerts and verification requests

### Analytics & History Domain
- aggregated statistics by region/fuel-type
- price trend charts and exportable data

## 5. Supabase Schema (Suggested Tables)

- users — auth metadata and public profile
- user_profiles — extended profile fields, reputation score
- stations — station registry with geolocation and metadata
- station_prices — canonical current price per station per fuel type
- price_reports — raw user-submitted price reports (photo_url, reported_by, timestamp)
- price_verifications — verification records and status
- favorites — user saved stations
- notifications — in-app notification records
- price_history — historical price records (for charts)
- audit_logs — sensitive action logging

Note: keep sensitive operations (verifications, reputation changes) behind edge functions or server-side logic with elevated keys.

## 6. API Boundary

- The frontend is responsible for UI state, optimistic updates, and input validation.
- The Python backend (`backend/`) is the required API gateway: the frontend must send all API requests to this backend. The backend will then talk to Supabase (or other services) using server-side credentials when needed.
- The backend (Python service and Supabase edge functions) owns authoritative validation, aggregation, and any operation that requires elevated privileges.
- Never place scoring, reputation, or verification rules purely on the client, and never embed service-role keys in client code or environment.

## 7. Map & Offline Strategy

### Offline-capable areas
- Last-known station data and recent price snapshots (short TTL cache).
- Queued price reports: store locally (IndexedDB) and retry when online.

### Online-required areas
- Fresh analytics, moderator-only verification workflows, and initial user authentication refresh.

### Sync & Conflict rules
- Reports queued offline are submitted with client-generated temp ids.
- Server validates by station id + timestamp; duplicates are deduped by unique (station_id, reporter_id, timestamp) heuristics.
- If server rejects a queued report (invalid data), surface the error and allow user correction.

## 8. Security Notes

- Use RLS policies in Supabase to enforce row-level access.
- Use edge functions with service-role keys for sensitive operations; never commit service-role keys.
- Limit what the anon key can do from the client: read and constrained writes only.
- Sanitize and validate uploaded photos and metadata before making them public.

## 9. Non-Functional Priorities
1. Location privacy and minimal permission requests.
2. Reliability on intermittent mobile networks.
3. Fast initial map load and low-bandwidth rendering.
4. Battery and data efficiency for mobile users.
5. Maintainability and clear API contracts for analytics and history.

## 10. Architectural Constraints
- Keep the architecture simple: single frontend SPA + Supabase backend — avoid premature microservices.
- Prefer server-side validation for anything that impacts reputation or persisted canonical state.
- Map tiles and heavy assets should be cached via CDN and optional service worker caching.

## Typical Agent Workflow
1. Read `AGENTS.md`, `README.md`, and this architecture doc.
2. Run local dev server: `npm run dev` (from repo root).
3. Make minimal, well-tested changes; include migration or seed updates if schema changes are required.
4. Run `npm run lint`/`npm run test` before opening a PR.
