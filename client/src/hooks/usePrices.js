import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/apiClient";

export function usePrices(filters = {}) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== "")
  ).toString();
  return useQuery({
    queryKey: ["prices", filters],
    queryFn: () => api.get(`/prices${params ? `?${params}` : ""}`),
    staleTime: 30_000,
  });
}

export function usePriceHistory(filters = {}) {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== "")
  ).toString();
  return useQuery({
    queryKey: ["priceHistory", filters],
    queryFn: () => api.get(`/prices/history${params ? `?${params}` : ""}`),
    staleTime: 300_000,
  });
}

export function useReportPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/prices", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prices"] }),
  });
}

export function useReportPricesBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/prices/batch", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stations"] });
      qc.invalidateQueries({ queryKey: ["prices"] });
      qc.invalidateQueries({ queryKey: ["my-contributions"] });
    },
  });
}

export function useMyContributions() {
  return useQuery({
    queryKey: ["my-contributions"],
    queryFn: () => api.get("/me/contributions"),
  });
}

export function useUpdatePrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/prices/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prices"] }),
  });
}

export function useDeletePrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/prices/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prices"] }),
  });
}

export function useConfirmPrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/prices/${id}/confirm`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prices"] }),
  });
}
