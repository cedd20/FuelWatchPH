import { useEffect, useState } from "react";
import { Filter, Loader2, Search } from "lucide-react";
import { TablePagination } from "@/shared/components/admin/TablePagination";
import { api as apiClient } from "@/lib/apiClient";

const ACTION_FILTERS = [
  { value: "all", label: "All" },
  { value: "verification_approved", label: "Approved" },
  { value: "verification_rejected", label: "Rejected" },
  { value: "correction_requested", label: "Correction Requested" },
  { value: "user_banned", label: "Banned" },
  { value: "user_unbanned", label: "Unbanned" },
  { value: "report_resolved", label: "Reports Resolved" },
  { value: "report_dismissed", label: "Reports Dismissed" },
  { value: "report_under_review", label: "Reports In Review" },
];

function formatActionType(type) {
  return (type || "unknown").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value) {
  if (!value) return "No timestamp";
  return new Date(value).toLocaleString();
}

export function AdminActivityLog() {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    async function fetchActivities() {
      setIsLoading(true);
      try {
        const path =
          typeFilter === "all"
            ? "/admin/activity-log"
            : `/admin/activity-log?action_type=${encodeURIComponent(typeFilter)}`;
        const data = await apiClient.get(path);
        setActivities(data || []);
      } catch (error) {
        console.error("Failed to fetch admin activity log:", error);
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchActivities();
  }, [typeFilter]);

  const filteredActivities = activities.filter((activity) => {
    const haystack = [
      activity.adminName,
      activity.targetUser,
      activity.details,
      activity.notes,
      activity.type,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return searchQuery === "" || haystack.includes(searchQuery.toLowerCase());
  });

  const counts = {
    verifications: activities.filter((entry) =>
      ["verification_approved", "verification_rejected", "correction_requested"].includes(entry.type)
    ).length,
    userActions: activities.filter((entry) => ["user_banned", "user_unbanned"].includes(entry.type)).length,
    reports: activities.filter((entry) =>
      ["report_resolved", "report_dismissed", "report_under_review"].includes(entry.type)
    ).length,
  };

  const totalFiltered = filteredActivities.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedActivities = filteredActivities.slice(startIndex, startIndex + rowsPerPage);

  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Admin Activity Log</h1>
          <p className="text-sm lg:text-base text-muted-foreground">
            Track all administrative actions and decisions
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-4 border-2 border-emerald-400/40 shadow-lg">
            <div className="text-xl lg:text-2xl font-bold text-foreground mb-1">{activities.length}</div>
            <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Total Actions</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-4 border-2 border-blue-400/40 shadow-lg">
            <div className="text-xl lg:text-2xl font-bold text-foreground mb-1">{counts.verifications}</div>
            <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Verifications</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-4 border-2 border-rose-400/40 shadow-lg">
            <div className="text-xl lg:text-2xl font-bold text-foreground mb-1">{counts.userActions}</div>
            <div className="text-xs lg:text-sm text-muted-foreground font-semibold">User Actions</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-4 border-2 border-teal-400/40 shadow-lg">
            <div className="text-xl lg:text-2xl font-bold text-foreground mb-1">{counts.reports}</div>
            <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Reports Handled</div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 lg:p-5 border-2 border-gray-200 dark:border-neutral-700 shadow-lg mb-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by admin, target, details, or notes..."
                value={searchQuery}
                onChange={(event) => handleFilterChange(setSearchQuery, event.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none font-medium"
              />
            </div>
          </div>

          <div className="hidden lg:flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-bold text-muted-foreground">Action Type:</span>
            </div>
            {ACTION_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => handleFilterChange(setTypeFilter, filter.value)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  typeFilter === filter.value
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                    : "bg-gray-100 dark:bg-neutral-800 text-foreground hover:bg-gray-200 dark:hover:bg-neutral-700"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="lg:hidden">
            <div className="text-xs font-bold text-muted-foreground mb-2">Action Type:</div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {ACTION_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => handleFilterChange(setTypeFilter, filter.value)}
                  className={`px-3 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all flex-shrink-0 ${
                    typeFilter === filter.value
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-neutral-800 text-foreground active:bg-gray-200 dark:active:bg-neutral-700"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 animate-spin" />
          </div>
        ) : (
          <>
            <div className="hidden lg:block bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
                      <th className="text-left p-4 text-sm font-bold text-foreground">Action</th>
                      <th className="text-left p-4 text-sm font-bold text-foreground">Admin</th>
                      <th className="text-left p-4 text-sm font-bold text-foreground">Target</th>
                      <th className="text-left p-4 text-sm font-bold text-foreground">Notes</th>
                      <th className="text-left p-4 text-sm font-bold text-foreground">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedActivities.map((activity) => (
                      <tr key={activity.id} className="border-b border-gray-200 dark:border-neutral-700">
                        <td className="p-4">
                          <div className="font-bold text-foreground">{activity.details || formatActionType(activity.type)}</div>
                          <div className="text-xs text-muted-foreground mt-1">{formatActionType(activity.type)}</div>
                        </td>
                        <td className="p-4 text-sm font-semibold text-foreground">{activity.adminName || "Admin"}</td>
                        <td className="p-4 text-sm text-foreground">{activity.targetUser || "No target"}</td>
                        <td className="p-4 text-sm text-muted-foreground max-w-md">{activity.notes || "No notes"}</td>
                        <td className="p-4 text-sm text-foreground">{formatDateTime(activity.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalFiltered > 0 && (
                <TablePagination
                  currentPage={currentPage}
                  totalItems={totalFiltered}
                  rowsPerPage={rowsPerPage}
                  onPageChange={setCurrentPage}
                  onRowsPerPageChange={(rows) => {
                    setRowsPerPage(rows);
                    setCurrentPage(1);
                  }}
                />
              )}
            </div>

            <div className="lg:hidden space-y-3">
              {paginatedActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-white dark:bg-neutral-900 rounded-lg border-2 border-gray-200 dark:border-neutral-700 shadow-lg p-4"
                >
                  <div className="font-bold text-foreground">{activity.details || formatActionType(activity.type)}</div>
                  <div className="text-xs text-muted-foreground mt-1">{formatActionType(activity.type)}</div>
                  <div className="mt-3 text-sm text-foreground">Admin: {activity.adminName || "Admin"}</div>
                  <div className="mt-1 text-sm text-foreground">Target: {activity.targetUser || "No target"}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{activity.notes || "No notes"}</div>
                  <div className="mt-3 text-xs text-muted-foreground">{formatDateTime(activity.timestamp)}</div>
                </div>
              ))}
            </div>

            {totalFiltered > 0 && (
              <div className="lg:hidden">
                <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 shadow-lg overflow-hidden">
                  <TablePagination
                    currentPage={currentPage}
                    totalItems={totalFiltered}
                    rowsPerPage={rowsPerPage}
                    onPageChange={setCurrentPage}
                    onRowsPerPageChange={(rows) => {
                      setRowsPerPage(rows);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>
            )}

            {totalFiltered === 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 shadow-lg p-8 text-center">
                <h3 className="text-base lg:text-lg font-bold text-foreground mb-2">No activity found</h3>
                <p className="text-muted-foreground text-sm">Try adjusting the current filters.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
