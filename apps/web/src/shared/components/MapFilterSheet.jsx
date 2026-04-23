import { X } from "lucide-react";
import { useState } from "react";
import { FUEL_TYPES } from "@/shared/utils/fuelTypes";

const cities = [
  "Quezon City",
  "Manila",
  "Makati",
  "Pasig",
  "Taguig",
  "Caloocan",
  "Cebu City",
  "Davao City",
];

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

export function MapFilterSheet({ isOpen, onClose, onApply }) {
  const [filters, setFilters] = useState({
    location: "nearby",
    selectedCity: "",
    radius: "5",
    fuelTypes: [...fuelTypes],
    brands: [...brands],
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
      fuelTypes: [...fuelTypes],
      brands: [...brands],
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
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-lg max-h-[90vh] lg:max-h-[85vh] rounded-t-3xl lg:rounded-3xl overflow-hidden flex flex-col shadow-2xl border-t lg:border border-gray-200 dark:border-neutral-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-neutral-800">
          <h2 className="text-xl font-bold text-foreground">Filter Stations</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-neutral-800">
            <X className="w-6 h-6 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Location */}
          <div>
            <h3 className="font-bold text-foreground mb-4">Location</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setFilters({ ...filters, location: "nearby" })}
                className={`py-3 rounded-2xl border-2 font-bold transition-all ${filters.location === "nearby" ? "border-emerald-500 bg-emerald-50 text-emerald-600" : "border-gray-100 dark:border-neutral-800"}`}
              >
                Near Me
              </button>
              <button
                onClick={() => setFilters({ ...filters, location: "city" })}
                className={`py-3 rounded-2xl border-2 font-bold transition-all ${filters.location === "city" ? "border-emerald-500 bg-emerald-50 text-emerald-600" : "border-gray-100 dark:border-neutral-800"}`}
              >
                By City
              </button>
            </div>
            {filters.location === "city" && (
              <select
                value={filters.selectedCity}
                onChange={(e) => setFilters({ ...filters, selectedCity: e.target.value })}
                className="w-full p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl border-none font-bold text-foreground mb-4"
              >
                <option value="">Select City</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">RADIUS ({filters.radius}km)</label>
              <input
                type="range"
                min="1"
                max="20"
                value={filters.radius}
                onChange={(e) => setFilters({ ...filters, radius: e.target.value })}
                className="w-full h-2 bg-gray-100 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>
          </div>

          {/* Fuel Types */}
          <div>
            <h3 className="font-bold text-foreground mb-4">Fuel Types</h3>
            <div className="flex flex-wrap gap-2">
              {fuelTypes.map((fuel) => (
                <button
                  key={fuel}
                  onClick={() => toggleFuelType(fuel)}
                  className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${
                    filters.fuelTypes.includes(fuel)
                      ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                      : "border-gray-100 dark:border-neutral-800 text-muted-foreground"
                  }`}
                >
                  {fuel}
                </button>
              ))}
            </div>
          </div>

          {/* Brands */}
          <div>
            <h3 className="font-bold text-foreground mb-4">Brands</h3>
            <div className="grid grid-cols-3 gap-2">
              {brands.map((brand) => (
                <button
                  key={brand}
                  onClick={() => toggleBrand(brand)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                    filters.brands.includes(brand)
                      ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                      : "border-gray-100 dark:border-neutral-800 text-muted-foreground"
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/50 flex gap-4">
          <button onClick={handleReset} className="flex-1 py-4 rounded-2xl font-bold text-muted-foreground hover:text-foreground transition-all">
            Reset
          </button>
          <button onClick={handleApply} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-500/30 hover:scale-[1.02] transition-all">
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
