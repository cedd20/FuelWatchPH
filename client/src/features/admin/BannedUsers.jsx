import { useState } from "react";
import { Search, Ban, CheckCircle, X, Eye } from "lucide-react";
import { TablePagination } from "@/shared/components/admin/TablePagination";

const mockBannedUsers = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@email.com",
    banReason: "spam",
    banReasonLabel: "Spam/Fraudulent Activity",
    banDate: "2024-05-01 10:30:00",
    bannedBy: "Admin",
    notes: "Repeatedly submitted false fuel prices to manipulate station rankings",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    banReason: "abuse",
    banReasonLabel: "Abusive Behavior",
    banDate: "2024-04-28 14:20:00",
    bannedBy: "Admin",
    notes: "Abusive comments and harassment of other users",
  },
  {
    id: "3",
    name: "Mike Wilson",
    email: "mike.wilson@email.com",
    banReason: "multiple_accounts",
    banReasonLabel: "Multiple Accounts",
    banDate: "2024-04-25 09:15:00",
    bannedBy: "Admin",
    notes: "Created multiple accounts to artificially boost station ratings",
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily.davis@email.com",
    banReason: "false_info",
    banReasonLabel: "False Information",
    banDate: "2024-04-20 16:45:00",
    bannedBy: "Admin",
    notes: "Consistently submitted incorrect verification documents",
  },
];

