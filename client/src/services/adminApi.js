import { api } from "@/lib/apiClient";

function withQuery(path, params = {}) {
  const search = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "" && value !== "all"),
  ).toString();

  return search ? `${path}?${search}` : path;
}

export const adminApi = {
  getDashboard: () => api.get("/admin/dashboard"),

  listVerificationRequests: ({ status } = {}) =>
    api.get(withQuery("/admin/verifications", { status })),
  getVerificationRequest: (requestId) => api.get(`/admin/verifications/${requestId}`),
  approveVerificationRequest: (requestId, admin_notes) =>
    api.post(`/admin/verifications/${requestId}/approve`, { admin_notes }),
  rejectVerificationRequest: (requestId, admin_notes) =>
    api.post(`/admin/verifications/${requestId}/reject`, { admin_notes }),
  requestVerificationCorrection: (requestId, admin_notes) =>
    api.post(`/admin/verifications/${requestId}/correction`, { admin_notes }),
  updateVerificationRequestNotes: (requestId, admin_notes) =>
    api.patch(`/admin/verifications/${requestId}`, { admin_notes }),

  listFuelReports: () => api.get("/admin/fuel-reports"),

  listStationReports: ({ status } = {}) =>
    api.get(withQuery("/admin/station-reports", { status })),
  getStationReport: (reportId) => api.get(`/admin/station-reports/${reportId}`),
  updateStationReport: (reportId, payload) =>
    api.post(`/admin/station-reports/${reportId}/update`, payload),

  listUsers: () => api.get("/admin/users"),
  listBannedUsers: () => api.get("/admin/banned-users"),
  banUser: (userId, payload) => api.post(`/admin/users/${userId}/ban`, payload),
  unbanUser: (banId, payload) => api.post(`/admin/bans/${banId}/unban`, payload),

  listActivityLog: ({ actionType } = {}) =>
    api.get(withQuery("/admin/activity-log", { action_type: actionType })),
};
