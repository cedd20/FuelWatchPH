import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { MapPin, Navigation, Filter, List, Search, Loader2 } from "lucide-react";
import { StationCard } from "@/shared/components/StationCard";
import { FuelTypeChip } from "@/shared/components/FuelTypeChip";
import { MapFilterSheet } from "@/shared/components/MapFilterSheet";
import { FilterChip } from "@/shared/components/FilterChip";
import { BrandLogoPin } from "@/shared/components/BrandLogoPin";
import { MapPriceLegend } from "@/shared/components/MapPriceLegend";
import { FUEL_TYPES } from "@/shared/utils/fuelTypes";
import { getUserStations } from "@/shared/utils/stationStorage";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, CircleMarker } from "react-leaflet";
import { renderToString } from "react-dom/server";

// Fix for Leaflet default marker icons in Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Map starts empty — stations are loaded from OSM (via geolocation) and localStorage
const fuelTypes = ["All", ...FUEL_TYPES];

export function Map() {
  const navigate = useNavigate();
  const [stations, setStations] = useState([]); // Empty until GPS + OSM loads
  const [selectedFuelType, setSelectedFuelType] = useState("Diesel");
  const [showList, setShowList] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingStations, setIsLoadingStations] = useState(false);

  const handleApplyFilters = (filters) => {
    const applied = [];
    if (filters.location === "city" && filters.selectedCity) {
      applied.push(filters.selectedCity);
    }
    if (filters.fuelTypes && filters.fuelTypes.length > 0) {
      applied.push(`${filters.fuelTypes.length} fuel types`);
    }
    if (filters.brands && filters.brands.length > 0) {
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

  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);

  const fetchRealGasStations = async (lat, lng) => {
    try {
      const query = `
        [out:json];
        node["amenity"="fuel"](around:3000, ${lat}, ${lng});
        out;
      `;
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query
      });
      const data = await response.json();
      
      const realStations = data.elements.map(el => {
        const brandTag = el.tags?.brand || "";
        const nameTag = el.tags?.name || "";
        const nBrand = brandTag.toLowerCase() || nameTag.toLowerCase();
        
        let normalizedBrand = "Independent";
        if (nBrand.includes("shell")) normalizedBrand = "Shell";
        else if (nBrand.includes("petron")) normalizedBrand = "Petron";
        else if (nBrand.includes("caltex")) normalizedBrand = "Caltex";
        else if (nBrand.includes("seaoil")) normalizedBrand = "Seaoil";
        else if (nBrand.includes("cleanfuel")) normalizedBrand = "Cleanfuel";
        else if (nBrand.includes("unioil")) normalizedBrand = "Unioil";
        else if (nBrand.includes("phoenix")) normalizedBrand = "Phoenix";
        else if (nBrand.includes("total")) normalizedBrand = "TotalEnergies";
        else if (nBrand.includes("jetti")) normalizedBrand = "Jetti";
        else if (nBrand.includes("rephil")) normalizedBrand = "RePhil";
        else if (nBrand.includes("flying")) normalizedBrand = "Flying V";
        else normalizedBrand = nameTag || brandTag || "Gas Station";
        
        return {
          id: el.id.toString(),
          name: nameTag || `${normalizedBrand} Station`,
          brand: normalizedBrand,
          address: el.tags?.['addr:full'] || el.tags?.['addr:street'] || "Address unlisted in OpenStreetMap",
          distance: 0,
          prices: [
             { type: "Unleaded 91", price: 62.00 + Math.random() * 5 },
             { type: "Premium 95", price: 65.00 + Math.random() * 5 },
             { type: "Diesel", price: 55.00 + Math.random() * 5 },
          ],
          lastUpdated: "Live Map Data",
          verified: false,
          lat: el.lat,
          lng: el.lon,
        };
      });

      // Merge OSM stations with user-added stations from localStorage
      // TODO: Replace getUserStations() with API call when backend is ready
      const userStations = getUserStations();
      if (realStations.length > 0) {
        const allStations = [...realStations.slice(0, 30), ...userStations];
        setStations(allStations);
        setIsLoadingStations(false);
      } else {
        // No OSM results, but still show user-added stations
        if (userStations.length > 0) {
          setStations(userStations);
        }
        setIsLoadingStations(false);
      }
    } catch (e) {
      console.error("Failed to fetch real stations via Overpass:", e);
      // On fetch failure, still show user-added stations
      const userStations = getUserStations();
      if (userStations.length > 0) {
        setStations(userStations);
      }
      setIsLoadingStations(false);
    }
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

          // Fetch actual physical gas stations from OSM
          setIsLoadingStations(true);
          fetchRealGasStations(latitude, longitude);
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
    // Load any user-added stations from localStorage immediately on mount
    // so they appear even before geolocation resolves
    // TODO: Replace with API call when backend is ready
    const savedStations = getUserStations();
    if (savedStations.length > 0) {
      setStations((prev) => {
        // Merge with any existing stations, avoiding duplicates by ID
        const existingIds = new Set(prev.map((s) => s.id));
        const newOnes = savedStations.filter((s) => !existingIds.has(s.id));
        return [...prev, ...newOnes];
      });
    }
    // Attempt automatic location finding quietly on mount
    handlePreciseLocation(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate average price for the selected fuel type
  const getStationPrice = (station) => {
    const fuelPrice = station.prices.find((p) => p.type === selectedFuelType);
    return fuelPrice?.price || 0;
  };

  const avgPrice = stations.reduce((sum, station) => sum + getStationPrice(station), 0) / stations.length;

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
              {stations.length} stations found
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {stations.map((station) => (
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
        {!isLoadingStations && stations.length === 0 && !userLocation && (
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
            {stations.map((station) => {
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
        <div className="absolute top-0 left-0 right-0 p-4 lg:p-0 space-y-3 lg:space-y-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent lg:bg-none">
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

        <div className="absolute right-4 lg:right-6 top-36 lg:top-44 z-10">
          <button 
            onClick={() => handlePreciseLocation(false)}
            className="w-14 h-14 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full shadow-2xl shadow-black/20 flex items-center justify-center border-2 border-gray-200 dark:border-neutral-700 hover:scale-110 transition-transform"
            title="Go to my location"
          >
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
            {stations
              .filter((s) => s.id === selectedStation)
              .map((station) => (
                <StationCard key={station.id} {...station} onClick={() => navigate(`/app/station/${station.id}`)} />
              ))}
          </div>
        )}

        {/* Bottom Sheet - Selected Station (Mobile Only) */}
        {selectedStation && !showList && (
          <div className="lg:hidden absolute bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-t-3xl p-6 shadow-2xl border-t-2 border-gray-200 dark:border-neutral-700 max-h-[50vh] overflow-y-auto">
            <div className="w-16 h-1.5 bg-gray-300 dark:bg-neutral-700 rounded-full mx-auto mb-5" />
            <div className="relative">
              <button
                onClick={() => setSelectedStation(null)}
                className="absolute -top-2 right-0 w-8 h-8 bg-muted hover:bg-muted/80 rounded-full flex items-center justify-center transition-all z-10"
              >
                <span className="text-foreground text-lg leading-none">×</span>
              </button>
              {stations
                .filter((s) => s.id === selectedStation)
                .map((station) => (
                  <StationCard key={station.id} {...station} onClick={() => navigate(`/app/station/${station.id}`)} />
                ))}
            </div>
          </div>
        )}

        {/* Bottom Sheet - Station List (Mobile Only) */}
        {showList && (
          <div className="lg:hidden absolute bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-t-3xl p-6 shadow-2xl border-t-2 border-gray-200 dark:border-neutral-700 max-h-[70vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between mb-5 shrink-0">
              <h3 className="text-lg font-bold text-foreground tracking-tight">
                Nearby Stations ({stations.length})
              </h3>
              <button onClick={() => setShowList(false)} className="p-2">
                <div className="w-16 h-1.5 bg-gray-300 dark:bg-neutral-700 rounded-full" />
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto pb-4">
              {stations.map((station) => (
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
