import { X } from "lucide-react";
import { useState } from "react";
import { FUEL_TYPES } from "@/shared/utils/fuelTypes";

const brands = [
  "Shell",
  "Petron",
  "Caltex",
  "Seaoil",
  "Cleanfuel",
  "Unioil",
  "Phoenix",
  "TotalEnergies",
  "Jetti",
  "RePhil",
  "Flying V",
];

const fuelTypes = FUEL_TYPES;

export function MapFilterSheet({ isOpen, onClose, onApply, availableCities = [] }) {
  const [filters, setFilters] = useState({
    location: "nearby",
    selectedCity: "",
    radius: "3",
    fuelTypes: [],
    brands: [],
    priceSort: "lowest",
    verifiedOnly: false,
    recentlyUpdated: "7",
    openNow: false,
    is24_7: false,
  });

  const toggleFuelType = (fuel) => {
    setFilters((prev) => ({
      ...prev,
      fuelTypes: prev.fuelTypes.includes(fuel)
        ? prev.fuelTypes.filter((f) => f !== fuel)
        : [...prev.fuelTypes, fuel],
    }));
  };

  const toggleBrand = (brand) => {
    setFilters((prev) => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter((b) => b !== brand)
        : [...prev.brands, brand],
    }));
  };

  const handleReset = () => {
    setFilters({
      location: "nearby",
      selectedCity: "",
      radius: "5",
      fuelTypes: [],
      brands: [],
      priceSort: "lowest",
      verifiedOnly: false,
      recentlyUpdated: "7",
      openNow: false,
      is24_7: false,
    });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card w-full max-w-lg max-h-[90vh] lg:max-h-[85vh] rounded-t-2xl lg:rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b-2 border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          <h2 className="text-lg lg:text-xl font-bold text-foreground tracking-tight">Filter Stations</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center hover:bg-muted transition-all"
          >
            <X className="w-5 h-5 lg:w-6 lg:h-6 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 bg-white dark:bg-neutral-900">
          {/* Location Filter */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Location</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={filters.location === "nearby"}
                  onChange={() => setFilters({ ...filters, location: "nearby" })}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-foreground">Near me</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={filters.location === "city"}
                  onChange={() => setFilters({ ...filters, location: "city" })}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-foreground">Browse by city</span>
              </label>
              {filters.location === "city" && (
                <select
                  value={filters.selectedCity}
                  onChange={(e) =>
                    setFilters({ ...filters, selectedCity: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                >
                  <option value="">Select city</option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="mt-3">
              <label className="block mb-2 text-sm text-muted-foreground">
                Search radius
              </label>
              <select
                value={filters.radius}
                onChange={(e) => setFilters({ ...filters, radius: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              >
                <option value="1">1 km</option>
                <option value="3">3 km</option>
                <option value="5">5 km</option>
                <option value="10">10 km</option>
              </select>
            </div>
          </div>

          {/* Fuel Type Filter */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Fuel Type</h3>
            <div className="flex flex-wrap gap-2">
              {fuelTypes.map((fuel) => (
                <button
                  key={fuel}
                  onClick={() => toggleFuelType(fuel)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filters.fuelTypes.includes(fuel)
                      ? "bg-primary text-white"
                      : "bg-gray-100 dark:bg-neutral-800 text-foreground hover:bg-gray-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  {fuel}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Brand / Company</h3>
            <div className="flex flex-wrap gap-2">
              {brands.map((brand) => (
                <button
                  key={brand}
                  onClick={() => toggleBrand(brand)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filters.brands.includes(brand)
                      ? "bg-primary text-white"
                      : "bg-gray-100 dark:bg-neutral-800 text-foreground hover:bg-gray-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          {/* Price Filter */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Price</h3>
            <select
              value={filters.priceSort}
              onChange={(e) => setFilters({ ...filters, priceSort: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            >
              <option value="lowest">Lowest price first</option>
              <option value="highest">Highest price first</option>
              <option value="nearby">Cheapest nearby</option>
            </select>
          </div>

          {/* Data Reliability */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Data Reliability</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-foreground">Verified prices only</span>
                <input
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={(e) =>
                    setFilters({ ...filters, verifiedOnly: e.target.checked })
                  }
                  className="w-4 h-4 text-primary rounded"
                />
              </label>
              <div>
                <label className="block mb-2 text-sm text-muted-foreground">
                  Updated within
                </label>
                <select
                  value={filters.recentlyUpdated}
                  onChange={(e) =>
                    setFilters({ ...filters, recentlyUpdated: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                >
                  <option value="today">Today</option>
                  <option value="1">Last 24 hours</option>
                  <option value="3">Last 3 days</option>
                  <option value="7">Last 7 days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Station Status */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Station Status</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-foreground">Open now</span>
                <input
                  type="checkbox"
                  checked={filters.openNow}
                  onChange={(e) =>
                    setFilters({ ...filters, openNow: e.target.checked })
                  }
                  className="w-4 h-4 text-primary rounded"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-foreground">24/7 stations only</span>
                <input
                  type="checkbox"
                  checked={filters.is24_7}
                  onChange={(e) =>
                    setFilters({ ...filters, is24_7: e.target.checked })
                  }
                  className="w-4 h-4 text-primary rounded"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 lg:p-6 pb-28 lg:pb-6 border-t-2 border-gray-200 dark:border-neutral-700 flex gap-3 lg:gap-4 bg-white dark:bg-neutral-900">
          <button
            onClick={handleReset}
            className="flex-1 py-3.5 lg:py-4 rounded-xl lg:rounded-2xl border-2 border-gray-200 dark:border-neutral-700 text-foreground font-bold bg-white dark:bg-neutral-900 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
          >
            Reset Filter
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3.5 lg:py-4 rounded-xl lg:rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white font-bold shadow-2xl shadow-emerald-500/50 hover:shadow-emerald-500/70 hover:scale-[1.02] transition-all border-2 border-emerald-400/30"
          >
            Apply Filter
          </button>
        </div>
      </div>
    </div>
  );
}
