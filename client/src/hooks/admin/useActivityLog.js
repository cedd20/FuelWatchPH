import { useQuery } from "@tanstack/react-query";

import { adminApi } from "@/services/adminApi";

export function useActivityLog(actionType) {
  return useQuery({
    queryKey: ["admin-activity-log", actionType || "all"],
    queryFn: () => adminApi.listActivityLog({ actionType }),
    staleTime: 15_000,
  });
}
