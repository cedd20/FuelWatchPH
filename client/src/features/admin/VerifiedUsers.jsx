import { useState, useEffect } from "react";
import { Search, Shield, CheckCircle, TrendingUp, Calendar, Eye, Loader2, X } from "lucide-react";
import { TablePagination } from "@/shared/components/admin/TablePagination";
import { api as apiClient } from "@/lib/apiClient";

export function VerifiedUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [contributorFilter, setContributorFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true);
      try {
        const data = await apiClient.get("/admin/verified-users");
        setUsers(data || []);
      } catch (error) {
        console.error("Failed to fetch verified users:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === "" ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesContributor =
      contributorFilter === "all" ||
      (contributorFilter === "trusted" && (user.karma || 0) > 200) ||
      (contributorFilter === "regular" && (user.karma || 0) <= 200);
    return matchesSearch && matchesContributor;
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

  const totalVerified = users.length;
  const trustedCount = users.filter((u) => (u.karma || 0) > 200).length;
  const regularCount = totalVerified - trustedCount;
  const avgAccuracy = users.length > 0 ? (
    users.reduce((sum, u) => sum + u.accuracyRate, 0) / users.length
  ).toFixed(1) : "0.0";


  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Verified Users</h1>
          <p className="text-sm lg:text-base text-muted-foreground">View and manage all verified community members</p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-4 border-2 border-emerald-400/40 shadow-lg">
            <div className="text-xl lg:text-2xl font-bold text-foreground mb-1">{totalVerified}</div>
            <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Total Verified</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-4 border-2 border-blue-400/40 shadow-lg">
            <div className="text-xl lg:text-2xl font-bold text-foreground mb-1">{trustedCount}</div>
            <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Trusted Contributors</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-4 border-2 border-gray-400/40 shadow-lg">
            <div className="text-xl lg:text-2xl font-bold text-foreground mb-1">{regularCount}</div>
            <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Regular Users</div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-4 border-2 border-emerald-400/40 shadow-lg">
            <div className="text-xl lg:text-2xl font-bold text-foreground mb-1">{avgAccuracy}%</div>
            <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Avg Accuracy</div>
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
                placeholder="Search verified users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none font-medium"
              />
            </div>
          </div>

          {/* Filter Buttons - Desktop */}
          <div className="hidden lg:flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-muted-foreground">Contributor Status:</span>
            <button
              onClick={() => handleFilterChange(setContributorFilter, "all")}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                contributorFilter === "all"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-neutral-800 text-foreground hover:bg-gray-200 dark:hover:bg-neutral-700"
              }`}
            >
              All ({totalVerified})
            </button>
            <button
              onClick={() => handleFilterChange(setContributorFilter, "trusted")}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                contributorFilter === "trusted"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-neutral-800 text-foreground hover:bg-gray-200 dark:hover:bg-neutral-700"
              }`}
            >
              Trusted ({trustedCount})
            </button>
            <button
              onClick={() => handleFilterChange(setContributorFilter, "regular")}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                contributorFilter === "regular"
                  ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg"
                  : "bg-gray-100 dark:bg-neutral-800 text-foreground hover:bg-gray-200 dark:hover:bg-neutral-700"
              }`}
            >
              Regular ({regularCount})
            </button>
          </div>

          {/* Filter Buttons - Mobile (Horizontal Scroll) */}
          <div className="lg:hidden">
            <div className="text-xs font-bold text-muted-foreground mb-2">Contributor Status:</div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              <button
                onClick={() => handleFilterChange(setContributorFilter, "all")}
                className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all flex-shrink-0 ${
                  contributorFilter === "all"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                    : "bg-gray-100 dark:bg-neutral-800 text-foreground active:bg-gray-200 dark:active:bg-neutral-700"
                }`}
              >
                All ({totalVerified})
              </button>
              <button
                onClick={() => handleFilterChange(setContributorFilter, "trusted")}
                className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all flex-shrink-0 ${
                  contributorFilter === "trusted"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                    : "bg-gray-100 dark:bg-neutral-800 text-foreground active:bg-gray-200 dark:active:bg-neutral-700"
                }`}
              >
                Trusted ({trustedCount})
              </button>
              <button
                onClick={() => handleFilterChange(setContributorFilter, "regular")}
                className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all flex-shrink-0 ${
                  contributorFilter === "regular"
                    ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg"
                    : "bg-gray-100 dark:bg-neutral-800 text-foreground active:bg-gray-200 dark:active:bg-neutral-700"
                }`}
              >
                Regular ({regularCount})
              </button>
            </div>
          </div>
        </div>

        {/* Mobile / Desktop Loading & Content */}
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 animate-spin" />
          </div>
        ) : (
          <>
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
                      <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <div className="font-bold text-foreground">{user.name}</div>
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded text-xs font-bold border border-emerald-400/40">
                          Verified
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{user.email || "No Email"}</div>
                    </div>
                  </div>

                  {/* Contributor Status */}
                  <div className="mb-3">
                    {(user.karma || 0) > 200 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold border-2 border-blue-400/40">
                        <Shield className="w-3.5 h-3.5" strokeWidth={2.5} />
                        Trusted Contributor
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 dark:bg-neutral-800 text-foreground rounded-full text-xs font-bold">
                        Regular User
                      </span>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs text-muted-foreground font-semibold">Updates</span>
                      </div>
                      <div className="text-base font-bold text-foreground">{user.totalUpdates}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-2.5">
                      <div className="text-xs text-muted-foreground font-semibold mb-1">Accuracy</div>
                      <div className="text-base font-bold text-foreground mb-1">{user.accuracyRate}%</div>
                      <div className="w-full h-1.5 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                          style={{ width: `${user.accuracyRate}%` }}
                        />
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-2.5">
                      <div className="text-xs text-muted-foreground font-semibold mb-1">Reports</div>
                      <div className="text-base font-bold text-foreground">{user.reportsSubmitted}</div>
                    </div>
                  </div>

                  {/* Verified Date */}
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-neutral-700">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div className="text-xs text-muted-foreground">
                      Verified on {new Date(user.verificationDate).toLocaleDateString()} at{" "}
                      {new Date(user.verificationDate).toLocaleTimeString()}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-bold text-sm shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Profile
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
                  <CheckCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">No verified users found</h3>
                <p className="text-muted-foreground text-sm">
                  {searchQuery ? "Try adjusting your search" : "No verified users match the selected filters"}
                </p>
              </div>
            )}

            {/* Desktop Table */}
            <div className="hidden lg:block bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
                      <th className="text-left p-4 text-sm font-bold text-foreground">User</th>
                      <th className="text-left p-4 text-sm font-bold text-foreground">Contributor Status</th>
                      <th className="text-left p-4 text-sm font-bold text-foreground">Updates</th>
                      <th className="text-left p-4 text-sm font-bold text-foreground">Accuracy</th>
                      <th className="text-left p-4 text-sm font-bold text-foreground">Reports</th>
                      <th className="text-left p-4 text-sm font-bold text-foreground">Verified</th>
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
                              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <div className="font-bold text-foreground">{user.name}</div>
                                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded text-xs font-bold border border-emerald-400/40">
                                  Verified
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">{user.email || "No Email"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {(user.karma || 0) > 200 ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold border-2 border-blue-400/40">
                              <Shield className="w-3.5 h-3.5" strokeWidth={2.5} />
                              Trusted Contributor
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-100 dark:bg-neutral-800 text-foreground rounded-full text-xs font-bold">
                              Regular User
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-sm font-bold text-foreground">{user.totalUpdates}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <div className="text-sm font-bold text-foreground mb-1">{user.accuracyRate}%</div>
                              <div className="w-20 h-2 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                                  style={{ width: `${user.accuracyRate}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-semibold text-muted-foreground">{user.reportsSubmitted}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm text-foreground font-semibold">
                                {new Date(user.verificationDate).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(user.verificationDate).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-bold text-xs shadow-lg hover:shadow-xl transition-all flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              View Profile
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
                    <CheckCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">No verified users found</h3>
                  <p className="text-muted-foreground text-sm">
                    {searchQuery ? "Try adjusting your search" : "No verified users match the selected filters"}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-emerald-400/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-foreground">Verified User</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-lg font-bold text-foreground">{selectedUser.name}</div>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded text-xs font-bold border border-emerald-400/40">
                    Verified
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">{selectedUser.email || "No email on file"}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 dark:border-neutral-700 p-3">
                  <div className="text-xs text-muted-foreground font-semibold mb-1">Updates</div>
                  <div className="text-sm font-bold text-foreground">{selectedUser.totalUpdates}</div>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-neutral-700 p-3">
                  <div className="text-xs text-muted-foreground font-semibold mb-1">Accuracy</div>
                  <div className="text-sm font-bold text-foreground">{selectedUser.accuracyRate}%</div>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-neutral-700 p-3">
                  <div className="text-xs text-muted-foreground font-semibold mb-1">Reports</div>
                  <div className="text-sm font-bold text-foreground">{selectedUser.reportsSubmitted}</div>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-neutral-700 p-3">
                  <div className="text-xs text-muted-foreground font-semibold mb-1">Contributor Type</div>
                  <div className="text-sm font-bold text-foreground">
                    {(selectedUser.karma || 0) > 200 ? "Trusted" : "Regular"}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-neutral-700 p-4 space-y-2">
                <div className="text-sm text-foreground">
                  <span className="font-semibold">Verified on:</span>{" "}
                  {selectedUser.verificationDate ? new Date(selectedUser.verificationDate).toLocaleString() : "N/A"}
                </div>
                <div className="text-sm text-foreground">
                  <span className="font-semibold">Account created:</span>{" "}
                  {selectedUser.accountCreated ? new Date(selectedUser.accountCreated).toLocaleString() : "N/A"}
                </div>
                <div className="text-sm text-foreground">
                  <span className="font-semibold">ID type:</span> {selectedUser.idType || "Unknown"}
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
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

