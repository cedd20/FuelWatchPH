import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminApi } from "@/services/adminApi";

function normalizeText(value) {
  return String(value || "").toLowerCase().trim();
}

function getKeyVariants(record) {
  return [record?.id, record?.userId, record?.email]
    .map((value) => normalizeText(value))
    .filter(Boolean);
}

function mergeUsers(baseUsers, bannedUsers) {
  const bannedLookup = new Map();
  bannedUsers.forEach((record) => {
    getKeyVariants(record).forEach((key) => {
      bannedLookup.set(key, record);
    });
  });

  const mergedUsers = baseUsers.map((user) => {
    const matchedBanRecord = getKeyVariants(user)
      .map((key) => bannedLookup.get(key))
      .find(Boolean);

    return {
      ...user,
      id: user.id ?? user.userId ?? matchedBanRecord?.userId ?? matchedBanRecord?.id,
      userId: user.userId ?? user.id ?? matchedBanRecord?.userId,
      name: user.name || matchedBanRecord?.name || "Unknown",
      email: user.email || matchedBanRecord?.email || "",
      banRecordId: matchedBanRecord?.id || null,
      accountStatus:
        matchedBanRecord?.accountStatus || matchedBanRecord?.status || user.accountStatus || "active",
      banReason: matchedBanRecord?.banReason || user.banReason || null,
      banReasonLabel: matchedBanRecord?.banReasonLabel || user.banReasonLabel || null,
      bannedBy: matchedBanRecord?.bannedBy || user.bannedBy || null,
      banDate: matchedBanRecord?.banDate || user.banDate || null,
      adminNotes: matchedBanRecord?.notes || user.adminNotes || null,
      notes: matchedBanRecord?.notes || user.notes || null,
    };
  });

  const existingKeys = new Set(mergedUsers.flatMap((user) => getKeyVariants(user)));

  bannedUsers.forEach((record) => {
    const hasMatch = getKeyVariants(record).some((key) => existingKeys.has(key));
    if (hasMatch) return;

    mergedUsers.push({
      ...record,
      id: record.userId ?? `banned-${record.id}`,
      userId: record.userId ?? null,
      banRecordId: record.id,
      accountStatus: record.accountStatus || record.status || "banned",
      verificationStatus: record.verificationStatus || "unverified",
      joinDate: record.joinDate || record.accountCreated || null,
      totalUpdates: record.totalUpdates ?? 0,
      accuracyRate: record.accuracyRate ?? 0,
      karma: record.karma ?? 0,
      savedStationsCount: record.savedStationsCount ?? 0,
      recentActivity: record.recentActivity || null,
      adminNotes: record.notes || record.adminNotes || null,
    });
  });

  return mergedUsers;
}

export function useUserManagement() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [usersResult, bannedUsersResult] = await Promise.allSettled([
        adminApi.listUsers(),
        adminApi.listBannedUsers(),
      ]);

      if (usersResult.status !== "fulfilled") {
        throw usersResult.reason;
      }

      const baseUsers = Array.isArray(usersResult.value) ? usersResult.value : [];
      const bannedUsers =
        bannedUsersResult.status === "fulfilled" && Array.isArray(bannedUsersResult.value)
          ? bannedUsersResult.value
          : [];

      return mergeUsers(baseUsers, bannedUsers);
    },
    staleTime: 15_000,
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }) => adminApi.banUser(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin-activity-log"] });
    },
  });
}

export function useUnbanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ banId, payload }) => adminApi.unbanUser(banId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin-activity-log"] });
    },
  });
}
