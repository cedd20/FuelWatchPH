import { useQuery } from "@tanstack/react-query";

import { adminApi } from "@/services/adminApi";

export function useFuelReports() {
  return useQuery({
    queryKey: ["admin-fuel-reports"],
    queryFn: adminApi.listFuelReports,
    staleTime: 15_000,
  });
}
