# Rules — FuelWatchPH

These rules guide both human contributors and AI coding agents working on
FuelWatchPH. They balance product intent, user safety, and engineering
sanity.

## Product Rules
1. The app exists to help Filipinos find and compare fuel prices quickly.
2. Every UX decision must prioritize discoverability and low-friction reporting.
3. Location privacy first: only request location when necessary, and explain why.
4. Price verification UX must minimize abuse while encouraging contributions.

## Engineering Rules
1. Use TypeScript/JavaScript consistently; prefer existing file flavor in `client`.
2. Use feature-based module organization inside `client/src/features`.
3. Avoid large refactors in a single PR; prefer vertical slices that are reviewable.
4. Add unit tests for business logic changes; add integration/manual steps for map and geolocation flows.
5. Do not commit secrets. Add placeholders to `.env.example` when new env vars are required.
6. Performance: prefer incremental updates (react-query) and avoid heavy client-side computation on mobile.
7. Accessibility: mobile-first, large touch targets, readable type sizes, color contrast meeting WCAG AA.

## Design Rules
1. The UI should be clean, mobile-first, and prioritize map clarity over decorative chrome.
2. Use consistent Fuel Type chips and color semantics for price movement (up/down/unchanged).
3. Use existing `archive/figma` design tokens and components where appropriate.
4. Avoid dense data tables on mobile; summarize with expandable details.

## API & Data Rules
1. Keep Supabase RLS and edge function logic for sensitive operations (verifying prices, awarding reputation).
2. The frontend should only use the anon key for read operations and minimal writes; server-side functions handle sensitive writes.
3. Validate all user-submitted price reports on the server (sanity ranges, timestamps, station id).
4. Rate-limit and debounce reporting endpoints to reduce spam.

## PWA / Offline Rules
1. Core map tile and last-known station data should be cacheable for short offline windows.
2. User-submitted reports may be queued locally and retried; do not silently discard queued reports.
3. Show clear offline/queued-state indicators in the UI.

## QA Rules
1. Test on a range of mobile widths and network conditions (3G/4G/airplane).
2. Test geolocation permission flows and fallback behavior.
3. Validate analytics and history views after sync from queued reports.

## Release & Deployment Rules
1. CI must pass lint and unit tests before merging to main.
2. Do not publish Supabase service keys to the repo or PR descriptions.

If any rule is unclear, request clarification before proceeding.
