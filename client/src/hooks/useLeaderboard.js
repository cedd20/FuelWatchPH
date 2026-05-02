import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/apiClient";

export function useLeaderboard() {
  return useQuery({
    queryKey: ["contributors"],
    queryFn: () => api.get("/contributors"),
    staleTime: 300_000,
  });
}
