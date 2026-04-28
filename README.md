# ⛽ FuelWatchPH

[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> **"The Waze for Gas Prices in the Philippines"** — A community-driven platform to help Filipinos find the best fuel prices near them in real-time.

---

## ✨ Features

### Current 🟢
- **Premium User Experience**: High-fidelity UI with smooth animations and glassmorphism.
- **Secure Authentication**: Complete login and registration flow powered by Supabase.
- **Splash Screen**: Branded loading sequence with animated transitions.
- **Monorepo Architecture**: Scalable project structure using pnpm/npm workspaces.

### In Development 🟡
- **Interactive Fuel Map**: Integrated Leaflet map showing gas stations around the user.
- **Price Comparison**: Logic to filter and sort stations by fuel price.
- **Responsive Layouts**: Optimized views for all mobile devices.

### Roadmap 🗺️
- **Crowdsourced Reporting**: Allow users to update prices on-the-go.
- **Verify Updates**: Community verification system for price accuracy.
- **Fuel Analytics**: Historical price trends and insights for different regions.
- **Rewards System**: Incentives for active contributors.


## 🛠️ Tech Stack

- **Frontend**: [React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
- **Backend/Auth**: [Supabase](https://supabase.com/)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query/latest)
- **Mapping**: [React-Leaflet](https://react-leaflet.js.org/)

## 📂 Project Structure

```bash
FuelWatchPH/
├── client/                # Primary React (Vite) application
│   ├── src/
│   │   ├── app/           # Global configuration & routing
│   │   ├── features/      # Domain-specific modules (auth, dashboard)
│   │   ├── lib/           # Third-party configurations (Supabase client)
│   │   ├── shared/        # Reusable components & UI kit
│   │   └── styles/        # Global styles & design system
├── backend/               # Python FastAPI API service (all API requests go here)
│   └── supabase/          # Database schema & migrations
├── archive/               # Historical/reference-only folders and assets
│   ├── figma/             # Archived design system and reference UI
│   └── client-legacy/     # Archived legacy client files and backups
├── AGENTS.md              # Agent guidance for contributors and AI tools
└── package.json           # Monorepo configuration
```

## 🛠️ Getting Started

**For complete setup and development instructions, see [SETUP.md](SETUP.md).**

Follow these steps to get the project up and running on your local machine.

### 📋 Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or pnpm v8+)
- **Python**: v3.9+
- **Supabase Account**: A free project at [supabase.com](https://supabase.com)

### ⚙️ Quick Start

```bash
# Clone and install
git clone https://github.com/cedd20/FuelWatchPH.git
cd FuelWatchPH
npm install

# Configure environments
cp client/.env.example client/.env
cp backend/.env.example backend/.env
# Edit both .env files with your Supabase credentials

# Install backend dependencies
pip install -r backend/requirements.txt

# Start backend (Terminal 1)
uvicorn app.main:app --reload --port 8000 --app-dir backend

# Start frontend (Terminal 2)
npm run dev
```

**For detailed setup instructions, environment variables, and troubleshooting, see [SETUP.md](SETUP.md).**

## 🏗️ Architecture & Workspace

FuelWatchPH uses a **Monorepo** structure with a dedicated `client/` frontend and `backend/` Python API service. This keeps API requests server-side and makes ownership clear.

- **`client/`**: The main React + Vite application.
- **`backend/`**: Python API service for all frontend API requests.
- **`backend/supabase/`**: Contains database schema, seeds, and edge functions.
- **`archive/`**: Historical/reference-only folders and assets.
- **`archive/figma`**: Archived design system and implementation reference.
- **`archive/client-legacy`**: Archived legacy client files and backups.
- **`shared/`**: (Future) Shared components and utilities used across different platforms.

### Key Scripts (Run from Root)

- `npm run dev`: Runs the development server for the web app (`client/`).
- `npm run build`: Generates a production-ready bundle.
- `npm run lint`: Performs static code analysis to ensure quality.
- `cd backend && uvicorn app.main:app --reload --port 8000`: Runs the backend API service.

## 🤝 Contributing

We welcome contributions from the community! Whether it's fixing bugs, adding new features, or improving documentation:

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Built with ❤️ for the Filipino driving community.

