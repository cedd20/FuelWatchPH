import { Outlet, useLocation, useNavigate } from "react-router";
import { Home as HomeIcon, MapPin, ArrowLeftRight, TrendingUp, User } from "lucide-react";
import { Logo } from "./Logo";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/app/home", icon: HomeIcon, label: "Home" },
    { path: "/app/compare", icon: ArrowLeftRight, label: "Compare" },
    { path: "/app/map", icon: MapPin, label: "Map", isCenter: true },
    { path: "/app/gas-history", icon: TrendingUp, label: "History" },
    { path: "/app/profile", icon: User, label: "Profile" },
  ];

  const isActive = (path) => {
    if (path === "/app/map" && (location.pathname === "/app" || location.pathname === "/app/")) {
      return true;
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-neutral-950">
      {/* Desktop Top Navigation */}
      <nav className="hidden lg:block sticky top-0 z-50 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700 shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/app/home")}>
              <Logo size="sm" />
            </div>

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
                        ? "bg-emerald-600 text-white shadow-lg"
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
      <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6">
        <div className="bg-white dark:bg-neutral-900 rounded-full shadow-2xl max-w-lg mx-auto px-6 py-2 border border-gray-100 dark:border-neutral-800">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              if (item.isCenter) {
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="flex flex-col items-center justify-center -mt-10 transition-transform relative"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center shadow-xl border-4 border-white dark:border-neutral-950">
                      <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                    </div>
                    {active && <div className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                  </button>
                );
              }

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center justify-center py-3 px-3 relative group"
                >
                  <Icon
                    className={`w-6 h-6 transition-colors ${
                      active ? "text-emerald-600" : "text-neutral-400"
                    }`}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  {active && <div className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
