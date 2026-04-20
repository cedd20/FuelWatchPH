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
├── apps/
│   └── web/               # Primary React (Vite) application
│       ├── src/
│       │   ├── app/       # Global configuration & routing
│       │   ├── features/  # Domain-specific modules (auth, dashboard)
│       │   ├── lib/       # Third-party configurations (supabase)
│       │   ├── shared/    # Reusable components & UI kit
│       │   └── styles/    # Global styles & design system
├── supabase/              # Database schema & migrations
└── package.json           # Monorepo configuration
```

## 🛠️ Getting Started

Follow these steps to get the project up and running on your local machine.

### 📋 Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or pnpm v8+)
- **Supabase Account**: A free project at [supabase.com](https://supabase.com)

### ⚙️ Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/cedd20/FuelWatchPH.git
   cd FuelWatchPH
   ```

2. **Install Dependencies**
   Run this in the root directory to install all package dependencies for both the workspace and individual apps:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Navigate to the web application directory and create a `.env` file:
   ```bash
   cd apps/web
   cp .env.example .env  # If .env.example exists, otherwise create it manually
   ```
   
   Add your Supabase project credentials to `apps/web/.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Database Setup (Optional but Recommended)**
   If you have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed, you can link your project:
   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   ```

5. **Start Development Server**
   Return to the root directory and run the following command to start the web app:
   ```bash
   cd ../..
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## 🏗️ Architecture & Workspace

FuelWatchPH uses a **Monorepo** structure powered by `npm workspaces`. This allows for better code sharing and dependency management.

- **`apps/web`**: The main React + Vite application.
- **`supabase/`**: Contains database schema, seeds, and edge functions.
- **`shared/`**: (Future) Shared components and utilities used across different platforms.

### Key Scripts (Run from Root)

- `npm run dev`: Runs the development server for the web app.
- `npm run build`: Generates a production-ready bundle.
- `npm run lint`: Performs static code analysis to ensure quality.

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

