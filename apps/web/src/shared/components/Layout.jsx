import { Outlet, useLocation, useNavigate } from "react-router";
import { Home, MapPin, ArrowLeftRight, TrendingUp, User } from "lucide-react";
import { Logo } from "./Logo";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/app/home", icon: Home, label: "Home", isCenter: false },
    { path: "/app/compare", icon: ArrowLeftRight, label: "Compare", isCenter: false },
    { path: "/app/map", icon: MapPin, label: "Map", isCenter: true },
    { path: "/app/gas-history", icon: TrendingUp, label: "History", isCenter: false },
    { path: "/app/profile", icon: User, label: "Profile", isCenter: false },
  ];

  const isActive = (path) => {
    if (path === "/app/map" && (location.pathname === "/app" || location.pathname === "/app/")) {
      return true;
    }
    if (path === "/app/home") {
      return location.pathname === "/app/home";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900">
      {/* Desktop Top Navigation - Hidden on Mobile */}
      <nav className="hidden lg:block sticky top-0 z-50 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700 shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/app/home")}>
              <Logo size="sm" />
            </div>

            {/* Navigation Items */}
            <div className="flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                      active
                        ? "bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
                        : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={2.5} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        <Outlet />
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
        <div className="bg-white dark:bg-neutral-900 rounded-full shadow-2xl shadow-black/20 max-w-lg mx-auto px-6 py-3 border-2 border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-around relative">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              if (item.isCenter) {
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="flex flex-col items-center justify-center -mt-8 transition-transform hover:scale-110 relative"
                  >
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all border-2 ${
                        active
                          ? "bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 shadow-emerald-500/50 border-emerald-400/40"
                          : "bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 shadow-emerald-500/40 border-emerald-400/30"
                      }`}
                    >
                      <Icon className="w-7 h-7 text-white" strokeWidth={2} />
                    </div>
                    {active && (
                      <div className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center justify-center py-2 px-3 transition-all relative group"
                >
                  <Icon
                    className={`w-6 h-6 transition-colors ${
                      active ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-400 dark:text-neutral-500"
                    }`}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  {active && (
                    <div className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