export function BannedUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [unbanModalData, setUnbanModalData] = useState(null);
  const [unbanNotes, setUnbanNotes] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleUnbanUser = () => {
    if (unbanModalData) {
      console.log("Unbanning user:", unbanModalData.userId, "Notes:", unbanNotes);
      setUnbanModalData(null);
      setUnbanNotes("");
    }
  };

  const filteredUsers = mockBannedUsers.filter((user) => {
    const matchesSearch =
      searchQuery === "" ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Pagination calculations
  const totalFiltered = filteredUsers.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const spamCount = mockBannedUsers.filter((u) => u.banReason === "spam").length;
  const abuseCount = mockBannedUsers.filter((u) => u.banReason === "abuse").length;
  const multipleAccountsCount = mockBannedUsers.filter((u) => u.banReason === "multiple_accounts").length;

  return (
    <>
      <div className="p-4 lg:p-8">
        <div className="max-w-[1600px] mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Banned Users</h1>
            <p className="text-sm lg:text-base text-muted-foreground">Manage banned users and review ban history</p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-4 border-2 border-rose-400/40 shadow-lg">
              <div className="text-xl lg:text-2xl font-bold text-foreground mb-1">{mockBannedUsers.length}</div>
              <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Total Banned</div>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-4 border-2 border-yellow-400/40 shadow-lg">
              <div className="text-xl lg:text-2xl font-bold text-foreground mb-1">{spamCount}</div>
              <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Spam</div>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-4 border-2 border-rose-400/40 shadow-lg">
              <div className="text-xl lg:text-2xl font-bold text-foreground mb-1">{abuseCount}</div>
              <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Abuse</div>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-3 lg:p-4 border-2 border-gray-400/40 shadow-lg">
              <div className="text-xl lg:text-2xl font-bold text-foreground mb-1">{multipleAccountsCount}</div>
              <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Multiple Accounts</div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 lg:p-5 border-2 border-gray-200 dark:border-neutral-700 shadow-lg mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search banned users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg text-foreground placeholder:text-muted-foreground focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all outline-none font-medium"
              />
            </div>
          </div>

          {/* Mobile Banned User Cards */}
          <div className="lg:hidden space-y-3 mb-5">
            {paginatedUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white dark:bg-neutral-900 rounded-lg border-2 border-rose-400/40 shadow-lg p-4 active:scale-[0.98] transition-transform"
              >
                {/* User Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-100 to-red-100 dark:from-rose-950/50 dark:to-red-950/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Ban className="w-5 h-5 text-rose-600 dark:text-rose-400" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <div className="font-bold text-foreground">{user.name}</div>
                      <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded text-xs font-bold border border-rose-400/40">
                        Banned
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  </div>
                </div>

                {/* Notes */}
                {user.notes && (
                  <div className="mb-3 p-2.5 bg-gray-50 dark:bg-neutral-800 rounded-lg">
                    <div className="text-xs text-muted-foreground italic">{user.notes}</div>
                  </div>
                )}

                {/* Ban Reason */}
                <div className="mb-3">
                  <span className="px-3 py-1 bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-full text-xs font-bold">
                    {user.banReasonLabel}
                  </span>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-gray-200 dark:border-neutral-700">
                  <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-2.5">
                    <div className="text-xs text-muted-foreground font-semibold mb-1">Ban Date</div>
                    <div className="text-xs font-bold text-foreground">
                      {new Date(user.banDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(user.banDate).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-2.5">
                    <div className="text-xs text-muted-foreground font-semibold mb-1">Banned By</div>
                    <div className="text-sm font-bold text-foreground">{user.bannedBy}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button className="px-4 py-2 bg-gray-100 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg font-bold text-xs text-foreground active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    View Details
                  </button>
                  <button
                    onClick={() => setUnbanModalData({ userId: user.id, userName: user.name, userEmail: user.email })}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-bold text-xs shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Unban
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
                <Ban className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">No banned users found</h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery ? "Try adjusting your search" : "No users are currently banned"}
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
                    <th className="text-left p-4 text-sm font-bold text-foreground">Ban Reason</th>
                    <th className="text-left p-4 text-sm font-bold text-foreground">Ban Date</th>
                    <th className="text-left p-4 text-sm font-bold text-foreground">Banned By</th>
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
                          <div className="w-10 h-10 bg-gradient-to-br from-rose-100 to-red-100 dark:from-rose-950/50 dark:to-red-950/50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Ban className="w-5 h-5 text-rose-600 dark:text-rose-400" strokeWidth={2.5} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-bold text-foreground">{user.name}</div>
                              <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded text-xs font-bold border border-rose-400/40">
                                Banned
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">{user.email}</div>
                            {user.notes && (
                              <div className="text-xs text-muted-foreground italic max-w-md">{user.notes}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-full text-xs font-bold">
                          {user.banReasonLabel}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-foreground font-semibold">
                          {new Date(user.banDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(user.banDate).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground font-semibold">{user.bannedBy}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="px-3 py-1.5 bg-gray-100 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg font-bold text-xs text-foreground hover:border-emerald-500 transition-all flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            View Details
                          </button>
                          <button
                            onClick={() => setUnbanModalData({ userId: user.id, userName: user.name, userEmail: user.email })}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-bold text-xs shadow-lg hover:shadow-xl transition-all flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Unban
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
                  <Ban className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">No banned users found</h3>
                <p className="text-muted-foreground text-sm">
                  {searchQuery ? "Try adjusting your search" : "No users are currently banned"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unban User Modal */}
      {unbanModalData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-emerald-400/30 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-foreground">Unban User</h3>
              <button
                onClick={() => {
                  setUnbanModalData(null);
                  setUnbanNotes("");
                }}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <p className="text-muted-foreground mb-5">
              Are you sure you want to unban{" "}
              <span className="font-bold text-foreground">{unbanModalData.userName}</span>? They will be able to access
              their account again.
            </p>

            <div className="mb-5 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
              <p className="text-sm font-semibold text-foreground mb-1">{unbanModalData.userName}</p>
              <p className="text-xs text-muted-foreground">{unbanModalData.userEmail}</p>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-bold text-foreground mb-2">Notes (Optional)</label>
              <textarea
                value={unbanNotes}
                onChange={(e) => setUnbanNotes(e.target.value)}
                placeholder="Add any notes about this unban..."
                className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setUnbanModalData(null);
                  setUnbanNotes("");
                }}
                className="flex-1 px-5 py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl font-bold text-foreground hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUnbanUser}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Unban User
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
