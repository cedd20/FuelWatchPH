# @fuelwatchph/client

This is the frontend application for **FuelWatchPH**, built with React, Vite, and TypeScript/JavaScript.

All API requests that need authoritative data must go through the Python backend in `../backend/`. The frontend should not talk to Supabase directly for sensitive writes.

## 🚀 Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run preview`: Previews the production build locally.
- `npm run lint`: Runs ESLint to check for code quality.

See the root [README](../../README.md) and [PROJECT_STRUCTURE.md](../../PROJECT_STRUCTURE.md) for the current monorepo layout.

## 🛠️ Tech Stack

- **React 18**
- **Vite**
- **TypeScript**
- **Tailwind CSS**
- **Supabase Client** for client-side auth/session helpers only
- **React-Leaflet**
- **TanStack Query**

For project-wide documentation, please refer to the [root README](../../README.md).
