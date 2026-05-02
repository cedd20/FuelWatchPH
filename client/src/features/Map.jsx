import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { MapPin, Navigation, Filter, List, Search, Loader2, Plus } from "lucide-react";
import { StationCard } from "@/shared/components/StationCard";
import { FuelTypeChip } from "@/shared/components/FuelTypeChip";
import { MapFilterSheet } from "@/shared/components/MapFilterSheet";
import { FilterChip } from "@/shared/components/FilterChip";
import { BrandLogoPin } from "@/shared/components/BrandLogoPin";
import { MapPriceLegend } from "@/shared/components/MapPriceLegend";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, CircleMarker } from "react-leaflet";
import { renderToString } from "react-dom/server";
import { useStations } from "@/hooks/useStations";
import { getCitiesSortedByProximity } from "@/shared/utils/philippineCities";
import { FUEL_TYPES } from "@/shared/utils/fuelTypes";

const MAP_STATE_KEY = "fuelwatch_map_state";

// Fix for Leaflet default marker icons in Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Map starts empty — stations are loaded from OSM (via geolocation) and localStorage
const fuelTypes = ["All", ...FUEL_TYPES];

const CITY_COORDS = {
  "Quezon City": [14.6760, 121.0437],
  "Manila": [14.5995, 120.9842],
  "Makati": [14.5547, 121.0244],
  "Pasig": [14.5733, 121.0615],
  "Taguig": [14.5176, 121.0509],
  "Caloocan": [14.6416, 120.9762],
  "Pasay": [14.5378, 121.0014],
  "Cebu City": [10.3157, 123.8854],
  "Davao City": [7.1907, 125.4553],
};

// Haversine formula to calculate distance between two coordinates in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

