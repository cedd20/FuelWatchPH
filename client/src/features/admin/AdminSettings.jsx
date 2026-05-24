import { useEffect, useState } from "react";
import { CheckCircle, Layout, Loader2, Save, Shield, User } from "lucide-react";
import { useAuth } from "@/app/providers/AuthContext";
import { api as apiClient } from "@/lib/apiClient";

const DEFAULT_SETTINGS = {
  defaultView: "dashboard",
  itemsPerPage: "25",
  autoRefresh: true,
  refreshInterval: "30",
};

export function AdminSettings() {
  const { user } = useAuth();
  const [dashboardSettings, setDashboardSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveMessageType, setSaveMessageType] = useState("success");

  const profileData = {
    name: user?.username || user?.name || "Admin User",
    email: user?.email || "No email available",
    role: user?.role === "admin" || user?.user_type === 0 ? "Super Admin" : "User",
  };

  useEffect(() => {
    async function fetchSettings() {
      setIsLoading(true);
      try {
        const data = await apiClient.get("/admin/settings");
        setDashboardSettings({
          defaultView: data?.default_view || DEFAULT_SETTINGS.defaultView,
          itemsPerPage: String(data?.items_per_page ?? DEFAULT_SETTINGS.itemsPerPage),
          autoRefresh: data?.auto_refresh ?? DEFAULT_SETTINGS.autoRefresh,
          refreshInterval: String(data?.refresh_interval ?? DEFAULT_SETTINGS.refreshInterval),
        });
      } catch (error) {
        console.error("Failed to fetch admin settings:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, []);

  async function handleSaveSettings() {
    setIsSaving(true);
    setSaveMessage("");
    try {
      await apiClient.put("/admin/settings", {
        default_view: dashboardSettings.defaultView,
        items_per_page: Number(dashboardSettings.itemsPerPage),
        auto_refresh: dashboardSettings.autoRefresh,
        refresh_interval: Number(dashboardSettings.refreshInterval),
      });
      setSaveMessageType("success");
      setSaveMessage("Settings saved successfully.");
    } catch (error) {
      console.error("Failed to save admin settings:", error);
      setSaveMessageType("error");
      setSaveMessage(error.message || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Admin Settings</h1>
          <p className="text-sm lg:text-base text-muted-foreground">
            Manage your admin profile and preferences
          </p>
        </div>

        {saveMessage && (
          <div
            className={`mb-6 p-3 lg:p-4 border-2 rounded-xl flex items-center gap-3 ${
              saveMessageType === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-400/40"
                : "bg-rose-50 dark:bg-rose-950/20 border-rose-400/40"
            }`}
          >
            <CheckCircle
              className={`w-5 h-5 flex-shrink-0 ${
                saveMessageType === "success"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
              strokeWidth={2.5}
            />
            <span
              className={`text-sm lg:text-base font-bold ${
                saveMessageType === "success"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {saveMessage}
            </span>
          </div>
        )}

        <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 shadow-lg mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 p-4 lg:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 lg:w-6 lg:h-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg lg:text-xl font-bold text-white">Admin Profile</h2>
                <p className="text-white/80 text-xs lg:text-sm">Current authenticated admin session</p>
              </div>
            </div>
          </div>
          <div className="p-4 lg:p-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Full Name</label>
              <div className="px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg text-foreground font-medium">
                {profileData.name}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Email Address</label>
              <div className="px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg text-foreground font-medium">
                {profileData.email}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Role</label>
              <div className="px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full text-sm font-bold border-2 border-blue-400/40">
                  <Shield className="w-4 h-4" strokeWidth={2.5} />
                  {profileData.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 shadow-lg mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-4 lg:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                <Layout className="w-5 h-5 lg:w-6 lg:h-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg lg:text-xl font-bold text-white">Dashboard Preferences</h2>
                <p className="text-white/80 text-xs lg:text-sm">Saved to the backend per admin account</p>
              </div>
            </div>
          </div>
          <div className="p-4 lg:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Default View on Login</label>
                  <select
                    value={dashboardSettings.defaultView}
                    onChange={(event) =>
                      setDashboardSettings((prev) => ({ ...prev, defaultView: event.target.value }))
                    }
                    className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg text-foreground focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none font-medium"
                  >
                    <option value="dashboard">Dashboard Overview</option>
                    <option value="verification-queue">Verification Queue</option>
                    <option value="station-reports">Station Reports</option>
                    <option value="activity-log">Activity Log</option>
                    <option value="user-management">User Management</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Items Per Page</label>
                  <select
                    value={dashboardSettings.itemsPerPage}
                    onChange={(event) =>
                      setDashboardSettings((prev) => ({ ...prev, itemsPerPage: event.target.value }))
                    }
                    className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg text-foreground focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none font-medium"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors">
                    <div>
                      <div className="text-sm font-bold text-foreground">Auto-refresh dashboard</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Automatically refresh admin data.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={dashboardSettings.autoRefresh}
                      onChange={(event) =>
                        setDashboardSettings((prev) => ({ ...prev, autoRefresh: event.target.checked }))
                      }
                      className="w-5 h-5 rounded border-2 border-gray-300 text-emerald-600 focus:ring-4 focus:ring-emerald-500/20"
                    />
                  </label>
                </div>

                {dashboardSettings.autoRefresh && (
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Refresh Interval (seconds)</label>
                    <select
                      value={dashboardSettings.refreshInterval}
                      onChange={(event) =>
                        setDashboardSettings((prev) => ({ ...prev, refreshInterval: event.target.value }))
                      }
                      className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg text-foreground focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none font-medium"
                    >
                      <option value="30">30 seconds</option>
                      <option value="60">1 minute</option>
                      <option value="120">2 minutes</option>
                      <option value="300">5 minutes</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={isLoading || isSaving}
            className="w-full lg:w-auto px-6 lg:px-8 py-3 lg:py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-sm lg:text-base shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" /> : <Save className="w-4 h-4 lg:w-5 lg:h-5" />}
            Save All Settings
          </button>
        </div>
      </div>
    </div>
  );
}
