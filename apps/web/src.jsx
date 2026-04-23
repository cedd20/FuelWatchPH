import { useState } from "react";
import { useNavigate } from "react-router";
import { MapPin, Navigation, Filter, List, Search } from "lucide-react";
import { StationCard } from "@/shared/components/StationCard";
import { FuelTypeChip } from "@/shared/components/FuelTypeChip";
import { MapFilterSheet } from "@/shared/components/MapFilterSheet";
import { FilterChip } from "@/shared/components/FilterChip";
import { BrandLogoPin } from "@/shared/components/BrandLogoPin";
import { MapPriceLegend } from "@/shared/components/MapPriceLegend";
import { PreciseLocationButton } from "@/shared/components/PreciseLocationButton";
import { FUEL_TYPES } from "@/shared/utils/fuelTypes";

const mockStations = [
  {
    id: "1",
    name: "Petron Quezon Avenue",
    brand: "Petron",
    address: "123 Quezon Ave, Quezon City",
    distance: 0.5,
    prices: [
      { type: "Unleaded 91", price: 64.50 },
      { type: "Premium 95", price: 68.20 },
      { type: "Diesel", price: 55.30 },
    ],
    lastUpdated: "2 mins ago",
    verified,
    lat: 14.6347,
    lng: 121.0440,
  },
  {
    id: "2",
    name: "Shell EDSA",
    brand: "Shell",
    address: "456 EDSA, Mandaluyong",
    distance: 1.2,
    prices: [
      { type: "Unleaded 91", price: 65.10 },
      { type: "Premium 95", price: 69.00 },
      { type: "Diesel", price: 56.10 },
    ],
    lastUpdated: "15 mins ago",
    verified,
    lat: 14.6370,
    lng: 121.0500,
  },
  {
    id: "3",
    name: "Caltex Commonwealth",
    brand: "Caltex",
    address: "789 Commonwealth Ave, QC",
    distance: 2.1,
    prices: [
      { type: "Unleaded 91", price: 64.80 },
      { type: "Premium 95", price: 68.50 },
      { type: "Diesel", price: 55.80 },
    ],
    lastUpdated: "1 hour ago",
    verified,
    lat: 14.6390,
    lng: 121.0520,
  },
  {
    id: "4",
    name: "Seaoil Timog",
    brand: "Seaoil",
    address: "45 Timog Ave, QC",
    distance: 1.5,
    prices: [
      { type: "Unleaded 91", price: 64.20 },
      { type: "Premium 95", price: 67.90 },
      { type: "Diesel", price: 55.00 },
    ],
    lastUpdated: "30 mins ago",
    verified,
    lat: 14.6360,
    lng: 121.0480,
  },
];

const fuelTypes = ["All", ...FUEL_TYPES];

