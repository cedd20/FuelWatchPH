import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/app/providers/AuthContext";

export function AdminRouteGuard() {
  const location = useLocation();
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
          <p className="mt-4 text-sm font-medium text-muted-foreground">Preparing admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace state={{ returnTo: location.pathname }} />;
  }

  return <Outlet />;
}
