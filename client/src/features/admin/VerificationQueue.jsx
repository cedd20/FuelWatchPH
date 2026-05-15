import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, Filter, CheckCircle, XCircle, Clock, AlertCircle, Eye } from "lucide-react";
import { TablePagination } from "@/shared/components/admin/TablePagination";

const mockVerificationRequests = [
  {
    id: "1",
    userName: "Juan Dela Cruz",
    email: "juan.delacruz@email.com",
    idType: "National ID",
    submittedDate: "2024-05-07 14:30:00",
    status: "pending",
    reviewedBy: null,
  },
  {
    id: "2",
    userName: "Maria Santos",
    email: "maria.santos@email.com",
    idType: "Driver's License",
    submittedDate: "2024-05-07 13:15:00",
    status: "pending",
    reviewedBy: null,
  },
  {
    id: "3",
    userName: "Pedro Reyes",
    email: "pedro.reyes@email.com",
    idType: "Passport",
    submittedDate: "2024-05-07 10:45:00",
    status: "approved",
    reviewedBy: "Admin",
  },
  {
    id: "4",
    userName: "Ana Garcia",
    email: "ana.garcia@email.com",
    idType: "National ID",
    submittedDate: "2024-05-07 09:20:00",
    status: "rejected",
    reviewedBy: "Admin",
  },
  {
    id: "5",
    userName: "Carlos Martinez",
    email: "carlos.martinez@email.com",
    idType: "Driver's License",
    submittedDate: "2024-05-06 16:50:00",
    status: "pending",
    reviewedBy: null,
  },
  {
    id: "6",
    userName: "Sofia Rodriguez",
    email: "sofia.rodriguez@email.com",
    idType: "Passport",
    submittedDate: "2024-05-06 14:30:00",
    status: "needs_correction",
    reviewedBy: "Admin",
  },
  {
    id: "7",
    userName: "Luis Fernandez",
    email: "luis.fernandez@email.com",
    idType: "National ID",
    submittedDate: "2024-05-06 11:15:00",
    status: "approved",
    reviewedBy: "Admin",
  },
  {
    id: "8",
    userName: "Isabella Cruz",
    email: "isabella.cruz@email.com",
    idType: "Driver's License",
    submittedDate: "2024-05-05 17:45:00",
    status: "approved",
    reviewedBy: "Admin",
  },
];