export function Map() {
  const navigate = useNavigate();
  const [selectedFuelType, setSelectedFuelType] = useState("Diesel");
  const [showList, setShowList] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const handleApplyFilters = (filters) => {
    const applied = [];
    if (filters.location === "city" && filters.selectedCity) {
      applied.push(filters.selectedCity);
    }
    if (filters.fuelTypes.length > 0) {
      applied.push(`${filters.fuelTypes.length} fuel types`);
    }
    if (filters.brands.length > 0) {
      applied.push(`${filters.brands.length} brands`);
    }
    if (filters.verifiedOnly) {
      applied.push("Verified only");
    }
    if (filters.openNow) {
      applied.push("Open now");
    }
    setActiveFilters(applied);
  };

  const removeFilter = (filter) => {
    setActiveFilters(activeFilters.filter((f) => f !== filter));
  };

  const handlePreciseLocation = () => {
    // In a real app, this would recenter the map to user's GPS coordinates
    console.log("Recentering to precise location...");
  };

  // Calculate average price for the selected fuel type
  const getStationPrice = (station) => {
    const fuelPrice = station.prices.find((p) => p.type === selectedFuelType);
    return fuelPrice?.price || 0;
  };

  const avgPrice = mockStations.reduce((sum, station) => sum + getStationPrice(station), 0) / mockStations.length;

  return (
    <div className="h-screen flex flex-col lg:flex-row">
      {/* Desktop Side Panel - Station List */}
      {showList && (
        <div className="hidden lg:flex lg:flex-col lg:w-[420px] bg-white dark:bg-neutral-900 border-r-2 border-gray-200 dark:border-neutral-700 shadow-xl">
          <div className="p-6 border-b-2 border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-foreground tracking-tight">
                Nearby Stations
              </h3>
              <button
                onClick={() => setShowList(false)}
                className="w-10 h-10 bg-muted hover:bg-muted/80 rounded-full flex items-center justify-center transition-all"
              >
                <List className="w-5 h-5 text-foreground" strokeWidth={2.5} />
              </button>
            </div>
            <div className="text-sm text-muted-foreground font-medium">
              {mockStations.length} stations found
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {mockStations.map((station) => (
              <div
                key={station.id}
                onClick={() => {
                  setSelectedStation(station.id);
                }}
                className={`cursor-pointer transition-all ${
                  selectedStation === station.id ? "ring-2 ring-emerald-500 rounded-2xl" : ""
                }`}
              >
                <StationCard {...station} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Map View */}
      <div className="flex-1 relative bg-muted overflow-hidden">
        {/* Mock Map Background */}
        <div className="absolute inset-0 lg:top-0">
  <img
    src="/IMG_2489.jpg"
    alt="Map"
    className="w-full h-full object-cover"
  />

  {/* Optional dark overlay for better UI contrast */}
  <div className="absolute inset-0 bg-black/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="w-16 h-16 text-primary/20" />
          </div>

          {/* Station Brand Logo Pins */}
          {mockStations.map((station, index) => (
            <div
              key={station.id}
              className="absolute transform -translate-x-1/2 -translate-y-full"
              style={{
                left: `${40 + index * 15}%`,
                top: `${35 + index * 10}%`,
              }}
            >
              <BrandLogoPin
                brandName={station.brand}
                price={getStationPrice(station)}
                avgPrice={avgPrice}
                isSelected={selectedStation === station.id}
                onClick={() => setSelectedStation(station.id)}
                showPrice={true}
              />
            </div>
          ))}
        </div>

        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 p-4 lg:p-0 space-y-3 lg:space-y-0 bg-gradient-to-b from-black/30 via-black/10 to-transparent">
          {/* Desktop Glass Panel with Gradient Overlay */}
          <div className="lg:relative lg:bg-white/[0.85] dark:lg:bg-neutral-900/[0.85] lg:backdrop-blur-2xl lg:border-b lg:border-white/30 dark:lg:border-neutral-700/30 lg:p-6 lg:shadow-xl">
            {/* Subtle downward gradient overlay */}
            <div className="hidden lg:block absolute left-0 right-0 top-full h-24 bg-gradient-to-b from-white/25 via-white/8 to-transparent dark:from-neutral-900/25 dark:via-neutral-900/8 pointer-events-none"></div>
          <div className="lg:max-w-6xl lg:mx-auto">
            {/* Search Bar and Controls */}
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stations or locations"
                  className="w-full pl-12 pr-5 py-3.5 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full border-2 border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-2xl shadow-black/20 lg:shadow-lg transition-all placeholder:text-gray-500 text-foreground font-medium"
                />
              </div>

              {/* Desktop Filter and List Buttons */}
              <div className="hidden lg:flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(true)}
                  className="px-6 py-3.5 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full shadow-lg border-2 border-gray-200 dark:border-neutral-700 hover:scale-105 transition-all flex items-center gap-2 relative"
                >
                  <Filter className="w-5 h-5 text-gray-700 dark:text-gray-200" strokeWidth={2.5} />
                  <span className="font-bold text-foreground text-sm">Filter</span>
                  {activeFilters.length > 0 && (
                    <div className="w-6 h-6 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-xs text-white font-bold">{activeFilters.length}</span>
                    </div>
                  )}
                </button>
                <button
                  onClick={() => setShowList(!showList)}
                  className={`px-6 py-3.5 backdrop-blur-xl rounded-full shadow-lg border-2 hover:scale-105 transition-all flex items-center gap-2 ${
                    showList
                      ? "bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 border-emerald-400/40 text-white"
                      : "bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700 text-foreground"
                  }`}
                >
                  <List className="w-5 h-5" strokeWidth={2.5} />
                  <span className="font-bold text-sm">List</span>
                </button>
              </div>
            </div>

            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide mt-3">
                {activeFilters.map((filter, index) => (
                  <FilterChip key={index} label={filter} onRemove={() => removeFilter(filter)} />
                ))}
              </div>
            )}

            {/* Fuel Type Filters */}
            <div className="flex gap-2.5 overflow-x-auto lg:overflow-x-visible scrollbar-hide pb-1 mt-3 lg:flex-wrap">
              {fuelTypes.map((type) => (
                <FuelTypeChip
                  key={type}
                  label={type}
                  active={selectedFuelType === type}
                  onClick={() => setSelectedFuelType(type)}
                />
              ))}
            </div>
          </div>
          </div>
        </div>

        {/* Navigation Button - Always Visible */}
        <div className="absolute right-4 lg:right-6 top-35 lg:top-44">
          <button className="w-14 h-14 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full shadow-2xl shadow-black/20 flex items-center justify-center border-2 border-gray-200 dark:border-neutral-700 hover:scale-110 transition-transform">
            <Navigation className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
          </button>
        </div>

        {/* Mobile Filter and List Controls */}
        <div className="lg:hidden absolute right-4 top-[200px] space-y-3">
          <button
            onClick={() => setShowFilters(true)}
            className="w-14 h-14 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full shadow-2xl shadow-black/20 flex items-center justify-center relative border-2 border-gray-200 dark:border-neutral-700 hover:scale-110 transition-transform"
          >
            <Filter className="w-6 h-6 text-gray-700 dark:text-gray-200" strokeWidth={2.5} />
            {activeFilters.length > 0 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50 border-2 border-white">
                <span className="text-xs text-white font-bold">{activeFilters.length}</span>
              </div>
            )}
          </button>
          <button
            onClick={() => setShowList(!showList)}
            className="w-14 h-14 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 rounded-full shadow-2xl shadow-emerald-500/50 flex items-center justify-center hover:scale-110 transition-transform border-2 border-emerald-400/40"
          >
            <List className="w-6 h-6 text-white" strokeWidth={2.5} />
          </button>
        </div>

        {/* Price Legend */}
        <div className="absolute left-4 bottom-24 lg:bottom-6">
          <MapPriceLegend />
        </div>

        {/* Desktop Selected Station Panel */}
        {selectedStation && !showList && (
          <div className="hidden lg:block absolute bottom-6 right-6 w-[420px] bg-white/98 dark:bg-neutral-900/98 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border-2 border-gray-200 dark:border-neutral-700">
            <button
              onClick={() => setSelectedStation(null)}
              className="absolute top-5 right-5 w-9 h-9 bg-muted hover:bg-muted/80 rounded-full flex items-center justify-center transition-all shadow-md z-10"
            >
              <span className="text-foreground text-xl leading-none">×</span>
            </button>
            {mockStations
              .filter((s) => s.id === selectedStation)
              .map((station) => (
                <StationCard key={station.id} {...station} />
              ))}
          </div>
        )}

        {/* Bottom Sheet - Selected Station (Mobile Only) */}
        {selectedStation && !showList && (
          <div className="lg:hidden absolute bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-t-3xl p-6 shadow-2xl border-t-2 border-gray-200 dark:border-neutral-700 max-h-[50vh] overflow-y-auto">
            <div className="w-16 h-1.5 bg-gray-300 dark:bg-neutral-700 rounded-full mx-auto mb-5" />
            {mockStations
              .filter((s) => s.id === selectedStation)
              .map((station) => (
                <StationCard key={station.id} {...station} />
              ))}
          </div>
        )}

        {/* Bottom Sheet - Station List (Mobile Only) */}
        {showList && (
          <div className="lg:hidden absolute bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-t-3xl p-6 shadow-2xl border-t-2 border-gray-200 dark:border-neutral-700 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground tracking-tight">
                Nearby Stations ({mockStations.length})
              </h3>
              <button onClick={() => setShowList(false)} className="p-2">
                <div className="w-16 h-1.5 bg-gray-300 dark:bg-neutral-700 rounded-full" />
              </button>
            </div>
            <div className="space-y-3">
              {mockStations.map((station) => (
                <StationCard
                  key={station.id}
                  {...station}
                  onClick={() => {
                    setSelectedStation(station.id);
                    setShowList(false);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Sheet */}
      <MapFilterSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
      />
    </div>
  );
}
