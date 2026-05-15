import { useState } from "react";
import { Search, Shield, Ban, User, X, Eye } from "lucide-react";
import { TablePagination } from "@/shared/components/admin/TablePagination";

const mockUsers = [
  {
    id: "1",
    name: "Juan Dela Cruz",
    email: "juan.delacruz@email.com",
    verificationStatus: "verified",
    contributorStatus: "trusted",
    totalUpdates: 45,
    accuracyRate: 98,
    accountStatus: "active",
    joinDate: "2024-01-15",
  },
  {
    id: "2",
    name: "Maria Santos",
    email: "maria.santos@email.com",
    verificationStatus: "verified",
    contributorStatus: "regular",
    totalUpdates: 23,
    accuracyRate: 95,
    accountStatus: "active",
    joinDate: "2024-02-20",
  },
  {
    id: "3",
    name: "Pedro Reyes",
    email: "pedro.reyes@email.com",
    verificationStatus: "pending",
    contributorStatus: "regular",
    totalUpdates: 8,
    accuracyRate: 90,
    accountStatus: "active",
    joinDate: "2024-04-10",
  },
  {
    id: "4",
    name: "Ana Garcia",
    email: "ana.garcia@email.com",
    verificationStatus: "verified",
    contributorStatus: "trusted",
    totalUpdates: 67,
    accuracyRate: 97,
    accountStatus: "active",
    joinDate: "2023-11-05",
  },
  {
    id: "5",
    name: "Carlos Martinez",
    email: "carlos.martinez@email.com",
    verificationStatus: "unverified",
    contributorStatus: "regular",
    totalUpdates: 3,
    accuracyRate: 85,
    accountStatus: "active",
    joinDate: "2024-05-01",
  },
];

