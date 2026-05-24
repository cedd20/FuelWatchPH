import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Clock,
  Eye,
  Fuel,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { TablePagination } from "@/shared/components/admin/TablePagination";
import { api as apiClient } from "@/lib/apiClient";

const STATUS_OPTIONS = ["all", "pending", "approved"];

function formatStatusLabel(status) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value) {
  if (!value) return "No timestamp";
  return new Date(value).toLocaleString();
}

function getStatusColor(status) {
  switch (status) {
    case "approved":
      return "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 border-emerald-400/40";
    default:
      return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-950/50 border-yellow-400/40";
  }
}

function getStatusIcon(status) {
  return status === "approved" ? (
    <CheckCircle className="w-4 h-4" strokeWidth={2.5} />
  ) : (
    <Clock className="w-4 h-4" strokeWidth={2.5} />
  );
}

export function FuelReports() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fuelFilter, setFuelFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    async function fetchReports() {
      setIsLoading(true);
      try {
        const data = await apiClient.get("/admin/fuel-reports");
        setReports(data || []);
      } catch (error) {
        console.error("Failed to fetch fuel reports:", error);
        setReports([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReports();
  }, []);

  const fuelOptions = useMemo(() => {
    const values = Array.from(new Set(reports.map((report) => report.fuelType).filter(Boolean)));
    return ["all", ...values];
  }, [reports]);

  const filteredReports = reports.filter((report) => {
    const haystack = [
      report.stationName,
      report.stationAddress,
      report.reportedBy,
      report.reporterEmail,
      report.fuelType,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesSearch = searchQuery === "" || haystack.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    const matchesFuel = fuelFilter === "all" || report.fuelType === fuelFilter;
    return matchesSearch && matchesStatus && matchesFuel;
  });

  const counts = {
    pending: reports.filter((report) => report.status === "pending").length,
    approved: reports.filter((report) => report.status === "approved").length,
  };

  const totalFiltered = filteredReports.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedReports = filteredReports.slice(startIndex, startIndex + rowsPerPage);

  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Fuel Reports</h1>
          <p className="text-sm lg:text-base text-muted-foreground">
            Review fuel price submissions from community members
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-4 border-2 border-gray-200 dark:border-neutral-700 shadow-lg">
            <div className="text-xl lg:text-2xl font-bold text-foreground mb-1">{reports.length}</div>
            <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Total Reports</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-4 border-2 border-yellow-400/40 shadow-lg">
            <div className="text-xl lg:text-2xl font-bold text-foreground mb-1">{counts.pending}</div>
            <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Pending</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-4 border-2 border-emerald-400/40 shadow-lg">
            <div className="text-xl lg:text-2xl font-bold text-foreground mb-1">{counts.approved}</div>
            <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Approved</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-4 border-2 border-blue-400/40 shadow-lg">
            <div className="text-xl lg:text-2xl font-bold text-foreground mb-1">
              {reports.reduce((sum, report) => sum + (report.confirmationCount || 0), 0)}
            </div>
            <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Total Confirmations</div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 lg:p-5 border-2 border-gray-200 dark:border-neutral-700 shadow-lg mb-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by station, user, email, or fuel type..."
                value={searchQuery}
                onChange={(event) => handleFilterChange(setSearchQuery, event.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none font-medium"
              />
            </div>
          </div>

          <div className="hidden lg:flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-muted-foreground">Status:</span>
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => handleFilterChange(setStatusFilter, status)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  statusFilter === status
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                    : "bg-gray-100 dark:bg-neutral-800 text-foreground hover:bg-gray-200 dark:hover:bg-neutral-700"
                }`}
              >
                {status === "all"
                  ? `All (${reports.length})`
                  : `${formatStatusLabel(status)} (${counts[status] || 0})`}
              </button>
            ))}

            <div className="border-l-2 border-gray-300 dark:border-neutral-700 h-8 mx-2" />

            <span className="text-sm font-bold text-muted-foreground">Fuel Type:</span>
            <select
              value={fuelFilter}
              onChange={(event) => handleFilterChange(setFuelFilter, event.target.value)}
              className="px-4 py-2 bg-gray-100 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg font-bold text-sm text-foreground focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all"
            >
              {fuelOptions.map((type) => (
                <option key={type} value={type}>
                  {type === "all" ? "All Fuel Types" : type}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:hidden space-y-3">
            <div>
              <div className="text-xs font-bold text-muted-foreground mb-2">Status:</div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleFilterChange(setStatusFilter, status)}
                    className={`px-3 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all flex-shrink-0 ${
                      statusFilter === status
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                        : "bg-gray-100 dark:bg-neutral-800 text-foreground active:bg-gray-200 dark:active:bg-neutral-700"
                    }`}
                  >
                    {status === "all" ? "All" : formatStatusLabel(status)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-muted-foreground mb-2">Fuel Type:</div>
              <select
                value={fuelFilter}
                onChange={(event) => handleFilterChange(setFuelFilter, event.target.value)}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg font-bold text-sm text-foreground focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all"
              >
                {fuelOptions.map((type) => (
                  <option key={type} value={type}>
                    {type === "all" ? "All Fuel Types" : type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 animate-spin" />
          </div>
        ) : (
          <>
            <div className="lg:hidden space-y-3 mb-5">
              {paginatedReports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className="w-full text-left bg-white dark:bg-neutral-900 rounded-lg border-2 border-gray-200 dark:border-neutral-700 shadow-lg p-4 active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="font-bold text-foreground">{report.stationName}</div>
                      <div className="text-xs text-muted-foreground mt-1">{report.stationAddress || "No address"}</div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(report.status)}`}>
                      {getStatusIcon(report.status)}
                      {formatStatusLabel(report.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1">
                    <Fuel className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    {report.fuelType}
                  </div>
                  <div className="text-lg font-bold text-foreground mb-1">PHP {Number(report.price || 0).toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">
                    Reported by {report.reportedBy || "Unknown user"} on {formatDateTime(report.submissionDate)}
                  </div>
                </button>
              ))}
            </div>

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

            <div className="hidden lg:block bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
                      <th className="text-left p-4 text-sm font-bold text-foreground">Station</th>
                      <th className="text-left p-4 text-sm font-bold text-foreground">Fuel</th>
                      <th className="text-left p-4 text-sm font-bold text-foreground">Price</th>
                      <th className="text-left p-4 text-sm font-bold text-foreground">Reporter</th>
                      <th className="text-left p-4 text-sm font-bold text-foreground">Submitted</th>
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
                          <div className="font-bold text-foreground">{report.stationName}</div>
                          <div className="text-xs text-muted-foreground mt-1">{report.stationAddress || "No address"}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Fuel className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            {report.fuelType}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-bold text-foreground">PHP {Number(report.price || 0).toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {report.confirmationCount || 0} confirmations
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-semibold text-foreground">{report.reportedBy || "Unknown user"}</div>
                          <div className="text-xs text-muted-foreground mt-1">{report.reporterEmail || "No email"}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-foreground font-semibold">{formatDateTime(report.submissionDate)}</div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(report.status)}`}>
                            {getStatusIcon(report.status)}
                            {formatStatusLabel(report.status)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => setSelectedReport(report)}
                              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-bold text-xs shadow-lg hover:shadow-xl transition-all flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </button>
                          </div>
                        </td>
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

            {totalFiltered === 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Fuel className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-base lg:text-lg font-bold text-foreground mb-2">No fuel reports found</h3>
                <p className="text-muted-foreground text-sm">
                  {searchQuery || fuelFilter !== "all"
                    ? "Try adjusting your filters."
                    : `No ${statusFilter === "all" ? "" : statusFilter} fuel reports are available yet.`}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-emerald-400/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-foreground">Fuel Report Details</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700">
                <div className="text-lg font-bold text-foreground">{selectedReport.stationName}</div>
                <div className="text-sm text-muted-foreground">{selectedReport.stationAddress || "No address"}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 dark:border-neutral-700 p-3">
                  <div className="text-xs text-muted-foreground font-semibold mb-1">Fuel Type</div>
                  <div className="text-sm font-bold text-foreground">{selectedReport.fuelType}</div>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-neutral-700 p-3">
                  <div className="text-xs text-muted-foreground font-semibold mb-1">Reported Price</div>
                  <div className="text-sm font-bold text-foreground">PHP {Number(selectedReport.price || 0).toFixed(2)}</div>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-neutral-700 p-3">
                  <div className="text-xs text-muted-foreground font-semibold mb-1">Status</div>
                  <div className="text-sm font-bold text-foreground capitalize">{selectedReport.status}</div>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-neutral-700 p-3">
                  <div className="text-xs text-muted-foreground font-semibold mb-1">Confirmations</div>
                  <div className="text-sm font-bold text-foreground">{selectedReport.confirmationCount || 0}</div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-neutral-700 p-4 space-y-2">
                <div className="text-sm text-foreground">
                  <span className="font-semibold">Reported by:</span> {selectedReport.reportedBy || "Unknown user"}
                </div>
                <div className="text-sm text-foreground">
                  <span className="font-semibold">Email:</span> {selectedReport.reporterEmail || "No email"}
                </div>
                <div className="text-sm text-foreground">
                  <span className="font-semibold">Submitted:</span> {formatDateTime(selectedReport.submissionDate)}
                </div>
                <div className="text-sm text-foreground">
                  <span className="font-semibold">Notes:</span> {selectedReport.notes || "No notes provided"}
                </div>
              </div>

              <button
                onClick={() => setSelectedReport(null)}
                className="w-full px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
