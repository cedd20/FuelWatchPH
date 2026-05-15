import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/apiClient";
import { toDBFuelType, toAliasFuelType } from "../shared/utils/fuelTypes";

export function usePrices(filters = {}) {
  const mappedFilters = { ...filters };
  if (mappedFilters.fuel_type) {
    mappedFilters.fuel_type = toDBFuelType(mappedFilters.fuel_type);
  }

  const params = new URLSearchParams(
    Object.entries(mappedFilters).filter(([, v]) => v !== undefined && v !== "")
  ).toString();

  return useQuery({
    queryKey: ["prices", filters],
    queryFn: async () => {
      const data = await api.get(`/prices${params ? `?${params}` : ""}`);
      return data.map(p => ({ ...p, fuel_type: toAliasFuelType(p.fuel_type) }));
    },
    staleTime: 30_000,
  });
}

export function usePriceHistory(filters = {}) {
  const mappedFilters = { ...filters };
  if (mappedFilters.fuel_type) {
    mappedFilters.fuel_type = toDBFuelType(mappedFilters.fuel_type);
  }

  const params = new URLSearchParams(
    Object.entries(mappedFilters).filter(([, v]) => v !== undefined && v !== "")
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
    mutationFn: (data) => {
      const mapped = { ...data, fuel_type: toDBFuelType(data.fuel_type) };
      return api.post("/prices", mapped);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prices"] }),
  });
}

export function useReportPricesBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => {
      const mapped = data.map(p => ({ ...p, fuel_type: toDBFuelType(p.fuel_type) }));
      return api.post("/prices/batch", mapped);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stations"] });
      qc.invalidateQueries({ queryKey: ["prices"] });
      qc.invalidateQueries({ queryKey: ["my-contributions"] });
    },
  });
}

export function useMyContributions(options = {}) {
  const { enabled = true, ...rest } = options;
  return useQuery({
    queryKey: ["my-contributions"],
    queryFn: async () => {
      const data = await api.get("/me/contributions");
      return data.map(c => ({ ...c, fuel_type: toAliasFuelType(c.fuel_type) }));
    },
    enabled,
    ...rest,
  });
}

export function useUpdatePrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => {
      const mapped = { ...data };
      if (mapped.fuel_type) mapped.fuel_type = toDBFuelType(mapped.fuel_type);
      return api.put(`/prices/${id}`, mapped);
    },
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prices"] });
      qc.invalidateQueries({ queryKey: ["my-contributions"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["stations"] });
    },
  });
}
