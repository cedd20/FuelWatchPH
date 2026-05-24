import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Fuel,
  Users,
  Ban,
  TrendingUp,
  AlertCircle,
  Eye,
  Loader2,
} from "lucide-react";

import { api as apiClient } from "@/lib/apiClient";

const emptyStats = {
  totalRequests: 0,
  pendingRequests: 0,
  approvedRequests: 0,
  rejectedRequests: 0,
  totalReports: 0,
  openReports: 0,
  activeUsers: 0,
  bannedUsers: 0,
  verifiedToday: 0,
  reportsLoggedToday: 0,
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
};

export function AdminDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      setIsLoading(true);
      try {
        const data = await apiClient.get("/admin/dashboard");
        setDashboard(data || null);
      } catch (error) {
        console.error("Failed to fetch admin dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  const stats = dashboard?.stats || emptyStats;
  const recentVerifications = dashboard?.recentVerifications || [];
  const recentReports = dashboard?.recentReports || [];
  const recentActivity = dashboard?.recentActivity || [];

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 dark:bg-yellow-950/50 text-yellow-600 dark:text-yellow-400",
      approved: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400",
      rejected: "bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400",
      under_review: "bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400",
      resolved: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400",
      banned: "bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400",
    };
    return styles[status] || styles.pending;
  };

  if (isLoading && !dashboard) {
    return (
      <div className="p-4 lg:p-8">
        <div className="max-w-[1600px] mx-auto min-h-[50vh] flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-6 py-4 shadow-lg">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            <span className="text-sm font-semibold text-muted-foreground">Loading admin dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1 lg:mb-2">Dashboard</h1>
          <p className="text-sm lg:text-base text-muted-foreground">Welcome to FuelWatch PH Admin Panel</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-6 mb-6 lg:mb-8">
          <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-2xl p-3 lg:p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xl lg:text-3xl font-bold text-foreground mb-0.5 lg:mb-1">{stats.totalRequests}</div>
                <div className="text-[10px] leading-tight lg:text-sm text-muted-foreground font-semibold lg:leading-tight">Total Verification Requests</div>
              </div>
              <div className="w-8 h-8 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 lg:w-6 lg:h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-2xl p-3 lg:p-6 border-2 border-yellow-400/40 shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xl lg:text-3xl font-bold text-foreground mb-0.5 lg:mb-1">{stats.pendingRequests}</div>
                <div className="text-[10px] leading-tight lg:text-sm text-muted-foreground font-semibold lg:leading-tight">Pending Verifications</div>
              </div>
              <div className="w-8 h-8 lg:w-12 lg:h-12 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-950/50 dark:to-orange-950/50 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 lg:w-6 lg:h-6 text-yellow-600 dark:text-yellow-400" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-2xl p-3 lg:p-6 border-2 border-emerald-400/40 shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xl lg:text-3xl font-bold text-foreground mb-0.5 lg:mb-1">{stats.approvedRequests}</div>
                <div className="text-[10px] leading-tight lg:text-sm text-muted-foreground font-semibold lg:leading-tight">Approved Verifications</div>
              </div>
              <div className="w-8 h-8 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 lg:w-6 lg:h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-2xl p-3 lg:p-6 border-2 border-rose-400/40 shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xl lg:text-3xl font-bold text-foreground mb-0.5 lg:mb-1">{stats.rejectedRequests}</div>
                <div className="text-[10px] leading-tight lg:text-sm text-muted-foreground font-semibold lg:leading-tight">Rejected Verifications</div>
              </div>
              <div className="w-8 h-8 lg:w-12 lg:h-12 bg-gradient-to-br from-rose-100 to-red-100 dark:from-rose-950/50 dark:to-red-950/50 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <XCircle className="w-4 h-4 lg:w-6 lg:h-6 text-rose-600 dark:text-rose-400" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-2xl p-3 lg:p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xl lg:text-3xl font-bold text-foreground mb-0.5 lg:mb-1">{stats.totalReports}</div>
                <div className="text-[10px] leading-tight lg:text-sm text-muted-foreground font-semibold lg:leading-tight">Total Fuel Reports</div>
              </div>
              <div className="w-8 h-8 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-2xl p-3 lg:p-6 border-2 border-yellow-400/40 shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xl lg:text-3xl font-bold text-foreground mb-0.5 lg:mb-1">{stats.openReports}</div>
                <div className="text-[10px] leading-tight lg:text-sm text-muted-foreground font-semibold lg:leading-tight">Open Fuel Reports</div>
              </div>
              <div className="w-8 h-8 lg:w-12 lg:h-12 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-950/50 dark:to-orange-950/50 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 lg:w-6 lg:h-6 text-yellow-600 dark:text-yellow-400" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-2xl p-3 lg:p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xl lg:text-3xl font-bold text-foreground mb-0.5 lg:mb-1">{stats.activeUsers}</div>
                <div className="text-[10px] leading-tight lg:text-sm text-muted-foreground font-semibold lg:leading-tight">Active Users</div>
              </div>
              <div className="w-8 h-8 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 lg:w-6 lg:h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-2xl p-3 lg:p-6 border-2 border-rose-400/40 shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xl lg:text-3xl font-bold text-foreground mb-0.5 lg:mb-1">{stats.bannedUsers}</div>
                <div className="text-[10px] leading-tight lg:text-sm text-muted-foreground font-semibold lg:leading-tight">Banned Users</div>
              </div>
              <div className="w-8 h-8 lg:w-12 lg:h-12 bg-gradient-to-br from-rose-100 to-red-100 dark:from-rose-950/50 dark:to-red-950/50 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <Ban className="w-4 h-4 lg:w-6 lg:h-6 text-rose-600 dark:text-rose-400" strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8">
          <div className="lg:col-span-2 space-y-5 lg:space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-xl lg:rounded-2xl p-5 lg:p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-lg">
              <div className="flex items-center justify-between mb-4 lg:mb-5">
                <h2 className="text-lg lg:text-xl font-bold text-foreground">Recent Verification Requests</h2>
                <button
                  onClick={() => navigate("/admin/verification-queue")}
                  className="text-xs lg:text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <span className="hidden sm:inline">View All</span>
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2.5 lg:space-y-3">
                {recentVerifications.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 lg:p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg lg:rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer active:scale-[0.98]"
                    onClick={() => navigate(`/admin/verification/${request.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-foreground mb-1 text-sm lg:text-base">{request.userName}</div>
                      <div className="text-xs lg:text-sm text-muted-foreground truncate">{request.idType}</div>
                      <div className="text-xs text-muted-foreground mt-1">Submitted {formatDateTime(request.submissionDate)}</div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap self-start sm:self-center ${getStatusBadge(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-xl lg:rounded-2xl p-5 lg:p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-lg">
              <div className="flex items-center justify-between mb-4 lg:mb-5">
                <h2 className="text-lg lg:text-xl font-bold text-foreground">Recent Fuel Reports</h2>
                <button
                  onClick={() => navigate("/admin/fuel-reports")}
                  className="text-xs lg:text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <span className="hidden sm:inline">View All</span>
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2.5 lg:space-y-3">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex flex-col gap-3 p-4 lg:p-5 bg-linear-to-br from-gray-50 to-white dark:from-neutral-800 dark:to-neutral-900 rounded-lg lg:rounded-xl border border-gray-200 dark:border-neutral-700 hover:border-emerald-400/50 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer active:scale-[0.98]"
                    onClick={() => navigate("/admin/fuel-reports")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-foreground mb-1 text-sm lg:text-base">{report.stationName}</div>
                        <div className="flex items-center gap-2 text-xs lg:text-sm text-muted-foreground">
                          <Fuel className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{report.reportType}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap ${getStatusBadge(report.status)}`}>
                        {report.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-gray-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/60 p-3">
                        <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Reported Price</div>
                        <div className="text-base font-bold text-foreground">{report.priceLabel || "Pending review"}</div>
                      </div>
                      <div className="rounded-lg border border-gray-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/60 p-3">
                        <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">Confirmations</div>
                        <div className="text-base font-bold text-foreground">{report.confirmationCount ?? 0}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span className="truncate">Reported by {report.reportedBy}</span>
                      <span className="shrink-0">{formatDate(report.submissionDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-5 lg:space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-xl lg:rounded-2xl p-5 lg:p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-lg">
              <h2 className="text-lg lg:text-xl font-bold text-foreground mb-4 lg:mb-5">Quick Actions</h2>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 lg:gap-3">
                <button
                  onClick={() => navigate("/admin/verification-queue")}
                  className="w-full px-4 lg:px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg lg:rounded-xl font-bold text-xs lg:text-sm shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                >
                  Review Pending Verifications
                </button>
                <button
                  onClick={() => navigate("/admin/fuel-reports")}
                  className="w-full px-4 lg:px-5 py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 text-foreground rounded-lg lg:rounded-xl font-bold text-xs lg:text-sm hover:border-emerald-500 transition-all active:scale-[0.98]"
                >
                  Review Fuel Reports
                </button>
                <button
                  onClick={() => navigate("/admin/station-reports")}
                  className="w-full px-4 lg:px-5 py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 text-foreground rounded-lg lg:rounded-xl font-bold text-xs lg:text-sm hover:border-emerald-500 transition-all active:scale-[0.98]"
                >
                  Review Station Reports
                </button>
                <button
                  onClick={() => navigate("/admin/user-management")}
                  className="w-full px-4 lg:px-5 py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 text-foreground rounded-lg lg:rounded-xl font-bold text-xs lg:text-sm hover:border-emerald-500 transition-all active:scale-[0.98]"
                >
                  View User Management
                </button>
                <button
                  onClick={() => navigate("/admin/banned-users")}
                  className="w-full px-4 lg:px-5 py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 text-foreground rounded-lg lg:rounded-xl font-bold text-xs lg:text-sm hover:border-rose-500 transition-all active:scale-[0.98]"
                >
                  View Banned Users
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl lg:rounded-2xl p-5 lg:p-6 border-2 border-emerald-400/30 shadow-lg">
              <div className="flex items-center gap-3 mb-4 lg:mb-5">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-lg lg:text-xl font-bold text-foreground">Today's Summary</h2>
              </div>
              <div className="space-y-3 lg:space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs lg:text-sm font-semibold text-muted-foreground">Verifications Completed</span>
                  <span className="text-xl lg:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.verifiedToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs lg:text-sm font-semibold text-muted-foreground">Reports Logged</span>
                  <span className="text-xl lg:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.reportsLoggedToday}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-xl lg:rounded-2xl p-5 lg:p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-lg">
              <div className="flex items-center justify-between mb-4 lg:mb-5">
                <h2 className="text-lg lg:text-xl font-bold text-foreground">Recent Activity</h2>
                <button
                  onClick={() => navigate("/admin/activity-log")}
                  className="text-xs lg:text-sm font-bold text-emerald-600 hover:text-emerald-700"
                >
                  View All
                </button>
              </div>
              <div className="space-y-2.5 lg:space-y-3">
                {recentActivity.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 dark:border-neutral-700 px-4 py-6 text-center text-sm text-muted-foreground">
                    No recent activity yet.
                  </div>
                ) : (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-2.5 lg:gap-3 p-3 lg:p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs lg:text-sm font-bold text-foreground">{activity.action}</div>
                        <div className="text-xs text-muted-foreground truncate">{activity.target}</div>
                        <div className="text-xs text-muted-foreground mt-1">{formatDateTime(activity.timestamp)}</div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold capitalize whitespace-nowrap flex-shrink-0 ${getStatusBadge(activity.type)}`}>
                        {activity.type.replace("_", " ")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
