import { useQuery } from "@tanstack/react-query";
import { api as apiClient } from "../lib/apiClient";

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => apiClient.get("/leaderboard"),
    staleTime: 300_000,
    gcTime: 10 * 60_000,
  });
}

export function useSummaryStats() {
  return useQuery({
    queryKey: ["summary-stats"],
    queryFn: () => apiClient.get("/stats/summary"),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}


