import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/apiClient";

export function useStations(filters = {}) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== "")
  ).toString();
  return useQuery({
    queryKey: ["stations", filters],
    queryFn: () => api.get(`/stations${params ? `?${params}` : ""}`),
    staleTime: 60_000,
  });
}

export function useStation(id) {
  return useQuery({
    queryKey: ["stations", id],
    queryFn: () => api.get(`/stations`).then(stations => stations.find(s => s.id === id)),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useCreateStation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/stations", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stations"] }),
  });
}

export function useUpdateStation(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.put(`/stations/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stations"] }),
  });
}

export function useDeleteStation(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/stations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stations"] }),
  });
}
