import { FUEL_TYPES, canonicalizeFuelType } from "./fuelTypes";

export const DEFAULT_MAP_FILTERS = {
  location: "nearby",
  selectedCity: "",
  radius: "20",
  fuelTypes: [],
  brands: [],
  priceSort: "lowest",
  verifiedOnly: false,
  recentlyUpdated: "7",
  openNow: false,
  is24_7: false,
};

const VALID_FUEL_TYPES = new Set(FUEL_TYPES);

export function normalizeFuelTypeSelection(fuelTypes = []) {
  const normalized = [
    ...new Set(
      (fuelTypes || []).map((fuel) => canonicalizeFuelType(fuel)).filter((fuel) => VALID_FUEL_TYPES.has(fuel))
    ),
  ];

  if (normalized.length === FUEL_TYPES.length) {
    return [];
  }

  return normalized;
}

export function normalizeMapFilters(filters = {}) {
  const merged = {
    ...DEFAULT_MAP_FILTERS,
    ...(filters || {}),
  };

  return {
    ...merged,
    fuelTypes: normalizeFuelTypeSelection(merged.fuelTypes),
    brands: Array.isArray(merged.brands) ? merged.brands : [],
  };
}

export function isDefaultMapFilters(filters = {}) {
  const normalized = normalizeMapFilters(filters);
  const normalizedDefaults = normalizeMapFilters(DEFAULT_MAP_FILTERS);

  return JSON.stringify(normalized) === JSON.stringify(normalizedDefaults);
}

export function getFuelSelectionSummary(fuelTypes = []) {
  const normalized = normalizeFuelTypeSelection(fuelTypes);

  if (normalized.length === 0) {
    return {
      mode: "all",
      count: 0,
      selectedFuelType: "All",
      indicatorLabel: null,
    };
  }

  if (normalized.length === 1) {
    return {
      mode: "single",
      count: 1,
      selectedFuelType: normalized[0],
      indicatorLabel: null,
    };
  }

  return {
    mode: "multiple",
    count: normalized.length,
    selectedFuelType: "All",
    indicatorLabel: `${normalized.length} fuel types active`,
  };
}
