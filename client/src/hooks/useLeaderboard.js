import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/apiClient";

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => api.get("/leaderboard"),
    staleTime: 300_000,
  });
}
