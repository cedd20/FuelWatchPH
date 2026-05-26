import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminApi } from "@/services/adminApi";

export function useStationReports(status) {
  return useQuery({
    queryKey: ["admin-station-reports", status || "all"],
    queryFn: () => adminApi.listStationReports({ status }),
    staleTime: 15_000,
  });
}

export function useStationReport(reportId) {
  return useQuery({
    queryKey: ["admin-station-report", reportId],
    queryFn: () => adminApi.getStationReport(reportId),
    enabled: Boolean(reportId),
  });
}

export function useUpdateStationReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reportId, payload }) => adminApi.updateStationReport(reportId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-station-reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin-activity-log"] });
      queryClient.invalidateQueries({ queryKey: ["admin-station-report", variables.reportId] });
    },
  });
}
