import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, Filter, MapPin, AlertCircle, CheckCircle, XCircle, Clock, Eye, Calendar } from "lucide-react";
import { TablePagination } from "../../components/admin/TablePagination";

const mockReports = [
  {
    id: "1",
    stationName: "Petron Quezon Avenue",
    stationAddress: "123 Quezon Avenue, Quezon City",
    reportType: "Incorrect Price",
    reportedBy: "Juan Dela Cruz",
    reporterEmail: "juan@email.com",
    submissionDate: "2024-05-07 14:30:00",
    status: "pending",
    description: "Diesel price listed as ₱55.30 but actual price is ₱56.50",
  },
  {
    id: "2",
    stationName: "Shell EDSA",
    stationAddress: "456 EDSA, Makati City",
    reportType: "Duplicate Station",
    reportedBy: "Maria Santos",
    reporterEmail: "maria@email.com",
    submissionDate: "2024-05-07 10:15:00",
    status: "under_review",
    description: "This station appears to be a duplicate of Shell EDSA Main",
  },
  {
    id: "3",
    stationName: "Caltex Commonwealth",
    stationAddress: "789 Commonwealth Ave, QC",
    reportType: "Station Closed",
    reportedBy: "Pedro Reyes",
    reporterEmail: "pedro@email.com",
    submissionDate: "2024-05-06 16:45:00",
    status: "resolved",
    description: "Station has been permanently closed for 2 months",
  },
  {
    id: "4",
    stationName: "Seaoil Timog",
    stationAddress: "321 Timog Avenue, QC",
    reportType: "Wrong Location",
    reportedBy: "Ana Garcia",
    reporterEmail: "ana@email.com",
    submissionDate: "2024-05-06 09:20:00",
    status: "dismissed",
    description: "Station location on map is incorrect, actual location is 500m north",
  },
  {
    id: "5",
    stationName: "Total España",
    stationAddress: "555 España Blvd, Manila",
    reportType: "Missing Fuel Type",
    reportedBy: "Carlos Martinez",
    reporterEmail: "carlos@email.com",
    submissionDate: "2024-05-05 14:00:00",
    status: "pending",
    description: "Station sells Premium 97 but it's not listed in the app",
  },
  {
    id: "6",
    stationName: "Petron Katipunan",
    stationAddress: "888 Katipunan Ave, QC",
    reportType: "Spam/Invalid",
    reportedBy: "Sofia Rodriguez",
    reporterEmail: "sofia@email.com",
    submissionDate: "2024-05-05 11:30:00",
    status: "resolved",
    description: "Fake price updates being submitted repeatedly",
  },
];

