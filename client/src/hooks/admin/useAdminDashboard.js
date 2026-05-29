import { useQuery } from "@tanstack/react-query";

import { adminApi } from "@/services/adminApi";

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: adminApi.getDashboard,
    staleTime: 30_000,
  });
}
