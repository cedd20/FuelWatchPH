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
import { getUserStations, getDistanceMeters, getStations } from "@/shared/utils/stationStorage";
import { getAvailableCities } from "@/shared/utils/cityUtils";

export function Home() {
  const navigate = useNavigate();
  const [selectedFuelType, setSelectedFuelType] = useState("Diesel");
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(true);

  // Get user location on mount
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
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
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const [stations, setStations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all stations (Simulated API)
  useEffect(() => {
    const fetchStations = async () => {
      setIsLoading(true);
      try {
        // Simulate API Fetch: GET /api/stations
        await new Promise((resolve) => setTimeout(resolve, 800));
        const data = getStations();
        setStations(data);
      } catch (error) {
        console.error("Failed to fetch stations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStations();
  }, []);

  const allStations = stations;

  // Helper to get price
  const getStationPrice = (station, fuelType) => {
    const fuel = station.prices.find((p) => p.type.toLowerCase() === fuelType.toLowerCase());
    return fuel ? fuel.price : undefined;
  };

  // Calculate KPIs
  const kpis = useMemo(() => {
    const prices = allStations
      .map(s => getStationPrice(s, selectedFuelType))
      .filter(p => p !== undefined);
    
    const avg = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const uniqueCities = getAvailableCities(allStations);

    return {
      avg: `₱${avg.toFixed(2)}/L`,
      stations: allStations.length.toLocaleString(),
      areas: uniqueCities.length.toLocaleString()
    };
  }, [allStations, selectedFuelType]);

  // Recommended Stations (Cheapest within 5km)
  const recommendedStations = useMemo(() => {
    if (!userLocation) return allStations.slice(0, 4).map(s => ({
      ...s,
      lowestPrice: getStationPrice(s, selectedFuelType),
      fuelType: selectedFuelType,
      distance: 0
    })).sort((a, b) => a.lowestPrice - b.lowestPrice);

    return allStations
      .map(s => ({
        ...s,
        distance: getDistanceMeters(userLocation.lat, userLocation.lng, s.lat, s.lng) / 1000,
        lowestPrice: getStationPrice(s, selectedFuelType),
        fuelType: selectedFuelType
      }))
      .filter(s => s.distance <= 5 && s.lowestPrice !== undefined) // Only within 5km and has price
      .sort((a, b) => a.lowestPrice - b.lowestPrice) // Sort by cheapest price
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
        .map(s => getStationPrice(s, selectedFuelType))
        .filter(p => p !== undefined);
      const avg = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

      return {
        name: cityName,
        stationCount: cityStations.length,
        avgPrice: `₱${avg.toFixed(2)}/L`
      };
    }).slice(0, 4);
  }, [allStations, selectedFuelType]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-950">
      <div className="lg:hidden relative z-20 px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <Logo size="sm" className="drop-shadow-lg" />
          <button
            onClick={() => navigate("/app/notifications")}
            className="w-11 h-11 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-xl rounded-full flex items-center justify-center relative shadow-xl shadow-black/10 hover:bg-white dark:hover:bg-neutral-700 transition-all hover:scale-110 border border-white/40 dark:border-neutral-700/50"
          >
            <Bell className="w-5 h-5 text-gray-700 dark:text-white" />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/60 ring-2 ring-white" />
          </button>
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

          <button
            onClick={() => navigate("/app/notifications")}
            className="hidden lg:flex absolute top-6 right-6 z-20 w-11 h-11 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-xl rounded-full items-center justify-center shadow-xl shadow-black/20 hover:bg-white dark:hover:bg-neutral-700 transition-all hover:scale-110 border border-white/40 dark:border-neutral-700/50"
          >
            <Bell className="w-5 h-5 text-gray-700 dark:text-white" />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/60 ring-2 ring-white dark:ring-neutral-800" />
          </button>

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
              {cities.map((city) => (
                <CityCard
                  key={city.name}
                  name={city.name}
                  stationCount={city.stationCount}
                  avgPrice={city.avgPrice}
                  fuelType={selectedFuelType}
                  onClick={() => navigate("/app/map")}
                />
              ))}
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
                  <div key={i} className="min-w-[280px] lg:min-w-0 h-48 bg-gray-100 dark:bg-neutral-800 animate-pulse rounded-3xl" />
                ))
              ) : recommendedStations.length > 0 ? (
                recommendedStations.map((station) => (
                  <RecommendedStationCard key={station.id} {...station} />
                ))
              ) : (
                <div className="col-span-full py-10 text-center text-muted-foreground">
                  No stations found near you.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
