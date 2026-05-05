import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Navigation, Filter, List, Search, Loader2, Plus, Heart, Minus } from "lucide-react";
import { StationCard } from "@/shared/components/StationCard";
import { FuelTypeChip } from "@/shared/components/FuelTypeChip";
import { MapFilterSheet } from "@/shared/components/MapFilterSheet";
import { FilterChip } from "@/shared/components/FilterChip";
import { BrandLogoPin } from "@/shared/components/BrandLogoPin";
import { MapPriceLegend } from "@/shared/components/MapPriceLegend";
import { EmptyState } from "@/shared/components/EmptyState";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, CircleMarker, useMapEvents, useMap } from "react-leaflet";
import { renderToString } from "react-dom/server";
import { useStations } from "@/hooks/useStations";
import { getCitiesSortedByProximity } from "@/shared/utils/philippineCities";
import { FUEL_TYPES } from "@/shared/utils/fuelTypes";
import {
  DEFAULT_MAP_FILTERS,
  getFuelSelectionSummary,
  isDefaultMapFilters,
  normalizeMapFilters,
} from "@/shared/utils/mapFilters";
import { api } from "@/lib/apiClient";
import { useQueryClient } from "@tanstack/react-query";
import { isValidPrice } from "@/shared/utils/priceUtils";
import { StationCardSkeleton } from "@/shared/components/Skeleton";
import { getSavedStationIds } from "@/shared/utils/favorites";
import { toast } from "sonner";

const MAP_STATE_KEY = "fuelwatch_map_state";
const MAP_RECENT_SEARCHES_KEY = "fuelwatch_map_recent_searches";
const MAP_FILTERS_KEY = "fuelwatch_map_filters";

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

