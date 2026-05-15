import { useNavigate } from "react-router";
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Users,
  Ban,
  TrendingUp,
  AlertCircle,
  Eye,
} from "lucide-react";

const mockStats = {
  totalRequests: 156,
  pendingRequests: 24,
  approvedRequests: 118,
  rejectedRequests: 14,
  totalReports: 89,
  openReports: 15,
  activeUsers: 2456,
  bannedUsers: 8,
  verifiedToday: 12,
  reportsResolvedToday: 7,
};

const recentVerifications = [
  {
    id: "1",
    userName: "Juan Dela Cruz",
    email: "juan.delacruz@email.com",
    idType: "National ID",
    submissionDate: "2024-05-07 14:30",
    status: "pending",
  },
  {
    id: "2",
    userName: "Maria Santos",
    email: "maria.santos@email.com",
    idType: "Driver's License",
    submissionDate: "2024-05-07 13:15",
    status: "pending",
  },
  {
    id: "3",
    userName: "Pedro Reyes",
    email: "pedro.reyes@email.com",
    idType: "Passport",
    submissionDate: "2024-05-07 10:45",
    status: "approved",
  },
];

const recentReports = [
  {
    id: "1",
    stationName: "Petron Quezon Avenue",
    reportType: "Incorrect Price",
    reportedBy: "Juan Dela Cruz",
    submissionDate: "2024-05-07 14:30",
    status: "pending",
  },
  {
    id: "2",
    stationName: "Shell EDSA",
    reportType: "Duplicate Station",
    reportedBy: "Maria Santos",
    submissionDate: "2024-05-07 10:15",
    status: "under_review",
  },
  {
    id: "3",
    stationName: "Caltex Commonwealth",
    reportType: "Station Closed",
    reportedBy: "Pedro Reyes",
    submissionDate: "2024-05-06 16:45",
    status: "resolved",
  },
];

const recentActivity = [
  {
    id: "1",
    action: "Approved verification",
    target: "Juan Dela Cruz",
    admin: "Admin",
    timestamp: "5 mins ago",
    type: "approved",
  },
  {
    id: "2",
    action: "Resolved station report",
    target: "Petron Quezon Avenue",
    admin: "Admin",
    timestamp: "15 mins ago",
    type: "resolved",
  },
  {
    id: "3",
    action: "Banned user",
    target: "John Smith",
    admin: "Admin",
    timestamp: "1 hour ago",
    type: "banned",
  },
  {
    id: "4",
    action: "Rejected verification",
    target: "Ana Garcia",
    admin: "Admin",
    timestamp: "2 hours ago",
    type: "rejected",
  },
];

