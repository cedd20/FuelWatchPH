import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { Search, MapPin, Plus, Bell, Fuel, Building2, Map, TrendingUp, ChevronRight, Loader2 } from "lucide-react";
import { FuelTypeChip } from "@/shared/components/FuelTypeChip";
import { ImprovedKPICard } from "@/shared/components/ImprovedKPICard";
import { QuickActionButton } from "@/shared/components/QuickActionButton";
import { CityCard } from "@/shared/components/CityCard";
import { RecommendedStationCard } from "@/shared/components/RecommendedStationCard";
import { Logo } from "@/shared/components/Logo";
import { FUEL_TYPES } from "@/shared/utils/fuelTypes";
import { useStations } from "@/hooks/useStations";
import { getAvailableCities } from "@/shared/utils/cityUtils";
import { PHILIPPINE_CITIES } from "@/shared/utils/philippineCities";
import { useAuth } from "@/app/providers/AuthContext";
import { isValidPrice, formatPriceWithUnit } from "@/shared/utils/priceUtils";
import { StationCardSkeleton, Skeleton } from "@/shared/components/Skeleton";

const FALLBACK_LOCATION = PHILIPPINE_CITIES.find((city) => city.city === "Manila") || {
  lat: 14.5995,
  lng: 120.9842,
};

