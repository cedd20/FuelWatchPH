import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api as apiClient } from "../lib/apiClient";

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => apiClient.get("/leaderboard"),
    staleTime: 0, // Force fresh data for ranking fixes
  });
}

export function useSummaryStats() {
  return useQuery({
    queryKey: ["summary-stats"],
    queryFn: () => apiClient.get("/stats/summary"),
    staleTime: 60_000,
  });
}

export function useNotifications(options = {}) {
  const { enabled = true, ...rest } = options;
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiClient.get("/notifications"),
    enabled,
    // Poll every 30 seconds so new notifications appear without a page reload
    refetchInterval: enabled ? 30_000 : false,
    // Refetch when the tab/window becomes active again
    refetchOnWindowFocus: true,
    staleTime: 15_000,
    ...rest,
  });
}

// Derived hook for the nav badge — only fetches when user is logged in
export function useUnreadCount(isAuthenticated) {
  const { data } = useNotifications({ enabled: Boolean(isAuthenticated) });
  return Array.isArray(data) ? data.filter((n) => !n.is_read).length : 0;
}
