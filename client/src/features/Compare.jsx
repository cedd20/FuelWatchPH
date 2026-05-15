import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeftRight, 
  TrendingDown, 
  MapPin, 
  Map as MapIcon, 
  SearchX, 
  Loader2,
  ChevronRight,
  Filter
} from "lucide-react";

// Utilities & Hooks
import { useStations } from "@/hooks/useStations";
import { getAvailableCities } from "@/shared/utils/cityUtils";
import { findCanonicalCityName, normalizeCityName, resolveCityFromCoordinates } from "@/shared/utils/location";
import { getBrandLogo } from "@/shared/utils/brandMapping";
import { isValidPrice, formatPrice } from "@/shared/utils/priceUtils";
import { FUEL_TYPES } from "@/shared/utils/fuelTypes";

// UI Components
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";

const fuelTypes = FUEL_TYPES;
const DEFAULT_FALLBACK_CITY = "Quezon City";

export function Compare() {
  const navigate = useNavigate();
  const [selectedFuelType, setSelectedFuelType] = useState("UL91");
  const [selectedCity, setSelectedCity] = useState("");
  const [detectedCity, setDetectedCity] = useState("");
  const [citySelectionMode, setCitySelectionMode] = useState("auto");
  const [userCoords, setUserCoords] = useState(null);
  const [isDetectingCity, setIsDetectingCity] = useState(true);
  const [locationError, setLocationError] = useState("");

  const { data: allStations = [], isLoading } = useStations();

  const cities = useMemo(() => getAvailableCities(allStations), [allStations]);

  const fallbackCity = useMemo(() => {
    if (cities.includes(DEFAULT_FALLBACK_CITY)) return DEFAULT_FALLBACK_CITY;
    return cities[0] || DEFAULT_FALLBACK_CITY;
  }, [cities]);

  const selectableCities = useMemo(() => {
    const mergedCities = selectedCity ? [selectedCity, ...cities] : cities;
    return [...new Set(mergedCities)];
  }, [cities, selectedCity]);

  // City Detection Logic
  useEffect(() => {
    if (selectedCity) return;
    if (detectedCity) {
      setSelectedCity(detectedCity);
      return;
    }
    if (!isDetectingCity && fallbackCity) {
      setSelectedCity(fallbackCity);
    }
  }, [detectedCity, fallbackCity, isDetectingCity, selectedCity]);

  useEffect(() => {
    if (!selectedCity) return;
    const cityStillAvailable = selectableCities.some(
      (city) => normalizeCityName(city) === normalizeCityName(selectedCity),
    );
    if (!cityStillAvailable) {
      setSelectedCity(detectedCity || fallbackCity);
    }
  }, [detectedCity, fallbackCity, selectableCities, selectedCity]);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setIsDetectingCity(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationError("");
      },
      () => {
        setIsDetectingCity(false);
        setSelectedCity((currentCity) => currentCity || fallbackCity);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60_000 },
    );
  }, [fallbackCity]);

  useEffect(() => {
    if (!userCoords) return;
    let cancelled = false;
    async function detectCity() {
      setIsDetectingCity(true);
      try {
        const result = await resolveCityFromCoordinates(userCoords.lat, userCoords.lng, cities);
        if (cancelled) return;
        const nextDetectedCity = findCanonicalCityName(result.city, cities) || fallbackCity;
        setDetectedCity(nextDetectedCity);
        if (citySelectionMode === "auto") setSelectedCity(nextDetectedCity);
      } catch (error) {
        if (cancelled) return;
        if (citySelectionMode === "auto") setSelectedCity((currentCity) => currentCity || fallbackCity);
      } finally {
        if (!cancelled) setIsDetectingCity(false);
      }
    }
    detectCity();
    return () => { cancelled = true; };
  }, [cities, citySelectionMode, fallbackCity, userCoords]);

  const handleCityChange = (city) => {
    setCitySelectionMode("manual");
    setSelectedCity(city);
  };

  const getStationPrice = (station, fuelType) => {
    const priceEntry = station.latest_prices?.[fuelType];
    const price = priceEntry?.price;
    return isValidPrice(price) ? Number(price) : null;
  };

  const sortedStations = useMemo(() => {
    return allStations
      .filter(
        (station) =>
          normalizeCityName(station.city) === normalizeCityName(selectedCity) &&
          getStationPrice(station, selectedFuelType) !== null,
      )
      .sort((a, b) => (getStationPrice(a, selectedFuelType) || 0) - (getStationPrice(b, selectedFuelType) || 0));
  }, [allStations, selectedCity, selectedFuelType]);

  const hasStations = sortedStations.length > 0;
  
  const { lowestPrice, averagePrice } = useMemo(() => {
    if (!hasStations) return { lowestPrice: 0, averagePrice: 0 };
    const prices = sortedStations.map(s => getStationPrice(s, selectedFuelType)).filter(p => p !== null);
    if (prices.length === 0) return { lowestPrice: 0, averagePrice: 0 };
    return { 
      lowestPrice: Math.min(...prices), 
      averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length 
    };
  }, [sortedStations, selectedFuelType]);

  const potentialSavings = (averagePrice - lowestPrice) * 40;
  const activeCityLabel = selectedCity || detectedCity || (isDetectingCity ? "your area" : fallbackCity);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050A09] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-emerald-500/60 font-bold animate-pulse">Analyzing prices...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050A09] text-white pb-24 overflow-x-hidden">
      <div className="max-w-md mx-auto px-5 pt-8 space-y-6">
        
        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <div className="flex items-center gap-3">
             <div className="p-2 bg-emerald-500/10 rounded-xl">
               <ArrowLeftRight className="w-6 h-6 text-emerald-400" />
             </div>
             <h1 className="text-2xl font-bold tracking-tight">Compare Prices</h1>
          </div>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest pl-1">
            Find the best deals in <span className="text-white">{activeCityLabel}</span>
          </p>
        </motion.div>

        {/* Location & Fuel Filter Bar */}
        <Card className="bg-[#0C1A17] border-emerald-500/10 rounded-[2rem] overflow-visible">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                <select
                  value={selectedCity}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="w-full bg-[#1A2E2A] text-white text-sm font-bold pl-10 pr-4 py-3 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
                >
                  {selectableCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-2xl">
                <Filter className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {fuelTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedFuelType(type)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap border-2 ${
                    selectedFuelType === type
                      ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                      : "bg-[#1A2E2A] border-transparent text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comparison Dashboard */}
        {!hasStations ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-4"
          >
            <SearchX className="w-16 h-16 text-gray-700" />
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-gray-300">No Prices Found</h3>
              <p className="text-sm text-gray-500 max-w-[250px]">We couldn't find any {selectedFuelType} prices in this area yet.</p>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              key={`${selectedCity}-${selectedFuelType}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Savings Highlight */}
              <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-green-700 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-white/20 text-white border-none font-black text-[10px] px-3 py-1">
                      BEST DEAL IN CITY
                    </Badge>
                    <TrendingDown className="w-5 h-5 text-white/60" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-5xl font-black tracking-tighter text-white">
                      {formatPrice(lowestPrice)}
                    </div>
                    <div className="text-xs font-bold text-emerald-100 uppercase tracking-widest opacity-80">
                      Lowest price per liter
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <div className="text-[10px] font-bold text-white/60">
                      Potential Savings (40L Tank): <span className="text-white">₱{potentialSavings.toFixed(2)}</span>
                    </div>
                    <button 
                      onClick={() => navigate(`/app/station/${sortedStations[0].id}`)}
                      className="bg-white text-emerald-700 text-xs font-black px-4 py-2 rounded-full shadow-lg"
                    >
                      GO NOW
                    </button>
                  </div>
                </div>
              </div>

              {/* Station List */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] px-2">Price Breakdown</h3>
                <div className="space-y-3">
                  {sortedStations.map((station, idx) => {
                    const price = getStationPrice(station, selectedFuelType);
                    const isLowest = idx === 0;
                    const priceDiff = price - lowestPrice;

                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={station.id}
                        onClick={() => navigate(`/app/station/${station.id}`)}
                        className={`bg-[#0C1A17] border rounded-[2rem] p-5 flex items-center gap-4 group cursor-pointer active:scale-95 transition-all ${
                          isLowest ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-emerald-500/5'
                        }`}
                      >
                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center p-2.5 shadow-xl shrink-0">
                          <img 
                            src={getBrandLogo(station.brand || station.name)} 
                            className="w-full h-full object-contain" 
                            alt={station.name}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-sm truncate">{station.name}</h4>
                            {isLowest && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{station.address}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-black text-lg tracking-tighter ${isLowest ? 'text-emerald-400' : 'text-white'}`}>
                            {formatPrice(price)}
                          </div>
                          {priceDiff > 0 && (
                            <div className="text-[9px] font-black text-rose-500/80">
                              +₱{priceDiff.toFixed(2)}
                            </div>
                          )}
                          {isLowest && (
                            <div className="text-[9px] font-black text-emerald-500/60 uppercase">
                              Best
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-emerald-500 transition-colors" />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Coverage Insight */}
        <div className="bg-[#0C1A17] rounded-[2rem] p-6 border border-emerald-500/10 text-center">
           <TrendingDown className="w-8 h-8 text-emerald-500/20 mx-auto mb-3" />
           <p className="text-[11px] text-gray-500 font-bold leading-relaxed">
             Prices are community-verified. Always check for the "Verified" badge on station details for the most accurate and recent data.
           </p>
        </div>
      </div>
    </div>
  );
}
