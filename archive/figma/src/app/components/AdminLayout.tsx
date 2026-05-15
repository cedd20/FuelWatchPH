import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  Shield,
  CheckCircle,
  MapPin,
  Users,
  Ban,
  Activity,
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
  Search,
  User,
} from "lucide-react";
import { Logo } from "./Logo";

const navItems = [
  { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Verification Requests", path: "/admin/verification-queue", icon: Shield },
  { name: "Verified Users", path: "/admin/verified-users", icon: CheckCircle },
  { name: "Station Reports", path: "/admin/station-reports", icon: MapPin },
  { name: "User Management", path: "/admin/user-management", icon: Users },
  { name: "Banned Users", path: "/admin/banned-users", icon: Ban },
  { name: "Admin Activity Log", path: "/admin/activity-log", icon: Activity },
  { name: "Settings", path: "/admin/settings", icon: Settings },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-neutral-900 border-b-2 border-gray-200 dark:border-neutral-700 z-50 flex items-center justify-between px-4">
        <Logo size="sm" />
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-neutral-900 border-r-2 border-gray-200 dark:border-neutral-700 z-50 transition-transform duration-300 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-center border-b-2 border-gray-200 dark:border-neutral-700 px-4">
          <Logo size="sm" />
          <div className="ml-2 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full text-xs font-bold">
            Admin
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto" style={{ height: "calc(100vh - 160px)" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white shadow-lg shadow-emerald-500/40"
                    : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={2.5} />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t-2 border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
          >
            <LogOut className="w-5 h-5" strokeWidth={2.5} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header Bar */}
        <div className="sticky top-0 z-30 h-16 bg-white dark:bg-neutral-900 border-b-2 border-gray-200 dark:border-neutral-700 px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg lg:text-xl font-bold text-foreground hidden md:block">
              FuelWatch PH Admin
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="w-64 pl-9 pr-4 py-2 bg-gray-100 dark:bg-neutral-800 border-2 border-transparent rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
              />
            </div>

            {/* Notifications */}
            <button className="relative w-10 h-10 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors">
              <Bell className="w-5 h-5 text-foreground" strokeWidth={2} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
            </button>

            {/* Admin Profile */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-neutral-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <div className="hidden lg:block">
                <div className="text-xs font-bold text-foreground">Admin</div>
                <div className="text-xs text-muted-foreground">Super Admin</div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="pt-0 lg:pt-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
