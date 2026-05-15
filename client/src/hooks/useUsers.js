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


