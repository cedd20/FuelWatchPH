import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, MapPin, ArrowLeftRight, TrendingUp, User } from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "@/app/providers/AuthContext";
export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

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

  const isDesktopMapRoute =
    location.pathname === "/app" ||
    location.pathname === "/app/" ||
    location.pathname.startsWith("/app/map");
  const isMobileMapRoute = isDesktopMapRoute;

  return (
    <div className="flex flex-col h-screen bg-[#050A09]">
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all relative ${
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
      <main
        className={`flex-1 ${
          isMobileMapRoute ? "pb-0 overflow-hidden" : "pb-20 overflow-y-auto"
        } ${
          isDesktopMapRoute ? "lg:pb-0 lg:overflow-hidden" : ""
        }`}
      >
        <Outlet />
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-6 pb-6">
        <div className="bg-[#0C1A17] border border-emerald-500/10 rounded-full shadow-[0_15px_40px_rgba(0,0,0,0.4)] max-w-md mx-auto px-2 py-3">
          <div className="flex items-center justify-around relative">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              if (item.isCenter) {
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="flex flex-col items-center justify-center -mt-10 transition-transform hover:scale-110 active:scale-95 relative"
                  >
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
                        active
                          ? "bg-gradient-to-br from-emerald-500 to-green-700 shadow-emerald-500/20"
                          : "bg-gradient-to-br from-emerald-600/80 to-green-800/80 shadow-emerald-500/10"
                      }`}
                    >
                      <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                    </div>
                  </button>
                );
              }

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center justify-center py-1 px-4 transition-all relative"
                >
                  <Icon
                    className={`w-6 h-6 transition-all ${
                      active ? "text-emerald-400" : "text-gray-600"
                    }`}
                    strokeWidth={active ? 3 : 2}
                  />
                  {active && (
                    <div className="absolute bottom-[-6px] w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-in fade-in zoom-in" />
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
