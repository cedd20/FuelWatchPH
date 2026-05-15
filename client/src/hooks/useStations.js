import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/apiClient";
import { toDBFuelType, toAliasFuelType } from "../shared/utils/fuelTypes";

export function useStations(filters = {}) {
  const mappedFilters = { ...filters };
  if (mappedFilters.fuel_type) {
    mappedFilters.fuel_type = toDBFuelType(mappedFilters.fuel_type);
  }

  const params = new URLSearchParams(
    Object.entries(mappedFilters).filter(([, v]) => v !== undefined && v !== "")
  ).toString();

  return useQuery({
    queryKey: ["stations", filters],
    queryFn: async () => {
      const data = await api.get(`/stations${params ? `?${params}` : ""}`);
      return data.map(station => {
        if (station.latest_prices) {
          const mappedPrices = {};
          for (const [key, val] of Object.entries(station.latest_prices)) {
            mappedPrices[toAliasFuelType(key)] = val;
          }
          station.latest_prices = mappedPrices;
        }
        return station;
      });
    },
    staleTime: 60_000,
  });
}

export function useStation(id) {
  return useQuery({
    queryKey: ["stations", id],
    queryFn: async () => {
      const stations = await api.get(`/stations`);
      const station = stations.find(s => s.id === id);
      if (station && station.latest_prices) {
        const mappedPrices = {};
        for (const [key, val] of Object.entries(station.latest_prices)) {
          mappedPrices[toAliasFuelType(key)] = val;
        }
        station.latest_prices = mappedPrices;
      }
      return station;
    },
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