export function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [banModalData, setBanModalData] = useState(null);
  const [banReason, setBanReason] = useState("");
  const [banNotes, setBanNotes] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleBanUser = () => {
    if (banModalData && banReason) {
      console.log("Banning user:", banModalData.userId, "Reason:", banReason, "Notes:", banNotes);
      setBanModalData(null);
      setBanReason("");
      setBanNotes("");
    }
  };

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      searchQuery === "" ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.verificationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalFiltered = filteredUsers.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = (filterSetter, value) => {
    filterSetter(value);
    setCurrentPage(1);
  };

  const verifiedCount = mockUsers.filter((u) => u.verificationStatus === "verified").length;
  const trustedCount = mockUsers.filter((u) => u.contributorStatus === "trusted").length;
  const pendingCount = mockUsers.filter((u) => u.verificationStatus === "pending").length;

  const getVerificationBadge = (status) => {
    switch (status) {
      case "verified":
        return "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50";
      case "pending":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-950/50";
      case "unverified":
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-950/50";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-950/50";
    }
  };

  return (
    <>
      <div className="p-4 lg:p-8">
        <div className="max-w-[1600px] mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">User Management</h1>
            <p className="text-sm lg:text-base text-muted-foreground">Manage users, view profiles, and moderate accounts</p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-4 border-2 border-emerald-400/40 shadow-lg">
              <div className="text-xl lg:text-2xl font-bold text-foreground mb-1">{mockUsers.length}</div>
              <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Total Users</div>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-4 border-2 border-emerald-400/40 shadow-lg">
              <div className="text-xl lg:text-2xl font-bold text-foreground mb-1">{verifiedCount}</div>
              <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Verified</div>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-4 border-2 border-blue-400/40 shadow-lg">
              <div className="text-xl lg:text-2xl font-bold text-foreground mb-1">{trustedCount}</div>
              <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Trusted Contributors</div>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-4 border-2 border-yellow-400/40 shadow-lg">
              <div className="text-xl lg:text-2xl font-bold text-foreground mb-1">{pendingCount}</div>
              <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Pending Verification</div>
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
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none font-medium"
                />
              </div>
            </div>

            {/* Filter Buttons - Desktop */}
            <div className="hidden lg:flex flex-wrap items-center gap-3">
              <span className="text-sm font-bold text-muted-foreground">Verification Status:</span>
              <button
                onClick={() => handleFilterChange(setStatusFilter, "all")}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  statusFilter === "all"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                    : "bg-gray-100 dark:bg-neutral-800 text-foreground hover:bg-gray-200 dark:hover:bg-neutral-700"
                }`}
              >
                All Users
              </button>
              <button
                onClick={() => handleFilterChange(setStatusFilter, "verified")}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  statusFilter === "verified"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                    : "bg-gray-100 dark:bg-neutral-800 text-foreground hover:bg-gray-200 dark:hover:bg-neutral-700"
                }`}
              >
                Verified
              </button>
              <button
                onClick={() => handleFilterChange(setStatusFilter, "pending")}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  statusFilter === "pending"
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg"
                    : "bg-gray-100 dark:bg-neutral-800 text-foreground hover:bg-gray-200 dark:hover:bg-neutral-700"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => handleFilterChange(setStatusFilter, "unverified")}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  statusFilter === "unverified"
                    ? "bg-gradient-to-r from-gray-600 to-gray-800 text-white shadow-lg"
                    : "bg-gray-100 dark:bg-neutral-800 text-foreground hover:bg-gray-200 dark:hover:bg-neutral-700"
                }`}
              >
                Unverified
              </button>
            </div>

            {/* Filter Buttons - Mobile (Horizontal Scroll) */}
            <div className="lg:hidden">
              <div className="text-xs font-bold text-muted-foreground mb-2">Verification Status:</div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                <button
                  onClick={() => handleFilterChange(setStatusFilter, "all")}
                  className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all flex-shrink-0 ${
                    statusFilter === "all"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-neutral-800 text-foreground active:bg-gray-200 dark:active:bg-neutral-700"
                  }`}
                >
                  All Users
                </button>
                <button
                  onClick={() => handleFilterChange(setStatusFilter, "verified")}
                  className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all flex-shrink-0 ${
                    statusFilter === "verified"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-neutral-800 text-foreground active:bg-gray-200 dark:active:bg-neutral-700"
                  }`}
                >
                  Verified
                </button>
                <button
                  onClick={() => handleFilterChange(setStatusFilter, "pending")}
                  className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all flex-shrink-0 ${
                    statusFilter === "pending"
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-neutral-800 text-foreground active:bg-gray-200 dark:active:bg-neutral-700"
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => handleFilterChange(setStatusFilter, "unverified")}
                  className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all flex-shrink-0 ${
                    statusFilter === "unverified"
                      ? "bg-gradient-to-r from-gray-600 to-gray-800 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-neutral-800 text-foreground active:bg-gray-200 dark:active:bg-neutral-700"
                  }`}
                >
                  Unverified
                </button>
              </div>
            </div>
          </div>

          {/* Mobile User Cards */}
          <div className="lg:hidden space-y-3 mb-5">
            {paginatedUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white dark:bg-neutral-900 rounded-lg border-2 border-gray-200 dark:border-neutral-700 shadow-lg p-4 active:scale-[0.98] transition-transform"
              >
                {/* User Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <div className="font-bold text-foreground">{user.name}</div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${getVerificationBadge(user.verificationStatus)}`}>
                        {user.verificationStatus === "unverified" ? "Not Verified" : user.verificationStatus}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  </div>
                </div>

                {/* Contributor Status */}
                <div className="mb-3">
                  {user.contributorStatus === "trusted" ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
                      <Shield className="w-3 h-3" strokeWidth={2.5} />
                      Trusted Contributor
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground font-semibold">Regular User</span>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-3 pb-3 border-b border-gray-200 dark:border-neutral-700">
                  <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-2.5">
                    <div className="text-xs text-muted-foreground font-semibold mb-1">Updates</div>
                    <div className="text-base font-bold text-foreground">{user.totalUpdates}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-2.5">
                    <div className="text-xs text-muted-foreground font-semibold mb-1">Accuracy</div>
                    <div className="text-base font-bold text-foreground">{user.accuracyRate}%</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-2.5">
                    <div className="text-xs text-muted-foreground font-semibold mb-1">Joined</div>
                    <div className="text-xs font-bold text-foreground">
                      {new Date(user.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button className="px-4 py-2 bg-gray-100 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg font-bold text-xs text-foreground active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </button>
                  <button
                    onClick={() => setBanModalData({ userId: user.id, userName: user.name, userEmail: user.email })}
                    className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-lg font-bold text-xs shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Ban
                  </button>
                </div>
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
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">No users found</h3>
              <p className="text-muted-foreground text-sm">Try adjusting your search or filters</p>
            </div>
          )}

          {/* Desktop Table */}
          <div className="hidden lg:block bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
                    <th className="text-left p-4 text-sm font-bold text-foreground">User</th>
                    <th className="text-left p-4 text-sm font-bold text-foreground">Verification</th>
                    <th className="text-left p-4 text-sm font-bold text-foreground">Contributor Status</th>
                    <th className="text-left p-4 text-sm font-bold text-foreground">Updates</th>
                    <th className="text-left p-4 text-sm font-bold text-foreground">Accuracy</th>
                    <th className="text-left p-4 text-sm font-bold text-foreground">Joined</th>
                    <th className="text-right p-4 text-sm font-bold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                          </div>
                          <div>
                            <div className="font-bold text-foreground">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getVerificationBadge(user.verificationStatus)}`}>
                          {user.verificationStatus === "unverified" ? "Not Verified" : user.verificationStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        {user.contributorStatus === "trusted" ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">
                            <Shield className="w-3 h-3" strokeWidth={2.5} />
                            Trusted
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground font-semibold">Regular</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-bold text-foreground">{user.totalUpdates}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-bold text-foreground">{user.accuracyRate}%</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground font-semibold">
                          {new Date(user.joinDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="px-3 py-1.5 bg-gray-100 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg font-bold text-xs text-foreground hover:border-emerald-500 transition-all flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                          <button
                            onClick={() => setBanModalData({ userId: user.id, userName: user.name, userEmail: user.email })}
                            className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-lg font-bold text-xs shadow-lg hover:shadow-xl transition-all flex items-center gap-1"
                          >
                            <Ban className="w-3 h-3" />
                            Ban
                          </button>
                        </div>
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
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">No users found</h3>
                <p className="text-muted-foreground text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ban User Modal */}
      {banModalData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-rose-400/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-foreground">Ban User</h3>
              <button
                onClick={() => {
                  setBanModalData(null);
                  setBanReason("");
                  setBanNotes("");
                }}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="mb-5 p-4 bg-rose-50 dark:bg-rose-950/20 rounded-xl border-2 border-rose-200 dark:border-rose-800">
              <p className="text-sm font-semibold text-foreground mb-1">{banModalData.userName}</p>
              <p className="text-xs text-muted-foreground">{banModalData.userEmail}</p>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-bold text-foreground mb-2">Ban Reason (Required)</label>
              <select
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl text-foreground focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all outline-none"
              >
                <option value="">Select a reason...</option>
                <option value="spam">Spam or fraudulent activity</option>
                <option value="abuse">Abusive behavior</option>
                <option value="false_info">Submitting false information</option>
                <option value="multiple_accounts">Multiple accounts</option>
                <option value="other">Other violation</option>
              </select>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-bold text-foreground mb-2">Additional Notes (Optional)</label>
              <textarea
                value={banNotes}
                onChange={(e) => setBanNotes(e.target.value)}
                placeholder="Add any additional details about this ban..."
                className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all outline-none resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setBanModalData(null);
                  setBanReason("");
                  setBanNotes("");
                }}
                className="flex-1 px-5 py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl font-bold text-foreground hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleBanUser}
                disabled={!banReason}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
