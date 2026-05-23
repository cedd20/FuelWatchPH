import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeftRight, 
  TrendingDown, 
  MapPin, 
  Map as MapIcon, 
  SearchX, 
  Loader2,
  ChevronDown,
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
  const [, setLocationError] = useState("");

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
      } catch {
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
  }, [hasStations, sortedStations, selectedFuelType]);

  const potentialSavings = (averagePrice - lowestPrice) * 40;
  const activeCityLabel = selectedCity || detectedCity || (isDetectingCity ? "your area" : fallbackCity);

  if (isLoading) {
    return (
      <div className="app-shell min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-emerald-500/60 font-bold animate-pulse">Analyzing prices...</p>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen overflow-x-hidden pb-24 text-foreground">
      <div className="mx-auto max-w-md space-y-6 px-5 pt-8 md:max-w-3xl md:px-6 lg:max-w-[1280px] lg:space-y-5 lg:px-8 xl:px-10">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1 lg:max-w-3xl lg:space-y-2"
        >
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="rounded-xl bg-emerald-500/10 p-2 lg:rounded-2xl lg:p-3">
              <ArrowLeftRight className="h-6 w-6 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight lg:text-4xl">Compare Prices</h1>
          </div>
          <p className="pl-1 text-xs font-bold uppercase tracking-widest text-muted-foreground lg:pl-0 lg:text-sm lg:tracking-[0.28em]">
            Find the best deals in <span className="text-foreground">{activeCityLabel}</span>
          </p>
        </motion.div>

        <div className="space-y-6 lg:hidden">
          {/* Location & Fuel Filter Bar */}
          <Card className="app-panel overflow-visible rounded-[2rem] border-emerald-500/10">
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                  <select
                    value={selectedCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="app-input w-full appearance-none rounded-2xl border-none py-3 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/50"
                  >
                    {selectableCities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <Filter className="h-5 w-5 text-emerald-400" />
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {fuelTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedFuelType(type)}
                    className={`whitespace-nowrap rounded-xl border-2 px-4 py-2 text-xs font-black transition-all ${
                      selectedFuelType === type
                        ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                        : "app-panel-muted border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {!hasStations ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center space-y-4 py-20 text-center"
            >
              <SearchX className="h-16 w-16 text-muted-foreground/60" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">No Prices Found</h3>
                <p className="max-w-[250px] text-sm text-muted-foreground">
                  We couldn't find any {selectedFuelType} prices in this area yet.
                </p>
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
                <div className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-500 via-teal-600 to-green-700 p-6 shadow-2xl">
                  <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <Badge className="border-none bg-white/20 px-3 py-1 text-[10px] font-black text-white">
                        BEST DEAL IN CITY
                      </Badge>
                      <TrendingDown className="h-5 w-5 text-white/60" />
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="text-5xl font-black tracking-tighter text-white">
                          {formatPrice(lowestPrice)}
                        </div>
                        <div className="text-xs font-bold uppercase tracking-widest text-emerald-100 opacity-80">
                          Lowest price per liter
                        </div>
                      </div>
                      <div className="grid gap-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-[1.2rem] border border-white/10 bg-white/10 p-2.5 backdrop-blur">
                            <div className="text-[9px] font-black uppercase tracking-[0.22em] text-white/65">
                              Savings
                            </div>
                            <div className="mt-1 text-base font-black text-white">
                              ₱{potentialSavings.toFixed(2)}
                            </div>
                            <div className="text-[10px] font-bold text-white/65">on a 40L tank</div>
                          </div>
                          <div className="rounded-[1.2rem] border border-white/10 bg-white/10 p-2.5 backdrop-blur">
                            <div className="text-[9px] font-black uppercase tracking-[0.22em] text-white/65">
                              Compared
                            </div>
                            <div className="mt-1 text-base font-black text-white">
                              {formatPrice(averagePrice)}
                            </div>
                            <div className="text-[10px] font-bold text-white/65">city average</div>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/app/station/${sortedStations[0].id}`)}
                          className="rounded-full bg-white px-4 py-2 text-xs font-black text-emerald-700 shadow-lg"
                        >
                          GO NOW
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-3 px-2">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Price Breakdown</h3>
                  </div>
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
                          className={`app-panel group flex cursor-pointer items-center gap-4 rounded-[2rem] border p-5 transition-all active:scale-95 ${
                            isLowest ? "border-emerald-500/40 bg-emerald-500/5" : "border-emerald-500/5"
                          }`}
                        >
                          <div className="h-14 w-14 shrink-0 rounded-full bg-white p-2.5 shadow-xl">
                            <img
                              src={getBrandLogo(station.brand || station.name)}
                              className="h-full w-full object-contain"
                              alt={station.name}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <h4 className="truncate text-sm font-bold">{station.name}</h4>
                              {isLowest && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{station.address}</span>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className={`text-lg font-black tracking-tighter ${isLowest ? "text-emerald-400" : "text-foreground"}`}>
                              {formatPrice(price)}
                            </div>
                            {priceDiff > 0 && (
                              <div className="text-[9px] font-black text-rose-500/80">
                                +₱{priceDiff.toFixed(2)}
                              </div>
                            )}
                            {isLowest && (
                              <div className="text-[9px] font-black uppercase text-emerald-500/60">
                                Best
                              </div>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-emerald-500" />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          <div className="app-panel rounded-[2rem] border border-emerald-500/10 p-6 text-center">
            <TrendingDown className="mx-auto mb-3 h-8 w-8 text-emerald-500/20" />
            <p className="text-[11px] font-bold leading-relaxed text-muted-foreground">
              Prices are community-verified. Always check for the "Verified" badge on station details for the most accurate and recent data.
            </p>
          </div>
        </div>

        <div className="hidden lg:grid lg:grid-cols-[minmax(0,1.24fr)_minmax(320px,380px)] lg:items-start lg:gap-5">
          <div className="space-y-4">
            <Card className="app-panel overflow-visible rounded-[2.1rem] border-emerald-500/15 shadow-2xl">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-end gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 pl-1 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-400">
                      Location
                    </div>
                    <div className="app-panel-muted relative rounded-[1.35rem] border border-emerald-500/25 bg-emerald-500/10 shadow-[0_12px_32px_rgba(16,185,129,0.1)]">
                      <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
                      <select
                        value={selectedCity}
                        onChange={(e) => handleCityChange(e.target.value)}
                        className="h-[54px] w-full appearance-none rounded-[1.35rem] bg-transparent py-3 pl-11 pr-12 text-[15px] font-black text-foreground outline-none"
                      >
                        {selectableCities.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
                    </div>
                  </div>
                  <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[1.35rem] bg-emerald-500/10">
                    <Filter className="h-5 w-5 text-emerald-400" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {fuelTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedFuelType(type)}
                      className={`min-w-[72px] whitespace-nowrap rounded-2xl border-2 px-4 py-2 text-[10px] font-black transition-all ${
                        selectedFuelType === type
                          ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                          : "app-panel-muted border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {!hasStations ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex min-h-[320px] flex-col items-center justify-center space-y-4 py-16 text-center"
              >
                <SearchX className="h-16 w-16 text-muted-foreground/60" />
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">No Prices Found</h3>
                  <p className="max-w-[250px] text-sm text-muted-foreground">
                    We couldn't find any {selectedFuelType} prices in this area yet.
                  </p>
                </div>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`desktop-${selectedCity}-${selectedFuelType}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between gap-3 px-2">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Price Breakdown</h3>
                    <div className="flex items-center gap-2 rounded-full border border-emerald-500/10 bg-emerald-500/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-400">
                      <MapIcon className="h-3.5 w-3.5" />
                      {sortedStations.length} stations compared
                    </div>
                  </div>
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
                          key={`desktop-${station.id}`}
                          onClick={() => navigate(`/app/station/${station.id}`)}
                          className={`app-panel group flex min-h-[104px] cursor-pointer items-center gap-4 rounded-[2.05rem] border px-5 py-4 transition-all active:scale-95 ${
                            isLowest ? "border-emerald-500/40 bg-emerald-500/5" : "border-emerald-500/5"
                          }`}
                        >
                          <div className="h-[58px] w-[58px] shrink-0 rounded-full bg-white p-2.5 shadow-xl">
                            <img
                              src={getBrandLogo(station.brand || station.name)}
                              className="h-full w-full object-contain"
                              alt={station.name}
                            />
                          </div>
                          <div className="flex min-w-0 flex-1 items-center justify-between gap-5">
                            <div className="min-w-0">
                              <div className="mb-1 flex items-center gap-2">
                                <h4 className="truncate text-base font-bold">{station.name}</h4>
                                {isLowest && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{station.address}</span>
                              </div>
                            </div>
                            <div className="hidden shrink-0 items-center gap-2 rounded-full border border-emerald-500/10 bg-emerald-500/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground xl:flex">
                              {selectedFuelType}
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className={`text-[1.7rem] font-black tracking-tighter ${isLowest ? "text-emerald-400" : "text-foreground"}`}>
                              {formatPrice(price)}
                            </div>
                            {priceDiff > 0 && (
                              <div className="text-[10px] font-black text-rose-500/80">
                                +₱{priceDiff.toFixed(2)}
                              </div>
                            )}
                            {isLowest && (
                              <div className="text-[10px] font-black uppercase text-emerald-500/60">
                                Best
                              </div>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-emerald-500" />
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          <div className="space-y-3.5">
            {hasStations && (
              <motion.div
                key={`desktop-summary-${selectedCity}-${selectedFuelType}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="group relative overflow-hidden rounded-[2.35rem] bg-gradient-to-br from-emerald-500 via-teal-600 to-green-700 p-5 shadow-2xl"
              >
                <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
                <div className="relative z-10 space-y-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <Badge className="border-none bg-white/20 px-4 py-1 text-[11px] font-black text-white">
                      BEST DEAL IN CITY
                    </Badge>
                    <TrendingDown className="h-5 w-5 text-white/60" />
                  </div>
                  <div className="space-y-3.5">
                    <div className="space-y-1.5">
                      <div className="text-[3.15rem] font-black tracking-tighter text-white">
                        {formatPrice(lowestPrice)}
                      </div>
                      <div className="text-[11px] font-bold uppercase tracking-widest text-emerald-100 opacity-80">
                        Lowest price per liter
                      </div>
                    </div>
                    <div className="grid gap-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-[1.2rem] border border-white/10 bg-white/10 p-2.5 backdrop-blur">
                          <div className="text-[9px] font-black uppercase tracking-[0.22em] text-white/65">
                            Savings
                          </div>
                          <div className="mt-1 text-base font-black text-white">
                            ₱{potentialSavings.toFixed(2)}
                          </div>
                          <div className="text-[10px] font-bold text-white/65">on a 40L tank</div>
                        </div>
                        <div className="rounded-[1.2rem] border border-white/10 bg-white/10 p-2.5 backdrop-blur">
                          <div className="text-[9px] font-black uppercase tracking-[0.22em] text-white/65">
                            Compared
                          </div>
                          <div className="mt-1 text-base font-black text-white">
                            {formatPrice(averagePrice)}
                          </div>
                          <div className="text-[10px] font-bold text-white/65">city average</div>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/app/station/${sortedStations[0].id}`)}
                        className="w-full rounded-full bg-white px-5 py-2.5 text-xs font-black text-emerald-700 shadow-lg"
                      >
                        GO NOW
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="app-panel rounded-[2.1rem] border border-emerald-500/10 p-5 text-left">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <TrendingDown className="h-8 w-8 text-emerald-500/20" />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-400/80">
                    Community Verified
                  </p>
                  <p className="text-sm font-bold leading-relaxed text-muted-foreground">
                    Prices are community-verified. Always check for the "Verified" badge on station details for the most accurate and recent data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