function loadStoredMapFilters() {
  try {
    const raw = localStorage.getItem(MAP_FILTERS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredMapFilters(filters) {
  try {
    localStorage.setItem(MAP_FILTERS_KEY, JSON.stringify(filters));
  } catch (error) {
    console.error("Failed to save map filters:", error);
  }
}

function clearStoredMapFilters() {
  try {
    localStorage.removeItem(MAP_FILTERS_KEY);
  } catch (error) {
    console.error("Failed to clear map filters:", error);
  }
}

function loadRecentSearches() {
  try {
    const raw = localStorage.getItem(MAP_RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(searches) {
  try {
    localStorage.setItem(MAP_RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch (error) {
    console.error("Failed to save recent searches:", error);
  }
}

function formatCountLabel(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function buildActiveFilterLabels(filters) {
  if (!filters) return [];

  const labels = [];
  if (filters.location === "city" && filters.selectedCity) {
    labels.push(`City: ${filters.selectedCity}`);
  }
  if (filters.brands?.length > 0) {
    labels.push(formatCountLabel(filters.brands.length, "brand"));
  }
  if (filters.verifiedOnly) {
    labels.push("Verified");
  }
  if (filters.openNow) {
    labels.push("Open now");
  }

  return labels;
}

// Map Events component extracted outside to prevent infinite unmount/remount loops
function MapEvents({ onMoveStart, onMoveEnd, onBoundsChange }) {
  const map = useMap();
  
  useEffect(() => {
    // Set initial bounds once map is ready
    if (onBoundsChange) onBoundsChange(map.getBounds());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  
  useMapEvents({
    movestart: () => {
      if (onMoveStart) onMoveStart();
    },
    moveend: () => {
      if (onMoveEnd) onMoveEnd(map.getCenter(), map.getBounds());
    },
  });
  return null;
}

export function Map() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [isSyncingOSM, setIsSyncingOSM] = useState(false);
  const [showSyncButton, setShowSyncButton] = useState(false);
  const [mapMoveCenter, setMapMoveCenter] = useState(null);
  const [showList, setShowList] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_MAP_FILTERS);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [recentSearches, setRecentSearches] = useState(() => loadRecentSearches());
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [desktopToolPanel, setDesktopToolPanel] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [visibleBounds, setVisibleBounds] = useState(null);
  const [isUpdatingMap, setIsUpdatingMap] = useState(false);
  const mapRef = useRef(null);
  const lastSyncPos = useRef(null);
  const syncTimeoutRef = useRef(null);
  const desktopSearchRef = useRef(null);
  const desktopSidebarRef = useRef(null);
  const normalizedFilters = normalizeMapFilters(appliedFilters);
  const fuelSelection = getFuelSelectionSummary(normalizedFilters.fuelTypes);
  const activeFuelTypes = normalizedFilters.fuelTypes;
  const selectedFuelType = fuelSelection.selectedFuelType;
  const activeFilters = buildActiveFilterLabels(normalizedFilters);
  const isDesktopSidebarExpanded = desktopToolPanel === "list" || desktopToolPanel === "saved";

  // Fetch real stations from backend (No GPS limits, fetch all to allow seamless map panning)
  const { data: rawStations = [], isLoading: isLoadingStations } = useStations({
    city: normalizedFilters.location === "city" ? normalizedFilters.selectedCity : undefined,
    fuel_type: activeFuelTypes.length === 1 ? activeFuelTypes[0] : undefined,
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

  const savedStations = useMemo(() => {
    const savedIds = getSavedStationIds();
    return stations.filter((station) => savedIds.includes(station.id));
  }, [stations]);

  const filteredSavedStations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return savedStations;

    return savedStations.filter((station) =>
      station.name.toLowerCase().includes(query) ||
      station.address?.toLowerCase().includes(query)
    );
  }, [savedStations, searchQuery]);

  // Restore persisted map state and sync search query from URL.
  useEffect(() => {
    const storedFilters = loadStoredMapFilters();
    const storedState = loadStoredMapState();
    const q = searchParams.get("search");

    if (storedFilters) {
      setAppliedFilters(normalizeMapFilters(storedFilters));
    }
    if (typeof storedState?.showList === "boolean") {
      setShowList(storedState.showList);
    }
    if (!storedFilters && storedState?.appliedFilters) {
      setAppliedFilters(normalizeMapFilters(storedState.appliedFilters));
    } else if (!storedFilters && storedState?.selectedFuelType && FUEL_TYPES.includes(storedState.selectedFuelType)) {
      setAppliedFilters((prev) =>
        normalizeMapFilters({
          ...prev,
          fuelTypes: [storedState.selectedFuelType],
        })
      );
    }

    if (q !== null) {
      setSearchQuery(q);
      setShowList(true);
    } else if (typeof storedState?.searchQuery === "string") {
      setSearchQuery(storedState.searchQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    saveStoredMapState({
      selectedFuelType,
      searchQuery,
      showList,
      appliedFilters: normalizedFilters,
    });
  }, [normalizedFilters, searchQuery, selectedFuelType, showList]);

  useEffect(() => {
    if (isDefaultMapFilters(normalizedFilters)) {
      clearStoredMapFilters();
      return;
    }

    saveStoredMapFilters(normalizedFilters);
  }, [normalizedFilters]);

  useEffect(() => {
    saveRecentSearches(recentSearches);
  }, [recentSearches]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(event.target)) {
        setShowRecentSearches(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!showList && desktopToolPanel === "list") {
      setDesktopToolPanel(null);
    }
  }, [desktopToolPanel, showList]);

  const getFilterDescription = () => {
    if (normalizedFilters.location === "city" && normalizedFilters.selectedCity) {
      return `Showing all stations in ${normalizedFilters.selectedCity}`;
    }
    const radiusVal = normalizedFilters.radius || "20";
    if (radiusVal === "all") return "Showing all available stations";
    return `Showing stations within ${radiusVal}km of you`;
  };

  const handleApplyFilters = (filters) => {
    const nextFilters = normalizeMapFilters(filters);
    setAppliedFilters(nextFilters);

    if (nextFilters.location === "city" && nextFilters.selectedCity) {
      const coords = CITY_COORDS[nextFilters.selectedCity];
      if (coords && mapRef.current) {
        mapRef.current.flyTo(coords, 14, { animate: true });
      }
    }
  };

  const removeFilter = (filterLabel) => {
    setAppliedFilters((prev) => {
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
      return normalizeMapFilters(updated);
    });
  };

  const handleFuelChipSelect = (fuelType) => {
    setAppliedFilters((prev) =>
      normalizeMapFilters({
        ...prev,
        fuelTypes: fuelType === "All" ? [] : [fuelType],
      })
    );
  };

  const commitRecentSearch = (rawQuery) => {
    const trimmedQuery = rawQuery.trim();
    if (!trimmedQuery) return;

    setRecentSearches((prev) => {
      const nextSearches = [
        trimmedQuery,
        ...prev.filter((entry) => entry.toLowerCase() !== trimmedQuery.toLowerCase()),
      ];
      return nextSearches.slice(0, 6);
    });
  };

  const handleSearchSubmit = () => {
    commitRecentSearch(searchQuery);
    setShowRecentSearches(false);
    setShowList(true);
    setDesktopToolPanel("list");
    setSelectedStation(null);
  };

  const handleRecentSearchSelect = (query) => {
    setSearchQuery(query);
    commitRecentSearch(query);
    setShowRecentSearches(false);
    setShowList(true);
    setDesktopToolPanel("list");
    setSelectedStation(null);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    setShowRecentSearches(false);
  };

  const toggleDesktopListPanel = () => {
    const nextIsOpen = !showList;
    setShowList(nextIsOpen);
    setDesktopToolPanel(nextIsOpen ? "list" : null);
    if (nextIsOpen) {
      setSelectedStation(null);
    }
  };

  const toggleDesktopSavedPanel = () => {
    setShowList(false);
    setSelectedStation(null);
    setDesktopToolPanel((prev) => (prev === "saved" ? null : "saved"));
  };

  const zoomMapIn = () => {
    if (mapRef.current?.zoomIn) {
      mapRef.current.zoomIn();
    }
  };

  const zoomMapOut = () => {
    if (mapRef.current?.zoomOut) {
      mapRef.current.zoomOut();
    }
  };

  const renderDesktopSearchBar = (widthClassName) => (
    <div ref={desktopSearchRef} className={`relative ${widthClassName}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setShowRecentSearches(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSearchSubmit();
          }
        }}
        placeholder={desktopToolPanel === "saved" ? "Search saved stations" : "Search stations, cities, or roads"}
        className="w-full pl-12 pr-5 py-3.5 bg-white/96 dark:bg-neutral-950/92 rounded-2xl border border-gray-200/80 dark:border-neutral-700/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-[0_14px_30px_rgba(15,23,42,0.2)] transition-all placeholder:text-gray-500 text-foreground font-medium"
      />

      {showRecentSearches && recentSearches.length > 0 && (
        <div className="absolute top-[calc(100%+0.75rem)] left-0 w-full rounded-[24px] bg-white/96 dark:bg-neutral-900/96 backdrop-blur-2xl border border-white/70 dark:border-neutral-700/70 shadow-[0_24px_60px_rgba(15,23,42,0.22)] p-3 z-20">
          <div className="flex items-center justify-between px-2 pb-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Recent searches
            </span>
            <button
              onClick={clearRecentSearches}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:opacity-80 transition-opacity"
            >
              Clear
            </button>
          </div>
          <div className="space-y-1">
            {recentSearches.map((recentSearch) => (
              <button
                key={recentSearch}
                onClick={() => handleRecentSearchSelect(recentSearch)}
                className="w-full text-left px-3 py-2.5 rounded-2xl text-sm font-medium text-foreground hover:bg-emerald-50 dark:hover:bg-neutral-800 transition-colors"
              >
                {recentSearch}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const handlePreciseLocation = (isSilent = false) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLoc = [latitude, longitude];
          setUserLocation(newLoc);
          
          if (mapRef.current) {
            mapRef.current.flyTo(newLoc, 13, { animate: true });
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

  const handleMoveEnd = (center, bounds) => {
    const pos = [center.lat, center.lng];
    setMapMoveCenter(pos);
    setVisibleBounds(bounds);
    setIsUpdatingMap(false);
    
    // Check if moved far enough from last sync (> 1.5km)
    const dist = lastSyncPos.current 
      ? calculateDistance(lastSyncPos.current[0], lastSyncPos.current[1], pos[0], pos[1])
      : 999;

    if (dist > 1.5) {
      // Show search button but also trigger automatic throttled sync
      setShowSyncButton(true);
      
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        handleOSMSync(true); // silent sync
      }, 2000);
    }
  };

  const handleOSMSync = async (silent = false) => {
    const target = mapMoveCenter;
    if (!target) return;
    
    setIsSyncingOSM(true);
    try {
      await api.post(`/stations/sync?lat=${target[0]}&lng=${target[1]}`, {});
      if (!silent) toast.success("Nearby stations updated!");
      
      lastSyncPos.current = target;
      // Refetch stations from our DB
      queryClient.invalidateQueries({ queryKey: ["stations"] });
      setShowSyncButton(false);
    } catch (error) {
      console.error("OSM sync failed:", error);
      if (!silent) toast.error("Failed to sync with OpenStreetMap.");
    } finally {
      setIsSyncingOSM(false);
    }
  };

  // Calculate price for the selected fuel type
  const getStationPrice = (station) => {
    const prices = station.prices
      ?.filter((priceEntry) => activeFuelTypes.length === 0 || activeFuelTypes.includes(priceEntry.type))
      .map((priceEntry) => Number(priceEntry.price))
      .filter((price) => isValidPrice(price)) || [];

    return prices.length > 0 ? Math.min(...prices) : null;
  };

  // --------------------------------------------------------
  // FILTERING LOGIC
  // --------------------------------------------------------
  
  // Determine if the user is actively panning away from their GPS location
  const distFromMapCenterToGPS = userLocation && mapMoveCenter 
    ? calculateDistance(userLocation[0], userLocation[1], mapMoveCenter[0], mapMoveCenter[1]) 
    : 0;
  // If the map center is more than 1km away from GPS, consider it manual browsing
  const isBrowsingManually = distFromMapCenterToGPS > 1;

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
    
    // 2. Fuel Type Selection
    if (activeFuelTypes.length > 0 && station.prices.length > 0) {
      const hasFuel = station.prices.some(
        (p) => activeFuelTypes.includes(p.type) && isValidPrice(p.price)
      );
      if (!hasFuel) return false;
    }

    // 3. Viewport Boundary Check (Performance optimization to prevent crashing map with too many markers)
    // Only apply if there's no active City filter or Search query (we want them to find stuff off-screen if explicitly searched)
    if (!searchQuery && normalizedFilters.location !== "city" && visibleBounds) {
      const inBounds = visibleBounds.contains([station.lat, station.lng]);
      if (!inBounds) return false;
    }

    // 4. Radius vs City Logic (Priority: City > Nearby)
    const locationMode = normalizedFilters.location || "nearby";
    if (locationMode === "city" && normalizedFilters.selectedCity) {
      const cityMatch = station.city === normalizedFilters.selectedCity || 
                        station.address?.toLowerCase().includes(normalizedFilters.selectedCity.toLowerCase());
      if (!cityMatch) return false;
    } else if (locationMode === "nearby") {
      const radiusVal = normalizedFilters.radius || "all";
      if (radiusVal !== "all") {
        const radiusLimit = parseFloat(radiusVal);
        if (userLocation && !isBrowsingManually && station.distance > radiusLimit) return false;
      }
    }

    // 5. Sheet Filters (Brands / Verified)
    if (normalizedFilters.brands?.length > 0) {
      if (!normalizedFilters.brands.includes(station.brand)) return false;
    }
    
    if (normalizedFilters.verifiedOnly) {
      if (!station.verified) return false;
    }

    return true;
  }).sort((a, b) => a.distance - b.distance);

  const stationsWithPrices = filteredStations
    .map(s => getStationPrice(s))
    .filter(p => p !== null);

  const avgPrice = stationsWithPrices.length > 0 
    ? stationsWithPrices.reduce((sum, price) => sum + price, 0) / stationsWithPrices.length 
    : 0;

  return (
    <div className="h-full min-h-0 flex flex-col lg:flex-row lg:overflow-hidden">
      {/* Map View */}
      <div className="flex-1 relative bg-muted overflow-hidden z-10">

        {/* Sync Button — shown when map moved */}
        {showSyncButton && !isLoadingStations && (
          <div className="absolute top-24 lg:top-8 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={handleOSMSync}
              disabled={isSyncingOSM}
              className="bg-white dark:bg-neutral-900 backdrop-blur-xl border-2 border-emerald-500/50 rounded-full px-5 py-2.5 shadow-2xl shadow-emerald-500/20 flex items-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all group scale-105"
            >
              {isSyncingOSM ? (
                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
              ) : (
                <Search className="w-4 h-4 text-emerald-500 group-hover:scale-125 transition-transform" />
              )}
              <span className="text-sm font-bold text-foreground">
                {isSyncingOSM ? "Syncing stations..." : "Search this area"}
              </span>
            </button>
          </div>
        )}

        {/* Subtle Map Update Indicator */}
        <div className={`absolute top-[4.5rem] lg:top-8 left-1/2 -translate-x-1/2 z-20 transition-all duration-300 pointer-events-none ${isUpdatingMap ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-gray-200 dark:border-neutral-700 flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
            <span className="text-xs font-bold text-foreground">Updating visible stations...</span>
          </div>
        </div>

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
            <MapEvents 
              onMoveStart={() => setIsUpdatingMap(true)}
              onMoveEnd={handleMoveEnd}
              onBoundsChange={setVisibleBounds}
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

        <div className="hidden lg:block absolute top-0 left-0 right-0 h-40 z-10 pointer-events-none bg-gradient-to-b from-black/28 via-black/10 to-transparent" />

        {/* Mobile Top Controls */}
        <div className="absolute top-0 left-0 right-0 p-4 space-y-3 bg-gradient-to-b from-black/60 via-black/30 to-transparent lg:hidden z-20">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearchSubmit();
                  }
                }}
                placeholder="Search stations or locations"
                className="w-full pl-12 pr-5 py-3.5 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full border-2 border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-2xl shadow-black/20 transition-all placeholder:text-gray-500 text-foreground font-medium"
              />
            </div>
          </div>

          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
            {fuelTypes.map((type) => (
              <FuelTypeChip
                key={type}
                label={type}
                active={
                  fuelSelection.mode === "all"
                    ? type === "All"
                    : fuelSelection.mode === "single" && selectedFuelType === type
                }
                onClick={() => handleFuelChipSelect(type)}
              />
            ))}
            {fuelSelection.mode === "multiple" && (
              <button
                onClick={() => setShowFilters(true)}
                className="px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap bg-amber-50 text-amber-900 border-2 border-amber-300 shadow-lg hover:bg-amber-100 transition-all"
              >
                {fuelSelection.indicatorLabel}
              </button>
            )}
          </div>
        </div>

        {/* Desktop Top Controls */}
        <div
          className="hidden lg:flex absolute top-6 right-6 z-30 items-start gap-3 pointer-events-none transition-[left] duration-300 ease-out"
          style={{
            left: isDesktopSidebarExpanded
              ? "calc(1.5rem + 92px + 0.75rem + min(455px, 34vw) + 1rem)"
              : "8.5rem",
          }}
        >
          <div className="min-w-0 flex-1 pointer-events-auto">
            <div className="px-1 py-1">
              <div className="flex items-center gap-3">
                {!isDesktopSidebarExpanded && renderDesktopSearchBar("w-[min(420px,34vw)] flex-shrink-0")}

                <button
                  onClick={() => setShowFilters(true)}
                  className="h-12 w-12 rounded-2xl bg-white/94 dark:bg-neutral-950/92 border border-white/75 dark:border-neutral-700/80 shadow-[0_14px_30px_rgba(15,23,42,0.2)] flex items-center justify-center relative hover:border-emerald-300 transition-colors"
                  title="Open filters"
                >
                  <Filter className="w-5 h-5 text-gray-700 dark:text-gray-200" strokeWidth={2.5} />
                  {activeFilters.length > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 min-w-6 h-6 px-1 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-[11px] text-white font-bold">{activeFilters.length}</span>
                    </div>
                  )}
                </button>

                <div className="min-w-0 flex-1 overflow-x-auto scrollbar-hide">
                  <div className="flex items-center gap-2.5 min-w-max pr-1">
                    {fuelTypes.map((type) => (
                      <FuelTypeChip
                        key={type}
                        label={type}
                        active={
                          fuelSelection.mode === "all"
                            ? type === "All"
                            : fuelSelection.mode === "single" && selectedFuelType === type
                        }
                        onClick={() => handleFuelChipSelect(type)}
                      />
                    ))}
                    {fuelSelection.mode === "multiple" && (
                      <button
                        onClick={() => setShowFilters(true)}
                        className="px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap bg-amber-50 text-amber-900 border-2 border-amber-300 shadow-lg hover:bg-amber-100 transition-all"
                      >
                        {fuelSelection.indicatorLabel}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {activeFilters.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  {activeFilters.map((filter, index) => (
                    <FilterChip key={index} label={filter} onRemove={() => removeFilter(filter)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block absolute top-6 left-6 z-30 pointer-events-none">
          <div
            ref={desktopSidebarRef}
            className="pointer-events-auto flex items-start gap-3"
          >
            <div className="w-[92px] shrink-0 px-4 py-5 flex flex-col items-center gap-3 rounded-[34px] border border-white/60 dark:border-neutral-700/70 bg-white/88 dark:bg-neutral-900/88 backdrop-blur-2xl shadow-[0_28px_70px_rgba(15,23,42,0.22)]">
              <button
                onClick={toggleDesktopListPanel}
                className={`h-[52px] w-[52px] rounded-[22px] border transition-all duration-200 flex items-center justify-center ${
                  desktopToolPanel === "list"
                    ? "bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-500/30"
                    : "bg-white/92 dark:bg-neutral-900 text-foreground border-gray-200 dark:border-neutral-700 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-neutral-800"
                }`}
                title="Nearby stations"
              >
                <List className="w-5 h-5" strokeWidth={2.5} />
              </button>
              <button
                onClick={toggleDesktopSavedPanel}
                className={`h-[52px] w-[52px] rounded-[22px] border transition-all duration-200 flex items-center justify-center ${
                  desktopToolPanel === "saved"
                    ? "bg-rose-500 text-white border-rose-300 shadow-lg shadow-rose-500/25"
                    : "bg-white/92 dark:bg-neutral-900 text-foreground border-gray-200 dark:border-neutral-700 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-neutral-800"
                }`}
                title="Saved stations"
              >
                <Heart className="w-5 h-5" strokeWidth={2.5} />
              </button>
              <button
                onClick={() => navigate("/app/add-station")}
                className="h-[52px] w-[52px] rounded-[22px] border border-emerald-400/40 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/35 transition-all duration-200 flex items-center justify-center hover:scale-105"
                title="Add station"
              >
                <Plus className="w-5 h-5" strokeWidth={2.8} />
              </button>
            </div>

            <div
              className={`min-w-0 overflow-hidden rounded-[34px] border border-white/60 dark:border-neutral-700/70 bg-white/88 dark:bg-neutral-900/88 backdrop-blur-2xl shadow-[0_32px_80px_rgba(15,23,42,0.24)] transition-[width,opacity,transform] duration-300 ease-out ${
                isDesktopSidebarExpanded
                  ? "w-[min(455px,34vw)] h-[min(720px,calc(100vh-8rem))] opacity-100 translate-x-0"
                  : "w-0 opacity-0 -translate-x-2 pointer-events-none border-transparent shadow-none"
              }`}
            >
              <div className="h-full flex flex-col px-5 py-5">
                {renderDesktopSearchBar("w-full")}
                <div className="mt-4 flex-1 min-h-0 overflow-hidden rounded-[28px] bg-white/60 dark:bg-neutral-950/34 border border-white/50 dark:border-neutral-700/55 shadow-inner">
                  <div
                    className={`h-full transition-all duration-300 ease-out ${
                      isDesktopSidebarExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                    }`}
                  >
                    {desktopToolPanel === "list" ? (
                      <div className="h-full flex flex-col">
                        <div className="px-5 pt-4 pb-3 border-b border-white/55 dark:border-neutral-700/60">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-xl font-bold text-foreground tracking-tight">Nearby Stations</div>
                              <div className="mt-1 text-sm font-medium text-muted-foreground">
                                {filteredStations.length} stations found
                              </div>
                            </div>
                            <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                              {getFilterDescription()}
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 [scrollbar-width:thin] [scrollbar-color:rgba(16,185,129,0.45)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-emerald-500/35 hover:[&::-webkit-scrollbar-thumb]:bg-emerald-500/55">
                          {isLoadingStations ? (
                            Array.from({ length: 4 }).map((_, index) => (
                              <StationCardSkeleton key={index} />
                            ))
                          ) : filteredStations.length > 0 ? (
                            filteredStations.map((station) => (
                              <div
                                key={station.id}
                                className={`cursor-pointer rounded-3xl transition-all ${
                                  selectedStation === station.id ? "ring-2 ring-emerald-500" : ""
                                }`}
                              >
                                <StationCard
                                  {...station}
                                  onClick={() => setSelectedStation(station.id)}
                                />
                              </div>
                            ))
                          ) : (
                            <div className="h-full flex items-center justify-center p-6">
                              <EmptyState
                                icon={List}
                                title="No stations in view"
                                description="Try adjusting your search, map position, or filters to see more stations."
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col">
                        <div className="px-5 pt-4 pb-3 border-b border-white/55 dark:border-neutral-700/60">
                          <div className="text-xl font-bold text-foreground tracking-tight">Saved Stations</div>
                          <div className="mt-1 text-sm font-medium text-muted-foreground">
                            {filteredSavedStations.length} saved stations ready for quick access
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 [scrollbar-width:thin] [scrollbar-color:rgba(16,185,129,0.45)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-emerald-500/35 hover:[&::-webkit-scrollbar-thumb]:bg-emerald-500/55">
                          {filteredSavedStations.length > 0 ? (
                            filteredSavedStations.map((station) => (
                              <div
                                key={station.id}
                                className={`cursor-pointer rounded-3xl transition-all ${
                                  selectedStation === station.id ? "ring-2 ring-rose-400" : ""
                                }`}
                              >
                                <StationCard
                                  {...station}
                                  onClick={() => setSelectedStation(station.id)}
                                />
                              </div>
                            ))
                          ) : (
                            <div className="h-full flex items-center justify-center p-6">
                              <EmptyState
                                icon={Heart}
                                title={savedStations.length === 0 ? "No saved stations yet" : "No saved stations match"}
                                description={
                                  savedStations.length === 0
                                    ? "Save stations to keep your go-to locations within easy reach."
                                    : `No saved stations match "${searchQuery}".`
                                }
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute right-4 top-36 lg:hidden z-20">
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
        <div className="absolute left-4 bottom-24 lg:left-6 lg:bottom-12 z-20 pointer-events-none">
          <MapPriceLegend />
        </div>

        {/* Desktop Map Actions */}
        <div
          className={`hidden lg:flex absolute right-6 z-20 flex-col items-center gap-3 ${
            selectedStation && !showList && !isDesktopSidebarExpanded ? "bottom-[24rem]" : "bottom-8"
          }`}
        >
          <button
            onClick={() => handlePreciseLocation(false)}
            className="w-14 h-14 bg-white/96 dark:bg-neutral-900/96 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/15 flex items-center justify-center border border-gray-200/80 dark:border-neutral-700/80 hover:scale-105 transition-transform"
            title="Go to my location"
          >
            <Navigation className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
          </button>
          <div className="flex flex-col overflow-hidden rounded-2xl bg-white/96 dark:bg-neutral-900/96 backdrop-blur-2xl border border-gray-200/80 dark:border-neutral-700/80 shadow-2xl shadow-black/15">
            <button
              onClick={zoomMapIn}
              className="w-14 h-14 flex items-center justify-center text-foreground hover:bg-muted transition-colors border-b border-gray-200/70 dark:border-neutral-700/70"
              title="Zoom in"
            >
              <Plus className="w-6 h-6" strokeWidth={2.5} />
            </button>
            <button
              onClick={zoomMapOut}
              className="w-14 h-14 flex items-center justify-center text-foreground hover:bg-muted transition-colors"
              title="Zoom out"
            >
              <Minus className="w-6 h-6" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Desktop Selected Station Panel */}
        {selectedStation && !showList && !isDesktopSidebarExpanded && (
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
            <div className="space-y-3 overflow-y-auto pb-28 pt-2">
              {isLoadingStations ? (
                Array(4).fill(0).map((_, i) => (
                  <StationCardSkeleton key={i} />
                ))
              ) : (
                filteredStations.map((station) => (
                  <StationCard
                    key={station.id}
                    {...station}
                    prices={Object.entries(station.latest_prices || {}).map(([type, details]) => ({ type, price: details.price }))}
                    onClick={() => {
                      setSelectedStation(station.id);
                      setShowList(false);
                    }}
                  />
                ))
              )}
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