export function StationReports() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "under_review" | "resolved" | "dismissed">("all");
  const [reportTypeFilter, setReportTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="w-4 h-4" strokeWidth={2.5} />;
      case "dismissed":
        return <XCircle className="w-4 h-4" strokeWidth={2.5} />;
      case "pending":
        return <Clock className="w-4 h-4" strokeWidth={2.5} />;
      case "under_review":
        return <AlertCircle className="w-4 h-4" strokeWidth={2.5} />;
      default:
        return <Clock className="w-4 h-4" strokeWidth={2.5} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 border-emerald-400/40";
      case "dismissed":
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-950/50 border-gray-400/40";
      case "pending":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-950/50 border-yellow-400/40";
      case "under_review":
        return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/50 border-blue-400/40";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-950/50 border-gray-400/40";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "resolved":
        return "Resolved";
      case "dismissed":
        return "Dismissed";
      case "pending":
        return "Pending";
      case "under_review":
        return "Under Review";
      default:
        return status;
    }
  };

  const filteredReports = mockReports.filter((report) => {
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    const matchesType = reportTypeFilter === "all" || report.reportType === reportTypeFilter;
    const matchesSearch =
      searchQuery === "" ||
      report.stationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reportType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  // Pagination calculations
  const totalFiltered = filteredReports.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedReports = filteredReports.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = (filterSetter: (value: any) => void, value: any) => {
    filterSetter(value);
    setCurrentPage(1);
  };

  const pendingCount = mockReports.filter((r) => r.status === "pending").length;
  const underReviewCount = mockReports.filter((r) => r.status === "under_review").length;
  const resolvedCount = mockReports.filter((r) => r.status === "resolved").length;
  const dismissedCount = mockReports.filter((r) => r.status === "dismissed").length;

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Station Reports</h1>
          <p className="text-sm lg:text-base text-muted-foreground">Review and manage station-related issue reports</p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-4 border-2 border-yellow-400/40 shadow-lg">
            <div className="text-xl lg:text-2xl font-bold text-foreground mb-1">{pendingCount}</div>
            <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Pending</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-4 border-2 border-blue-400/40 shadow-lg">
            <div className="text-xl lg:text-2xl font-bold text-foreground mb-1">{underReviewCount}</div>
            <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Under Review</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-4 border-2 border-emerald-400/40 shadow-lg">
            <div className="text-xl lg:text-2xl font-bold text-foreground mb-1">{resolvedCount}</div>
            <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Resolved</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-4 border-2 border-gray-400/40 shadow-lg">
            <div className="text-xl lg:text-2xl font-bold text-foreground mb-1">{dismissedCount}</div>
            <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Dismissed</div>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 lg:p-5 border-2 border-gray-200 dark:border-neutral-700 shadow-lg mb-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by station name or report type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none font-medium"
              />
            </div>
          </div>

          {/* Filter Buttons - Desktop */}
          <div className="hidden lg:flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-bold text-muted-foreground">Status:</span>
            </div>
            <button
              onClick={() => handleFilterChange(setStatusFilter, "all")}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                statusFilter === "all"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-neutral-800 text-foreground hover:bg-gray-200 dark:hover:bg-neutral-700"
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange(setStatusFilter, "pending")}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                statusFilter === "pending"
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-neutral-800 text-foreground hover:bg-gray-200 dark:hover:bg-neutral-700"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => handleFilterChange(setStatusFilter, "under_review")}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                statusFilter === "under_review"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-neutral-800 text-foreground hover:bg-gray-200 dark:hover:bg-neutral-700"
              }`}
            >
              Under Review
            </button>
            <button
              onClick={() => handleFilterChange(setStatusFilter, "resolved")}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                statusFilter === "resolved"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-neutral-800 text-foreground hover:bg-gray-200 dark:hover:bg-neutral-700"
              }`}
            >
              Resolved
            </button>
            <button
              onClick={() => handleFilterChange(setStatusFilter, "dismissed")}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                statusFilter === "dismissed"
                  ? "bg-gradient-to-r from-gray-600 to-gray-800 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-neutral-800 text-foreground hover:bg-gray-200 dark:hover:bg-neutral-700"
              }`}
            >
              Dismissed
            </button>

            <div className="border-l-2 border-gray-300 dark:border-neutral-700 h-8 mx-2" />

            <span className="text-sm font-bold text-muted-foreground">Type:</span>
            <select
              value={reportTypeFilter}
              onChange={(e) => handleFilterChange(setReportTypeFilter, e.target.value)}
              className="px-4 py-2 bg-gray-100 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg font-bold text-sm text-foreground focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all"
            >
              <option value="all">All Types</option>
              <option value="Incorrect Price">Incorrect Price</option>
              <option value="Duplicate Station">Duplicate Station</option>
              <option value="Station Closed">Station Closed</option>
              <option value="Wrong Location">Wrong Location</option>
              <option value="Missing Fuel Type">Missing Fuel Type</option>
              <option value="Spam/Invalid">Spam/Invalid</option>
            </select>
          </div>

          {/* Filter Buttons - Mobile (Horizontal Scroll) */}
          <div className="lg:hidden space-y-3">
            <div>
              <div className="text-xs font-bold text-muted-foreground mb-2">Status:</div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                <button
                  onClick={() => handleFilterChange(setStatusFilter, "all")}
                  className={`px-3 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all flex-shrink-0 ${
                    statusFilter === "all"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-neutral-800 text-foreground active:bg-gray-200 dark:active:bg-neutral-700"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => handleFilterChange(setStatusFilter, "pending")}
                  className={`px-3 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all flex-shrink-0 ${
                    statusFilter === "pending"
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-neutral-800 text-foreground active:bg-gray-200 dark:active:bg-neutral-700"
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  onClick={() => handleFilterChange(setStatusFilter, "under_review")}
                  className={`px-3 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all flex-shrink-0 ${
                    statusFilter === "under_review"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-neutral-800 text-foreground active:bg-gray-200 dark:active:bg-neutral-700"
                  }`}
                >
                  Under Review
                </button>
                <button
                  onClick={() => handleFilterChange(setStatusFilter, "resolved")}
                  className={`px-3 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all flex-shrink-0 ${
                    statusFilter === "resolved"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-neutral-800 text-foreground active:bg-gray-200 dark:active:bg-neutral-700"
                  }`}
                >
                  Resolved
                </button>
                <button
                  onClick={() => handleFilterChange(setStatusFilter, "dismissed")}
                  className={`px-3 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all flex-shrink-0 ${
                    statusFilter === "dismissed"
                      ? "bg-gradient-to-r from-gray-600 to-gray-800 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-neutral-800 text-foreground active:bg-gray-200 dark:active:bg-neutral-700"
                  }`}
                >
                  Dismissed
                </button>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-muted-foreground mb-2">Type:</div>
              <select
                value={reportTypeFilter}
                onChange={(e) => handleFilterChange(setReportTypeFilter, e.target.value)}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg font-bold text-sm text-foreground focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all"
              >
                <option value="all">All Types</option>
                <option value="Incorrect Price">Incorrect Price</option>
                <option value="Duplicate Station">Duplicate Station</option>
                <option value="Station Closed">Station Closed</option>
                <option value="Wrong Location">Wrong Location</option>
                <option value="Missing Fuel Type">Missing Fuel Type</option>
                <option value="Spam/Invalid">Spam/Invalid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Report Cards */}
        <div className="lg:hidden space-y-3 mb-5">
          {paginatedReports.map((report) => (
            <div
              key={report.id}
              className="bg-white dark:bg-neutral-900 rounded-lg border-2 border-gray-200 dark:border-neutral-700 shadow-lg p-4 active:scale-[0.98] transition-transform"
            >
              {/* Station Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-bold text-foreground">{report.stationName}</div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border flex-shrink-0 ${getStatusColor(
                        report.status
                      )}`}
                    >
                      {getStatusIcon(report.status)}
                      {getStatusLabel(report.status)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">{report.stationAddress}</div>
                </div>
              </div>

              {/* Report Type */}
              <div className="mb-3">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
                  {report.reportType}
                </span>
              </div>

              {/* Reported By */}
              <div className="mb-3 pb-3 border-b border-gray-200 dark:border-neutral-700">
                <div className="text-xs text-muted-foreground mb-1">Reported by:</div>
                <div className="font-semibold text-foreground text-sm">{report.reportedBy}</div>
                <div className="text-xs text-muted-foreground">{report.reporterEmail}</div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-neutral-700">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div className="text-xs text-muted-foreground">
                  {new Date(report.submissionDate).toLocaleDateString()} at{" "}
                  {new Date(report.submissionDate).toLocaleTimeString()}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => navigate(`/admin/station-reports/${report.id}`)}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-bold text-sm shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Review
              </button>
            </div>
          ))}
        </div>

        {/* Mobile Pagination */}
        {totalFiltered > 0 && (
          <div className="lg:hidden mb-5">
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

        {/* Mobile Empty State */}
        {totalFiltered === 0 && (
          <div className="lg:hidden bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 shadow-lg p-8 text-center mb-5">
            <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-2">No reports found</h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery
                ? "Try adjusting your search or filters"
                : `No ${statusFilter === "all" ? "" : statusFilter} station reports`}
            </p>
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden lg:block bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
                  <th className="text-left p-4 text-sm font-bold text-foreground">Station</th>
                  <th className="text-left p-4 text-sm font-bold text-foreground">Report Type</th>
                  <th className="text-left p-4 text-sm font-bold text-foreground">Reported By</th>
                  <th className="text-left p-4 text-sm font-bold text-foreground">Date</th>
                  <th className="text-left p-4 text-sm font-bold text-foreground">Status</th>
                  <th className="text-right p-4 text-sm font-bold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReports.map((report) => (
                  <tr
                    key={report.id}
                    className="border-b border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{report.stationName}</div>
                          <div className="text-xs text-muted-foreground">{report.stationAddress}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
                        {report.reportType}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-foreground text-sm">{report.reportedBy}</div>
                      <div className="text-xs text-muted-foreground">{report.reporterEmail}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-foreground font-semibold">
                        {new Date(report.submissionDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(report.submissionDate).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 ${getStatusColor(
                          report.status
                        )}`}
                      >
                        {getStatusIcon(report.status)}
                        {getStatusLabel(report.status)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => navigate(`/admin/station-reports/${report.id}`)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-bold text-sm shadow-lg hover:shadow-xl transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
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

          {/* Empty State */}
          {totalFiltered === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">No reports found</h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : `No ${statusFilter === "all" ? "" : statusFilter} station reports`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