function loadStoredMapState() {
  try {
    const raw = localStorage.getItem(MAP_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredMapState(state) {
  try {
    localStorage.setItem(MAP_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save map state:", error);
  }
}

function buildActiveFilterLabels(filters) {
  if (!filters) return [];

  const labels = [];
  if (filters.location === "city" && filters.selectedCity) {
    labels.push(`City: ${filters.selectedCity}`);
  }
  if (filters.fuelTypes?.length > 0) {
    labels.push(`${filters.fuelTypes.length} fuels`);
  }
  if (filters.brands?.length > 0) {
    labels.push(`${filters.brands.length} brands`);
  }
  if (filters.verifiedOnly) {
    labels.push("Verified");
  }
  if (filters.openNow) {
    labels.push("Open now");
  }

  return labels;
}

export function Map() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedFuelType, setSelectedFuelType] = useState("Unleaded 91");
  const [showList, setShowList] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]); // Used purely for UI rendering of filter chips
  const [appliedFilters, setAppliedFilters] = useState(null); // Used for actual data filtering
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);

  // Fetch real stations from backend
  const { data: rawStations = [], isLoading: isLoadingStations } = useStations({
    city: appliedFilters?.location === "city" ? appliedFilters.selectedCity : undefined,
    fuel_type: selectedFuelType !== "All" ? selectedFuelType : undefined,
    lat: userLocation?.[0],
    lng: userLocation?.[1],
    radius_km: appliedFilters?.location === "nearby" ? appliedFilters.radius : undefined,
  });

  // Process stations for UI components
  const stations = rawStations.map(s => ({
    ...s,
    prices: Object.entries(s.latest_prices || {}).map(([type, details]) => ({
      type,
      price: details.price
    })),
    lastUpdated: s.latest_prices && Object.keys(s.latest_prices).length > 0 
      ? new Date(Math.max(...Object.values(s.latest_prices).map(p => new Date(p.observed_at)))).toLocaleDateString()
      : 'No reports',
    verified: s.is_active // Simple mapping for now
  }));

  // Restore persisted map state and sync search query from URL.
  useEffect(() => {
    const storedState = loadStoredMapState();
    const q = searchParams.get("search");

    if (storedState?.selectedFuelType && fuelTypes.includes(storedState.selectedFuelType)) {
      setSelectedFuelType(storedState.selectedFuelType);
    }
    if (typeof storedState?.showList === "boolean") {
      setShowList(storedState.showList);
    }
    if (storedState?.appliedFilters) {
      setAppliedFilters(storedState.appliedFilters);
      setActiveFilters(buildActiveFilterLabels(storedState.appliedFilters));
    }

    if (q !== null) {
      setSearchQuery(q);
      setShowList(true);
    } else if (typeof storedState?.searchQuery === "string") {
      setSearchQuery(storedState.searchQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    setActiveFilters(buildActiveFilterLabels(appliedFilters));
  }, [appliedFilters]);

  useEffect(() => {
    saveStoredMapState({
      selectedFuelType,
      searchQuery,
      showList,
      appliedFilters,
    });
  }, [appliedFilters, searchQuery, selectedFuelType, showList]);

  const getFilterDescription = () => {
    if (appliedFilters?.location === "city" && appliedFilters.selectedCity) {
      return `Showing all stations in ${appliedFilters.selectedCity}`;
    }
    const radius = appliedFilters?.radius || "3";
    return `Showing stations within ${radius}km of you`;
  };

  const handleApplyFilters = (filters) => {
    setAppliedFilters(filters);

    if (filters.location === "city" && filters.selectedCity) {
      const coords = CITY_COORDS[filters.selectedCity];
      if (coords && mapRef.current) {
        mapRef.current.flyTo(coords, 14, { animate: true });
      }
    }
  };

  const removeFilter = (filterLabel) => {
    setAppliedFilters((prev) => {
      if (!prev) return null;
      const updated = { ...prev };
      if (filterLabel.startsWith("City:")) {
        updated.location = "nearby";
        updated.selectedCity = "";
      } else if (filterLabel.includes("fuels")) {
        updated.fuelTypes = [];
      } else if (filterLabel.includes("brands")) {
        updated.brands = [];
      } else if (filterLabel === "Verified") {
        updated.verifiedOnly = false;
      } else if (filterLabel === "Open now") {
        updated.openNow = false;
      }
      return updated;
    });
  };

  const handlePreciseLocation = (isSilent = false) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLoc = [latitude, longitude];
          setUserLocation(newLoc);
          
          if (mapRef.current) {
            mapRef.current.flyTo(newLoc, 15, { animate: true });
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          if (!isSilent) {
            alert(`Unable to retrieve your location. Reason: ${error.message}. Please check your browser permissions or turn on Windows Location Services.`);
          }
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
      );
    } else {
      if (!isSilent) alert("Geolocation is not supported by your browser.");
    }
  };

  useEffect(() => {
    // Attempt automatic location finding quietly on mount
    handlePreciseLocation(true);
  }, []);

  // Calculate average price for the selected fuel type
  const getStationPrice = (station) => {
    const fuelPrice = station.prices.find((p) => p.type === selectedFuelType);
    return fuelPrice?.price || 0;
  };

  // --------------------------------------------------------
  // FILTERING LOGIC
  // --------------------------------------------------------
  const filteredStations = stations.map(station => {
    // Add dynamic distance calculation if userLocation is available
    const distance = userLocation 
      ? calculateDistance(userLocation[0], userLocation[1], station.lat, station.lng)
      : (station.distance || 0);
    return { ...station, distance: parseFloat(distance.toFixed(1)) };
  }).filter((station) => {
    // 1. Search Query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!station.name.toLowerCase().includes(query) && !station.address?.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // 2. Selected Fuel Type (Main Header Tabs)
    // Always show stations with no prices — only filter stations that HAVE prices but lack the selected type
    if (selectedFuelType !== "All" && station.prices.length > 0) {
      const hasFuel = station.prices.some(p => p.type === selectedFuelType);
      if (!hasFuel) return false;
    }

    // 3. Radius vs City Logic (Priority: City > Nearby)
    const locationMode = appliedFilters?.location || "nearby";
    if (locationMode === "city" && appliedFilters?.selectedCity) {
      const cityMatch = station.city === appliedFilters.selectedCity || 
                        station.address?.toLowerCase().includes(appliedFilters.selectedCity.toLowerCase());
      if (!cityMatch) return false;
    } else {
      // Nearby mode (default)
      const radiusLimit = parseFloat(appliedFilters?.radius || "3");
      // Only apply radius if userLocation is known, otherwise show all
      if (userLocation && station.distance > radiusLimit) return false;
    }

    if (!appliedFilters) return true;

    // 4. Sheet Filters (Brands / Verified / Fuel)
    if (appliedFilters.brands?.length > 0) {
      if (!appliedFilters.brands.includes(station.brand)) return false;
    }
    
    if (appliedFilters.verifiedOnly) {
      if (!station.verified) return false;
    }
    
    // fuelTypes from filter sheet (must have AT LEAST ONE of the selected fuels)
    if (appliedFilters.fuelTypes?.length > 0) {
      const hasAnySelectedFuel = station.prices.some(p => appliedFilters.fuelTypes.includes(p.type));
      if (!hasAnySelectedFuel) return false;
    }

    return true;
  });

  const avgPrice = filteredStations.length > 0 
    ? filteredStations.reduce((sum, station) => sum + getStationPrice(station), 0) / filteredStations.length 
    : 0;

  return (
    <div className="h-screen flex flex-col lg:flex-row">
      {/* Desktop Side Panel - Station List */}
      {showList && (
        <div className="hidden lg:flex lg:flex-col lg:w-[min(420px,38vw)] bg-white dark:bg-neutral-900 border-r-2 border-gray-200 dark:border-neutral-700 shadow-xl z-20">
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
            <div className="flex flex-col gap-1">
              <div className="text-sm text-muted-foreground font-medium">
                {filteredStations.length} stations found
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-lg w-fit">
                {getFilterDescription()}
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredStations.map((station) => (
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
      <div className="flex-1 relative bg-muted overflow-hidden z-10">

        {/* Loading overlay — shown while GPS + OSM fetch is in progress */}
        {isLoadingStations && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md rounded-2xl px-6 py-4 shadow-2xl border-2 border-emerald-400/30 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-emerald-500 animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-foreground">Locating nearby stations...</p>
                <p className="text-xs text-muted-foreground mt-0.5">Fetching from OpenStreetMap</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty state — shown when not loading, no stations, and no GPS yet */}
        {!isLoadingStations && filteredStations.length === 0 && !userLocation && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md rounded-2xl px-8 py-6 shadow-2xl border-2 border-gray-200 dark:border-neutral-700 text-center max-w-xs">
              <Navigation className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-base font-bold text-foreground mb-1">No stations loaded yet</p>
              <p className="text-sm text-muted-foreground">
                Tap the <span className="font-bold text-emerald-600 dark:text-emerald-400">compass button</span> to locate stations near you
              </p>
            </div>
          </div>
        )}

        <div className="absolute inset-0 lg:top-0 z-0">
          <MapContainer 
            ref={mapRef}
            center={[14.636, 121.047]} 
            zoom={15} 
            zoomControl={false}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredStations.map((station) => {
              const price = getStationPrice(station);
              const isSelected = selectedStation === station.id;
              
              const customIcon = L.divIcon({
                className: "custom-pin",
                html: renderToString(
                  <BrandLogoPin
                    brandName={station.brand}
                    price={price}
                    avgPrice={avgPrice}
                    isSelected={isSelected}
                    showPrice={true}
                  />
                ),
                iconSize: [48, 64],
                iconAnchor: [24, 64],
              });

              return (
                <Marker
                  key={station.id}
                  position={[station.lat, station.lng]}
                  icon={customIcon}
                  eventHandlers={{
                    click: () => {
                      setSelectedStation(station.id);
                    },
                  }}
                />
              );
            })}
            
            {/* User's Exact Location Marker */}
            {userLocation && (
              <CircleMarker 
                center={userLocation} 
                radius={8} 
                pathOptions={{ color: 'white', fillColor: '#3b82f6', fillOpacity: 1, weight: 3 }} 
              />
            )}
          </MapContainer>
        </div>

        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 p-4 lg:p-0 space-y-3 lg:space-y-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent lg:bg-none z-20">
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

        <div className="absolute right-4 lg:right-6 top-36 lg:top-44 z-20">
          <button 
            onClick={() => handlePreciseLocation(false)}
            className="w-14 h-14 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full shadow-2xl shadow-black/20 flex items-center justify-center border-2 border-gray-200 dark:border-neutral-700 hover:scale-110 transition-transform mb-3"
            title="Go to my location"
          >
            <Navigation className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
          </button>
          <button 
            onClick={() => navigate("/app/add-station")}
            className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full shadow-2xl shadow-emerald-500/50 flex items-center justify-center hover:scale-110 transition-transform border-2 border-emerald-400/30"
            title="Add new station"
          >
            <Plus className="w-8 h-8 text-white" strokeWidth={3} />
          </button>
        </div>

        {/* Mobile Filter and List Controls */}
        <div className="lg:hidden absolute right-4 bottom-32 space-y-3 z-20">
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
        <div className="absolute left-4 bottom-24 lg:bottom-10 z-20 pointer-events-none">
          <MapPriceLegend />
        </div>

        {/* Desktop Selected Station Panel */}
        {selectedStation && !showList && (
          <div className="hidden lg:block absolute bottom-6 right-6 w-[min(420px,38vw)] bg-white/98 dark:bg-neutral-900/98 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border-2 border-gray-200 dark:border-neutral-700 z-30">
            <button
              onClick={() => setSelectedStation(null)}
              className="absolute top-5 right-5 w-9 h-9 bg-muted hover:bg-muted/80 rounded-full flex items-center justify-center transition-all shadow-md z-10"
            >
              <span className="text-foreground text-xl leading-none">×</span>
            </button>
            {filteredStations
              .filter((s) => s.id === selectedStation)
              .map((station) => (
                <StationCard 
                  key={station.id} 
                  {...station} 
                  prices={Object.entries(station.latest_prices || {}).map(([type, details]) => ({ type, price: details.price }))}
                  onClick={() => navigate(`/app/station/${station.id}`)} 
                />
              ))}
          </div>
        )}

        {/* Bottom Sheet - Selected Station (Mobile Only) */}
        {selectedStation && !showList && (
          <div className="lg:hidden absolute bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-t-3xl p-5 sm:p-6 shadow-2xl border-t-2 border-gray-200 dark:border-neutral-700 max-h-[58vh] overflow-y-auto z-30">
            <div className="w-16 h-1.5 bg-gray-300 dark:bg-neutral-700 rounded-full mx-auto mb-5" />
            <div className="relative">
              <button
                onClick={() => setSelectedStation(null)}
                className="absolute -top-2 right-0 w-8 h-8 bg-muted hover:bg-muted/80 rounded-full flex items-center justify-center transition-all z-10"
              >
                <span className="text-foreground text-lg leading-none">×</span>
              </button>
              {filteredStations
                .filter((s) => s.id === selectedStation)
                .map((station) => (
                  <StationCard 
                    key={station.id} 
                    {...station} 
                    prices={Object.entries(station.latest_prices || {}).map(([type, details]) => ({ type, price: details.price }))}
                    onClick={() => navigate(`/app/station/${station.id}`)} 
                  />
                ))}
            </div>
          </div>
        )}

        {/* Bottom Sheet - Station List (Mobile Only) */}
        {showList && (
          <div className="lg:hidden absolute bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-t-3xl p-5 sm:p-6 shadow-2xl border-t-2 border-gray-200 dark:border-neutral-700 max-h-[72vh] overflow-y-auto flex flex-col z-30">
            <div className="flex items-center justify-between mb-5 shrink-0">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-foreground tracking-tight">
                  Nearby Stations ({filteredStations.length})
                </h3>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full w-fit">
                  {getFilterDescription()}
                </div>
              </div>
              <button onClick={() => setShowList(false)} className="p-2">
                <div className="w-16 h-1.5 bg-gray-300 dark:bg-neutral-700 rounded-full" />
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto pb-4">
              {filteredStations.map((station) => (
                <StationCard
                  key={station.id}
                  {...station}
                  prices={Object.entries(station.latest_prices || {}).map(([type, details]) => ({ type, price: details.price }))}
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
        availableCities={[...new Set(getCitiesSortedByProximity(userLocation?.[0], userLocation?.[1]).map(c => c.city))]}
        initialFilters={appliedFilters}
      />
    </div>
  );
}