export function VerificationQueue() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [idTypeFilter, setIdTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4" strokeWidth={2.5} />;
      case "rejected":
        return <XCircle className="w-4 h-4" strokeWidth={2.5} />;
      case "pending":
        return <Clock className="w-4 h-4" strokeWidth={2.5} />;
      case "needs_correction":
        return <AlertCircle className="w-4 h-4" strokeWidth={2.5} />;
      default:
        return <Clock className="w-4 h-4" strokeWidth={2.5} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 border-emerald-400/40";
      case "rejected":
        return "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/50 border-rose-400/40";
      case "pending":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-950/50 border-yellow-400/40";
      case "needs_correction":
        return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/50 border-blue-400/40";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-950/50 border-gray-400/40";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "pending":
        return "Pending";
      case "needs_correction":
        return "Needs Correction";
      default:
        return status;
    }
  };

  const filteredRequests = mockVerificationRequests.filter((request) => {
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      request.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIdType = idTypeFilter === "all" || request.idType === idTypeFilter;
    return matchesStatus && matchesSearch && matchesIdType;
  });

  // Pagination calculations
  const totalFiltered = filteredRequests.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = (filterSetter, value) => {
    filterSetter(value);
    setCurrentPage(1);
  };

  const pendingCount = mockVerificationRequests.filter((r) => r.status === "pending").length;
  const approvedCount = mockVerificationRequests.filter((r) => r.status === "approved").length;
  const rejectedCount = mockVerificationRequests.filter((r) => r.status === "rejected").length;
  const needsCorrectionCount = mockVerificationRequests.filter((r) => r.status === "needs_correction").length;

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Page Header */}
        <div className="mb-5 lg:mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1 lg:mb-2">Verification Requests</h1>
          <p className="text-sm lg:text-base text-muted-foreground">Review and manage user identity verification submissions</p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5 lg:mb-6">
          <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-xl p-3.5 lg:p-4 border-2 border-yellow-400/40 shadow-lg">
            <div className="text-xl lg:text-2xl font-bold text-foreground mb-0.5 lg:mb-1">{pendingCount}</div>
            <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Pending</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-xl p-3.5 lg:p-4 border-2 border-emerald-400/40 shadow-lg">
            <div className="text-xl lg:text-2xl font-bold text-foreground mb-0.5 lg:mb-1">{approvedCount}</div>
            <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Approved</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-xl p-3.5 lg:p-4 border-2 border-rose-400/40 shadow-lg">
            <div className="text-xl lg:text-2xl font-bold text-foreground mb-0.5 lg:mb-1">{rejectedCount}</div>
            <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Rejected</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-xl p-3.5 lg:p-4 border-2 border-blue-400/40 shadow-lg">
            <div className="text-xl lg:text-2xl font-bold text-foreground mb-0.5 lg:mb-1">{needsCorrectionCount}</div>
            <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Needs Review</div>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white dark:bg-neutral-900 rounded-lg lg:rounded-xl p-4 lg:p-5 border-2 border-gray-200 dark:border-neutral-700 shadow-lg mb-5 lg:mb-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 lg:pl-12 pr-4 py-2.5 lg:py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg text-sm lg:text-base text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none font-medium"
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
              onClick={() => handleFilterChange(setStatusFilter, "approved")}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                statusFilter === "approved"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-neutral-800 text-foreground hover:bg-gray-200 dark:hover:bg-neutral-700"
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => handleFilterChange(setStatusFilter, "rejected")}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                statusFilter === "rejected"
                  ? "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-neutral-800 text-foreground hover:bg-gray-200 dark:hover:bg-neutral-700"
              }`}
            >
              Rejected
            </button>
            <button
              onClick={() => handleFilterChange(setStatusFilter, "needs_correction")}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                statusFilter === "needs_correction"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-neutral-800 text-foreground hover:bg-gray-200 dark:hover:bg-neutral-700"
              }`}
            >
              Needs Review
            </button>

            <div className="border-l-2 border-gray-300 dark:border-neutral-700 h-8 mx-2" />

            <span className="text-sm font-bold text-muted-foreground">ID Type:</span>
            <select
              value={idTypeFilter}
              onChange={(e) => handleFilterChange(setIdTypeFilter, e.target.value)}
              className="px-4 py-2 bg-gray-100 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg font-bold text-sm text-foreground focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all"
            >
              <option value="all">All Types</option>
              <option value="National ID">National ID</option>
              <option value="Driver's License">Driver's License</option>
              <option value="Passport">Passport</option>
            </select>
          </div>

          {/* Filter Buttons - Mobile (Horizontal Scroll) */}
          <div className="lg:hidden">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs font-bold text-muted-foreground">Status:</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              <button
                onClick={() => handleFilterChange(setStatusFilter, "all")}
                className={`px-3 py-2 rounded-lg font-bold text-xs transition-all whitespace-nowrap flex-shrink-0 ${
                  statusFilter === "all"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                    : "bg-gray-100 dark:bg-neutral-800 text-foreground active:bg-gray-200 dark:active:bg-neutral-700"
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleFilterChange(setStatusFilter, "pending")}
                className={`px-3 py-2 rounded-lg font-bold text-xs transition-all whitespace-nowrap flex-shrink-0 ${
                  statusFilter === "pending"
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg"
                    : "bg-gray-100 dark:bg-neutral-800 text-foreground active:bg-gray-200 dark:active:bg-neutral-700"
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => handleFilterChange(setStatusFilter, "approved")}
                className={`px-3 py-2 rounded-lg font-bold text-xs transition-all whitespace-nowrap flex-shrink-0 ${
                  statusFilter === "approved"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                    : "bg-gray-100 dark:bg-neutral-800 text-foreground active:bg-gray-200 dark:active:bg-neutral-700"
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => handleFilterChange(setStatusFilter, "rejected")}
                className={`px-3 py-2 rounded-lg font-bold text-xs transition-all whitespace-nowrap flex-shrink-0 ${
                  statusFilter === "rejected"
                    ? "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg"
                    : "bg-gray-100 dark:bg-neutral-800 text-foreground active:bg-gray-200 dark:active:bg-neutral-700"
                }`}
              >
                Rejected
              </button>
              <button
                onClick={() => handleFilterChange(setStatusFilter, "needs_correction")}
                className={`px-3 py-2 rounded-lg font-bold text-xs transition-all whitespace-nowrap flex-shrink-0 ${
                  statusFilter === "needs_correction"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                    : "bg-gray-100 dark:bg-neutral-800 text-foreground active:bg-gray-200 dark:active:bg-neutral-700"
                }`}
              >
                Needs Review
              </button>
            </div>

            <div className="mt-3 pt-3 border-t-2 border-gray-200 dark:border-neutral-700">
              <label className="block text-xs font-bold text-muted-foreground mb-2">ID Type:</label>
              <select
                value={idTypeFilter}
                onChange={(e) => handleFilterChange(setIdTypeFilter, e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg font-bold text-xs text-foreground focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all"
              >
                <option value="all">All Types</option>
                <option value="National ID">National ID</option>
                <option value="Driver's License">Driver's License</option>
                <option value="Passport">Passport</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Request Cards */}
        <div className="lg:hidden space-y-3 mb-5">
          {paginatedRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white dark:bg-neutral-900 rounded-lg border-2 border-gray-200 dark:border-neutral-700 shadow-lg p-4 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-foreground text-base mb-1">{request.userName}</div>
                  <div className="text-xs text-muted-foreground truncate">{request.email}</div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border-2 flex-shrink-0 ${getStatusColor(
                    request.status
                  )}`}
                >
                  {getStatusIcon(request.status)}
                  <span className="hidden xs:inline">{getStatusLabel(request.status)}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                <div>
                  <div className="text-muted-foreground font-semibold mb-0.5">ID Type</div>
                  <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-neutral-800 text-foreground rounded text-xs font-bold">
                    {request.idType}
                  </span>
                </div>
                <div>
                  <div className="text-muted-foreground font-semibold mb-0.5">Submitted</div>
                  <div className="text-foreground font-bold">
                    {new Date(request.submittedDate).toLocaleDateString()}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {new Date(request.submittedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {request.reviewedBy && (
                <div className="text-xs text-muted-foreground mb-3">
                  <span className="font-semibold">Reviewed by:</span> {request.reviewedBy}
                </div>
              )}

              <button
                onClick={() => navigate(`/admin/verification/${request.id}`)}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Review Request
              </button>
            </div>
          ))}
        </div>

        {/* Desktop Requests Table */}
        <div className="hidden lg:block bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
                  <th className="text-left p-4 text-sm font-bold text-foreground">User</th>
                  <th className="text-left p-4 text-sm font-bold text-foreground">ID Type</th>
                  <th className="text-left p-4 text-sm font-bold text-foreground">Submitted</th>
                  <th className="text-left p-4 text-sm font-bold text-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-bold text-foreground">Reviewed By</th>
                  <th className="text-right p-4 text-sm font-bold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-b border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-bold text-foreground">{request.userName}</div>
                      <div className="text-sm text-muted-foreground">{request.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-gray-100 dark:bg-neutral-800 text-foreground rounded-full text-xs font-bold">
                        {request.idType}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-foreground font-semibold">
                        {new Date(request.submittedDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(request.submittedDate).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {getStatusIcon(request.status)}
                        {getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground font-semibold">
                        {request.reviewedBy || "—"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => navigate(`/admin/verification/${request.id}`)}
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

          {/* Pagination Footer - Desktop */}
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

          {/* Empty State - Desktop */}
          {totalFiltered === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">No requests found</h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery ? "Try adjusting your search or filters" : `No ${statusFilter === "all" ? "" : statusFilter} verification requests`}
              </p>
            </div>
          )}
        </div>

        {/* Mobile Pagination Footer */}
        {totalFiltered > 0 && (
          <div className="lg:hidden bg-white dark:bg-neutral-900 rounded-lg border-2 border-gray-200 dark:border-neutral-700 shadow-lg p-4 mt-3">
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
        )}

        {/* Empty State - Mobile */}
        {totalFiltered === 0 && (
          <div className="lg:hidden bg-white dark:bg-neutral-900 rounded-lg border-2 border-gray-200 dark:border-neutral-700 shadow-lg p-8 text-center">
            <div className="w-14 h-14 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <Filter className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-2">No requests found</h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery ? "Try adjusting your search or filters" : `No ${statusFilter === "all" ? "" : statusFilter} verification requests`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