export function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedFuelType, setSelectedFuelType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(true);

  // Get user location on mount
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setIsLocating(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      (error) => {
        console.error("Location error:", error.code, error.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60_000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const { data: allStations = [], isLoading: stationsLoading } = useStations();
  const isLoading = stationsLoading || isLocating;

  // Helper to get price
  const getValidPrice = (value) => {
    return isValidPrice(value) ? Number(value) : null;
  };

  const getStationPrice = (station, fuelType) => {
    if (fuelType === "All") {
      const prices = Object.values(station.latest_prices || {})
        .map((p) => getValidPrice(p?.price))
        .filter((price) => price !== null);
      return prices.length > 0 ? Math.min(...prices) : undefined;
    }
    return getValidPrice(station.latest_prices?.[fuelType]?.price) ?? undefined;
  };

  // Distance helper (Haversine simplified for this usage)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getCityReferenceDistance = (cityName) => {
    const matchingCities = PHILIPPINE_CITIES.filter((city) => city.city === cityName);

    if (matchingCities.length === 0) return null;

    const referenceLocation = userLocation || FALLBACK_LOCATION;

    return Math.min(
      ...matchingCities.map((city) =>
        getDistance(referenceLocation.lat, referenceLocation.lng, city.lat, city.lng)
      )
    );
  };

  // Calculate KPIs
  const kpis = useMemo(() => {
    let prices = [];
    
    if (selectedFuelType === "All") {
      // For "All", average every single price report from every station
      allStations.forEach(s => {
        Object.values(s.latest_prices || {}).forEach(p => {
          if (isValidPrice(p.price)) prices.push(Number(p.price));
        });
      });
    } else {
      // For specific fuel types, use the helper
      prices = allStations
        .map(s => getStationPrice(s, selectedFuelType))
        .filter(p => p !== undefined && p !== null);
    }
    
    const avg = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null;
    const uniqueCities = getAvailableCities(allStations);

    return {
      avg: formatPriceWithUnit(avg),
      stations: allStations.length.toLocaleString(),
      areas: uniqueCities.length.toLocaleString()
    };
  }, [allStations, selectedFuelType]);

  // Recommended Stations (Cheapest within 20km)
  const recommendedStations = useMemo(() => {
    const referenceLocation = userLocation || FALLBACK_LOCATION;

    const stationsWithPrices = allStations
      .map(s => ({
        ...s,
        distance: Number.isFinite(Number(s.lat)) && Number.isFinite(Number(s.lng))
          ? getDistance(referenceLocation.lat, referenceLocation.lng, Number(s.lat), Number(s.lng))
          : null,
        lowestPrice: getStationPrice(s, selectedFuelType),
        fuelType: selectedFuelType
      }))
      .filter(s => s.lowestPrice !== undefined && s.lowestPrice !== null);

    return stationsWithPrices
      .sort((a, b) => {
        if (a.distance === null && b.distance === null) return (a.lowestPrice || 0) - (b.lowestPrice || 0);
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        if (a.distance !== b.distance) return a.distance - b.distance;
        return a.lowestPrice - b.lowestPrice;
      })
      .slice(0, 4);
  }, [allStations, userLocation, selectedFuelType]);

  // Search functionality
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allStations
      .filter(s => 
        (s.name?.toLowerCase() || "").includes(query) || 
        (s.city?.toLowerCase() || "").includes(query) || 
        (s.address?.toLowerCase() || "").includes(query)
      )
      .slice(0, 5);
  }, [searchQuery, allStations]);

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/app/map?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Cities Data
  const cities = useMemo(() => {
    const cityList = getAvailableCities(allStations);
    return cityList.map(cityName => {
      const cityStations = allStations.filter(s => s.city === cityName);
      const prices = cityStations
        .map((s) => getStationPrice(s, selectedFuelType))
        .filter((price) => price !== undefined);
      const avg = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null;
      const distance = getCityReferenceDistance(cityName);

      return {
        name: cityName,
        stationCount: cityStations.length,
        avgPrice: formatPriceWithUnit(avg),
        distance: distance ?? Number.POSITIVE_INFINITY,
      };
    })
    .filter((city) => city.stationCount > 0)
    .sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      return b.stationCount - a.stationCount;
    })
    .slice(0, 4);
  }, [allStations, selectedFuelType, userLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-950">
      <div className="lg:hidden relative z-20 px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <Logo size="sm" className="drop-shadow-lg" />
        </div>
      </div>

      <div className="px-4 lg:px-8 lg:pt-6 pb-6 lg:pb-8 relative z-30">
        <div className="max-w-6xl mx-auto relative rounded-3xl shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all">
          {/* Background Layer (Contained) */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700" />
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

            <div className="absolute inset-0 opacity-60">
              <img
                src="https://images.unsplash.com/photo-1710172510070-9c130a9a310a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
                alt="Gas Station"
                className="w-full h-full object-cover"
                style={{
                  maskImage: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.2) 100%)',
                  WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.2) 100%)',
                }}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          </div>


          <div className="relative z-10 px-6 lg:px-12 py-8 lg:py-12 flex flex-col items-center text-center space-y-5 lg:space-y-6">
            <h1 className="text-4xl lg:text-5xl font-bold text-white drop-shadow-2xl tracking-tight">
              FuelWatch PH
            </h1>

            <div className="flex items-center gap-2 text-white/95">
              <MapPin className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="text-sm lg:text-base font-medium drop-shadow-lg">Philippines</span>
            </div>

            <div className="relative w-full lg:max-w-2xl group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-gray-500 z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchSubmit}
                placeholder="Search stations or locations"
                className="w-full pl-11 lg:pl-12 pr-4 py-2.5 lg:py-3.5 bg-white backdrop-blur-lg rounded-full border-2 border-white/60 focus:outline-none focus:ring-2 focus:ring-white/80 shadow-xl shadow-black/20 focus:shadow-2xl focus:shadow-white/30 transition-all placeholder:text-gray-500 text-sm lg:text-base font-medium"
              />

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 dark:border-neutral-800 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="p-2">
                    {searchResults.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => navigate(`/app/station/${s.id}`)}
                        className="w-full flex items-center gap-4 p-4 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-2xl transition-all text-left group/item"
                      >
                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform">
                          <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-foreground truncate">{s.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{s.address}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      </button>
                    ))}
                    <button
                      onClick={() => navigate(`/app/map?search=${encodeURIComponent(searchQuery)}`)}
                      className="w-full p-4 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-2xl transition-all border-t border-gray-100 dark:border-neutral-800 mt-1"
                    >
                      View all results on map
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="absolute inset-0 border border-white/20 rounded-3xl pointer-events-none" />
        </div>
      </div>

      <div className="px-4 lg:px-8 py-8 lg:py-10 space-y-8 lg:space-y-10">
        <div className="max-w-6xl mx-auto space-y-8 lg:space-y-10">
          <div>
            <h3 className="text-base lg:text-lg font-bold text-foreground mb-4 lg:mb-5 tracking-tight">Select Fuel Type</h3>
            <div className="flex gap-2.5 overflow-x-auto lg:overflow-x-visible pb-2 scrollbar-hide lg:flex-wrap">
              {FUEL_TYPES.map((type) => (
                <FuelTypeChip
                  key={type}
                  label={type}
                  active={selectedFuelType === type}
                  onClick={() => setSelectedFuelType(type)}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide lg:overflow-x-visible lg:grid lg:grid-cols-3 lg:gap-4">
            <ImprovedKPICard
              title={`${selectedFuelType} Avg`}
              value={kpis.avg}
              subtitle="Current avg in system"
              icon={Fuel}
              iconColor="text-warning"
              isLoading={isLoading}
            />
            <ImprovedKPICard
              title="Stations"
              value={kpis.stations}
              subtitle="Community listed"
              icon={Building2}
              iconColor="text-accent"
              isLoading={isLoading}
            />
            <ImprovedKPICard
              title="Areas"
              value={kpis.areas}
              subtitle="Cities covered"
              icon={Map}
              iconColor="text-success"
              isLoading={isLoading}
            />
          </div>

          <div className="flex gap-4 lg:max-w-md">
            <QuickActionButton
              label="Add Station"
              icon={Plus}
              onClick={() => navigate("/app/add-station")}
              variant="primary"
            />
            <QuickActionButton
              label="My Updates"
              icon={TrendingUp}
              onClick={() => navigate("/app/contributions")}
              variant="secondary"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4 lg:mb-5">
              <h3 className="text-lg font-bold text-foreground">Browse by City</h3>
              <button
                onClick={() => navigate("/app/map")}
                className="hidden lg:flex text-sm font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 bg-clip-text text-transparent items-center gap-1 hover:gap-2 transition-all"
              >
                View all
                <ChevronRight className="w-4 h-4 text-emerald-600" />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide lg:overflow-x-visible lg:grid lg:grid-cols-4 lg:gap-4">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="min-w-[160px] lg:min-w-0 h-32 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 space-y-3">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))
              ) : (
                cities.map((city) => (
                  <CityCard
                    key={city.name}
                    name={city.name}
                    stationCount={city.stationCount}
                    avgPrice={city.avgPrice}
                    fuelType={selectedFuelType}
                    onClick={() => navigate("/app/map")}
                  />
                ))
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Recommended for You</h3>
              <button
                onClick={() => navigate("/app/map")}
                className="text-sm lg:text-base font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 bg-clip-text text-transparent flex items-center gap-1 hover:gap-2 transition-all"
              >
                View all
                <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600" />
              </button>
            </div>
            <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 lg:overflow-x-visible lg:grid lg:grid-cols-4 lg:gap-4 lg:mx-0 lg:px-0">
              {isLocating || isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <StationCardSkeleton key={i} className="min-w-[280px] lg:min-w-0" />
                ))
              ) : recommendedStations.length > 0 ? (
                recommendedStations.map((station) => (
                  <RecommendedStationCard key={station.id} {...station} />
                ))
              ) : (
                <div className="col-span-full py-10 text-center text-muted-foreground">
                  No fuel prices reported yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
