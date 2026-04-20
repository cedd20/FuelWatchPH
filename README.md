# ⛽ FuelWatchPH

[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> **"The Waze for Gas Prices in the Philippines"** — A community-driven platform to help Filipinos find the best fuel prices near them in real-time.

---

## ✨ Overview

**FuelWatchPH** is a modern web application designed to empower Filipino motorists by crowdsourcing real-time fuel prices. Built with a focus on high-fidelity design and seamless user experience, it allows users to locate gas stations, compare prices, and contribute to the community by updating fuel costs.

## 🚀 Key Features

- **📍 Interactive Fuel Map**: View nearby gas stations with real-time price indicators powered by Leaflet.
- **💰 Price Comparison**: Effortlessly find the cheapest gas in your area.
- **👥 Community Powered**: Crowdsourced updates from fellow drivers ensure data is fresh and accurate.
- **🔐 Secure Authentication**: Integrated with Supabase for robust user management.
- **📱 Premium Responsive Design**: A stunning, modern UI that works flawlessly on both desktop and mobile.

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

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/fuelwatchph.git
   cd fuelwatchph
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in `apps/web/` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

## 📸 Design Identity

The application features a premium aesthetic using a **Vibrant Blue to Indigo gradient** design language, emphasizing trust, speed, and community.

---

Built with ❤️ for the Filipino driving community.