export function AdminDashboard() {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 dark:bg-yellow-950/50 text-yellow-600 dark:text-yellow-400",
      approved: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400",
      rejected: "bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400",
      under_review: "bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400",
      resolved: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400",
      banned: "bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400",
    };
    return styles[status] || styles.pending;
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Page Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1 lg:mb-2">Dashboard</h1>
          <p className="text-sm lg:text-base text-muted-foreground">Welcome to FuelWatch PH Admin Panel</p>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-6 mb-6 lg:mb-8">
          {/* Total Verification Requests */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-2xl p-3 lg:p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xl lg:text-3xl font-bold text-foreground mb-0.5 lg:mb-1">{mockStats.totalRequests}</div>
                <div className="text-[10px] leading-tight lg:text-sm text-muted-foreground font-semibold lg:leading-tight">Total Verification Requests</div>
              </div>
              <div className="w-8 h-8 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 lg:w-6 lg:h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Pending Verifications */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-2xl p-3 lg:p-6 border-2 border-yellow-400/40 shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xl lg:text-3xl font-bold text-foreground mb-0.5 lg:mb-1">{mockStats.pendingRequests}</div>
                <div className="text-[10px] leading-tight lg:text-sm text-muted-foreground font-semibold lg:leading-tight">Pending Verifications</div>
              </div>
              <div className="w-8 h-8 lg:w-12 lg:h-12 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-950/50 dark:to-orange-950/50 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 lg:w-6 lg:h-6 text-yellow-600 dark:text-yellow-400" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Approved Verifications */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-2xl p-3 lg:p-6 border-2 border-emerald-400/40 shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xl lg:text-3xl font-bold text-foreground mb-0.5 lg:mb-1">{mockStats.approvedRequests}</div>
                <div className="text-[10px] leading-tight lg:text-sm text-muted-foreground font-semibold lg:leading-tight">Approved Verifications</div>
              </div>
              <div className="w-8 h-8 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 lg:w-6 lg:h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Rejected Verifications */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-2xl p-3 lg:p-6 border-2 border-rose-400/40 shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xl lg:text-3xl font-bold text-foreground mb-0.5 lg:mb-1">{mockStats.rejectedRequests}</div>
                <div className="text-[10px] leading-tight lg:text-sm text-muted-foreground font-semibold lg:leading-tight">Rejected Verifications</div>
              </div>
              <div className="w-8 h-8 lg:w-12 lg:h-12 bg-gradient-to-br from-rose-100 to-red-100 dark:from-rose-950/50 dark:to-red-950/50 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <XCircle className="w-4 h-4 lg:w-6 lg:h-6 text-rose-600 dark:text-rose-400" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Station Reports */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-2xl p-3 lg:p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xl lg:text-3xl font-bold text-foreground mb-0.5 lg:mb-1">{mockStats.totalReports}</div>
                <div className="text-[10px] leading-tight lg:text-sm text-muted-foreground font-semibold lg:leading-tight">Total Station Reports</div>
              </div>
              <div className="w-8 h-8 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Open Reports */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-2xl p-3 lg:p-6 border-2 border-yellow-400/40 shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xl lg:text-3xl font-bold text-foreground mb-0.5 lg:mb-1">{mockStats.openReports}</div>
                <div className="text-[10px] leading-tight lg:text-sm text-muted-foreground font-semibold lg:leading-tight">Open Station Reports</div>
              </div>
              <div className="w-8 h-8 lg:w-12 lg:h-12 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-950/50 dark:to-orange-950/50 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 lg:w-6 lg:h-6 text-yellow-600 dark:text-yellow-400" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-2xl p-3 lg:p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xl lg:text-3xl font-bold text-foreground mb-0.5 lg:mb-1">{mockStats.activeUsers}</div>
                <div className="text-[10px] leading-tight lg:text-sm text-muted-foreground font-semibold lg:leading-tight">Active Users</div>
              </div>
              <div className="w-8 h-8 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 lg:w-6 lg:h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Banned Users */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-2xl p-3 lg:p-6 border-2 border-rose-400/40 shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xl lg:text-3xl font-bold text-foreground mb-0.5 lg:mb-1">{mockStats.bannedUsers}</div>
                <div className="text-[10px] leading-tight lg:text-sm text-muted-foreground font-semibold lg:leading-tight">Banned Users</div>
              </div>
              <div className="w-8 h-8 lg:w-12 lg:h-12 bg-gradient-to-br from-rose-100 to-red-100 dark:from-rose-950/50 dark:to-red-950/50 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <Ban className="w-4 h-4 lg:w-6 lg:h-6 text-rose-600 dark:text-rose-400" strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-5 lg:space-y-6">
            {/* Recent Verification Requests */}
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
                      <div className="text-xs lg:text-sm text-muted-foreground truncate">{request.email}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {request.idType} • {new Date(request.submissionDate).toLocaleString()}
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap self-start sm:self-center ${getStatusBadge(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Station Reports */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl lg:rounded-2xl p-5 lg:p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-lg">
              <div className="flex items-center justify-between mb-4 lg:mb-5">
                <h2 className="text-lg lg:text-xl font-bold text-foreground">Recent Station Reports</h2>
                <button
                  onClick={() => navigate("/admin/station-reports")}
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
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 lg:p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg lg:rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer active:scale-[0.98]"
                    onClick={() => navigate(`/admin/station-reports/${report.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-foreground mb-1 text-sm lg:text-base">{report.stationName}</div>
                      <div className="text-xs lg:text-sm text-muted-foreground">{report.reportType}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Reported by {report.reportedBy} • {new Date(report.submissionDate).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap self-start sm:self-center ${getStatusBadge(report.status)}`}>
                      {report.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="lg:col-span-1 space-y-5 lg:space-y-6">
            {/* Quick Actions */}
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

            {/* Today's Activity Summary */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl lg:rounded-2xl p-5 lg:p-6 border-2 border-emerald-400/30 shadow-lg">
              <div className="flex items-center gap-3 mb-4 lg:mb-5">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-lg lg:text-xl font-bold text-foreground">Today's Summary</h2>
              </div>
              <div className="space-y-3 lg:space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs lg:text-sm font-semibold text-muted-foreground">Users Verified</span>
                  <span className="text-xl lg:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {mockStats.verifiedToday}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs lg:text-sm font-semibold text-muted-foreground">Reports Resolved</span>
                  <span className="text-xl lg:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {mockStats.reportsResolvedToday}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Admin Activity */}
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
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-2.5 lg:gap-3 p-3 lg:p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs lg:text-sm font-bold text-foreground">{activity.action}</div>
                      <div className="text-xs text-muted-foreground truncate">{activity.target}</div>
                      <div className="text-xs text-muted-foreground mt-1">{activity.timestamp}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold capitalize whitespace-nowrap flex-shrink-0 ${getStatusBadge(activity.type)}`}>
                      {activity.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
