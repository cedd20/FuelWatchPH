import { useQuery } from "@tanstack/react-query";
import { api as apiClient } from "../lib/apiClient";

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => apiClient.get("/leaderboard"),
  });
}

export function useSummaryStats() {
  return useQuery({
    queryKey: ["summary-stats"],
    queryFn: () => apiClient.get("/stats/summary"),
  });
}

export function useNotifications(options = {}) {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiClient.get("/notifications"),
    ...options,
  });
}

