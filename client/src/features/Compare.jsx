import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { ArrowLeftRight, TrendingDown, MapPin, Map as MapIcon, SearchX, Loader2 } from "lucide-react";
import { FuelTypeChip } from "@/shared/components/FuelTypeChip";
import { FUEL_TYPES } from "@/shared/utils/fuelTypes";
import { useStations } from "@/hooks/useStations";
import { getAvailableCities } from "@/shared/utils/cityUtils";
import { StationLogo } from "@/shared/components/StationLogo";

const fuelTypes = FUEL_TYPES;

export function Compare() {
  const navigate = useNavigate();
  const [selectedFuelType, setSelectedFuelType] = useState("Unleaded 91");
  
  const { data: allStations = [], isLoading } = useStations();
  
  const cities = useMemo(() => {
    return getAvailableCities(allStations);
  }, [allStations]);

  const [selectedCity, setSelectedCity] = useState("Quezon City");

  // Sync selected city if it's not in the list anymore or if we just loaded
  useMemo(() => {
    if (cities.length > 0 && !cities.includes(selectedCity)) {
      setSelectedCity(cities[0]);
    }
  }, [cities, selectedCity]);

  const getStationPrice = (station, fuelType) => {
    const priceEntry = station.latest_prices?.[fuelType];
    return priceEntry?.price;
  };

  const getSortedStations = () => {
    return allStations
      .filter((station) => station.city === selectedCity && getStationPrice(station, selectedFuelType) !== undefined)
      .sort((a, b) => getStationPrice(a, selectedFuelType) - getStationPrice(b, selectedFuelType));
  };

  const sortedStations = getSortedStations();
  const hasStations = sortedStations.length > 0;
  
  const { lowestPrice, highestPrice, averagePrice } = useMemo(() => {
    if (!hasStations) return { lowestPrice: 0, highestPrice: 0, averagePrice: 0 };
    
    const prices = sortedStations.map(s => getStationPrice(s, selectedFuelType));
    const lowest = Math.min(...prices);
    const highest = Math.max(...prices);
    const average = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    return { lowestPrice: lowest, highestPrice: highest, averagePrice: average };
  }, [sortedStations, selectedFuelType]);

  const potentialSavingsPerLiter = averagePrice - lowestPrice;
  const maxSavingsPerLiter = highestPrice - lowestPrice;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-950 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-14 pb-10 px-4 lg:px-8 relative overflow-hidden z-20">
        {/* Enhanced radial glow background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl" />

        <div className="relative z-30 max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg">
                <ArrowLeftRight className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white drop-shadow-2xl tracking-tight">Compare Prices</h1>
            </div>
            <p className="text-white/95 text-sm lg:text-base font-medium drop-shadow-lg pl-1">
              Comparing <span className="font-bold">{selectedFuelType}</span> prices in <span className="font-bold">{selectedCity}</span>
            </p>
          </div>

          {/* City Selector */}
          <div className="relative z-40 mb-2 md:mb-0">
            <label className="block text-white/90 text-xs font-bold mb-1.5 uppercase tracking-wider pl-1">
              Location
            </label>
            <div className="relative">
              <MapIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-700" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full md:w-64 appearance-none pl-10 pr-10 py-3 bg-white text-emerald-900 rounded-xl border-none focus:ring-4 focus:ring-white/30 shadow-xl font-bold text-sm cursor-pointer"
              >
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-emerald-700"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fuel Type Selection */}
      <div className="px-4 lg:px-8 py-5 lg:py-6 bg-white dark:bg-neutral-900 backdrop-blur-2xl border-b-2 border-gray-200 dark:border-neutral-700 sticky top-0 lg:static z-40 shadow-lg lg:shadow-none">
        <div className="max-w-6xl lg:mx-auto flex gap-2.5 overflow-x-auto lg:overflow-x-visible scrollbar-hide pb-1 lg:flex-wrap">
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

      {/* Main Content */}
      <div className="px-4 lg:px-8 py-6 lg:py-10">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
              <p className="text-muted-foreground font-medium">Comparing prices...</p>
            </div>
          ) : !hasStations ? (
            // Empty State
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-neutral-800 p-12 flex flex-col items-center justify-center text-center shadow-xl shadow-black/5">
              <div className="w-20 h-20 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                <SearchX className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2 tracking-tight">No Stations Found</h3>
              <p className="text-muted-foreground font-medium max-w-md">
                We couldn't find any gasoline stations offering {selectedFuelType} in {selectedCity}. Try selecting a different location or fuel type.
              </p>
            </div>
          ) : (
            <div className="lg:grid lg:grid-cols-3 lg:gap-6">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                {/* Best Price Banner */}
                <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-3xl p-6 lg:p-8 text-white shadow-2xl shadow-teal-500/25 overflow-hidden">
                  {/* Enhanced glow effects */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/12 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-300/15 rounded-full blur-2xl" />
                  <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-teal-200/10 rounded-full blur-3xl" />

                  {/* Glass overlay */}
                  <div className="absolute inset-0 bg-white/[0.08] backdrop-blur-[1px]" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-2.5 mb-4 lg:mb-5">
                      <div className="w-9 h-9 lg:w-10 lg:h-10 bg-white/25 backdrop-blur-lg rounded-xl flex items-center justify-center shadow-lg border border-white/30">
                        <TrendingDown className="w-5 h-5 lg:w-6 lg:h-6" strokeWidth={2.5} />
                      </div>
                      <span className="font-bold text-sm lg:text-base tracking-wider uppercase">Lowest Price in City</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="flex-1">
                        <div className="text-5xl lg:text-6xl font-bold mb-3 lg:mb-4 drop-shadow-2xl tracking-tighter">
                          ₱{lowestPrice.toFixed(2)}
                        </div>
                        <div className="text-base lg:text-lg font-bold opacity-95 mb-1.5">{sortedStations[0].name}</div>
                        <div className="text-sm lg:text-base opacity-90 flex items-center gap-1.5 font-medium">
                          <MapPin className="w-4 h-4 lg:w-5 lg:h-5" />
                          {sortedStations[0].address} in {sortedStations[0].city}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/app/station/${sortedStations[0].id}`)}
                        className="px-6 py-3 lg:px-7 lg:py-3.5 bg-white backdrop-blur-md text-teal-700 rounded-full font-bold text-sm lg:text-base shadow-2xl shadow-black/30 hover:shadow-2xl hover:scale-110 transition-all border-2 border-white/60"
                      >
                        View
                      </button>
                    </div>
                  </div>

                  {/* Subtle edge glow */}
                  <div className="absolute inset-0 border border-white/25 rounded-3xl pointer-events-none" />
                </div>

                {/* Comparison List */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-foreground text-lg lg:text-xl tracking-tight">
                      Other Stations
                    </h3>
                    <div className="px-3 py-1.5 bg-muted/50 rounded-full">
                      <span className="text-sm font-bold text-muted-foreground">{sortedStations.length}</span>
                    </div>
                  </div>
                  <div className="space-y-3 lg:space-y-4">
                    {sortedStations.map((station) => {
                      const price = getStationPrice(station, selectedFuelType);
                      const isLowest = price === lowestPrice;
                      const priceDiff = price - lowestPrice;

                      return (
                        <div
                          key={station.id}
                          onClick={() => navigate(`/app/station/${station.id}`)}
                          className={`relative bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl rounded-2xl p-6 lg:p-7 border cursor-pointer transition-all hover:shadow-2xl hover:scale-[1.02] ${
                            isLowest
                              ? "border-teal-400/50 ring-2 ring-teal-500/25 shadow-2xl shadow-teal-500/15"
                              : "border-white/40 dark:border-neutral-700/50 shadow-xl shadow-black/5 hover:shadow-emerald-500/15 hover:border-emerald-400/40"
                          }`}
                        >
                          {isLowest && (
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/6 to-teal-500/6 rounded-2xl pointer-events-none" />
                          )}

                          <div className="relative z-10 flex items-center justify-between gap-4 lg:gap-6">
                            <div className="flex items-center gap-4 lg:gap-6 flex-1 min-w-0">
                              <StationLogo name={station.name} size="md" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2.5 mb-2.5 lg:mb-3">
                                  <span className="font-bold text-foreground text-base lg:text-lg truncate">
                                    {station.name}
                                  </span>
                                  {isLowest && (
                                    <span className="px-3 py-1 lg:px-4 lg:py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs lg:text-sm rounded-full font-bold shadow-lg shadow-teal-500/30 flex-shrink-0">
                                      Best
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm lg:text-base">
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <MapPin className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                                    <span className="font-semibold text-xs lg:text-sm truncate max-w-[150px]">
                                      {station.address}
                                    </span>
                                  </div>
                                  {!isLowest && (
                                    <span className="text-rose-600 dark:text-rose-400 font-bold text-sm lg:text-base">
                                      +₱{priceDiff.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                              <div
                                className={`text-3xl lg:text-4xl font-bold tracking-tighter leading-none mb-1 ${
                                  isLowest ? "text-teal-600 dark:text-teal-500" : "text-foreground"
                                }`}
                              >
                                ₱{price.toFixed(2)}
                              </div>
                              <div className="text-xs lg:text-sm text-muted-foreground/70 font-semibold">per liter</div>
                            </div>
                          </div>

                          {/* Subtle border glow */}
                          <div className={`absolute inset-0 rounded-2xl pointer-events-none ${
                            isLowest ? "border border-teal-400/15" : "border border-white/10 dark:border-neutral-700/20"
                          }`} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column - Savings Estimator (Sticky on Desktop) */}
              <div className="lg:col-span-1 mt-6 lg:mt-0">
                <div className="lg:sticky lg:top-24">
                  <div className="relative bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/30 dark:via-green-950/30 dark:to-teal-950/30 backdrop-blur-2xl border border-emerald-200/60 dark:border-emerald-800/40 rounded-3xl p-6 lg:p-7 shadow-2xl shadow-emerald-500/15 overflow-hidden">
                    {/* Subtle glow effect */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-200/20 dark:bg-emerald-400/10 rounded-full blur-3xl" />

                    <div className="relative z-10">
                      <h4 className="font-bold text-foreground mb-2 lg:mb-3 text-lg lg:text-xl tracking-tight">
                        Potential Savings
                      </h4>
                      <p className="text-sm lg:text-base text-muted-foreground/90 mb-5 lg:mb-6 font-medium leading-relaxed">
                        By choosing the lowest price in <span className="font-bold">{selectedCity}</span>, you save an average of <span className="text-emerald-600 font-bold">₱{potentialSavingsPerLiter.toFixed(2)}/L</span> compared to other stations.
                      </p>
                      
                      <div className="grid grid-cols-1 gap-4 lg:gap-5">
                        <div className="relative bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-2xl p-5 lg:p-6 shadow-xl shadow-black/10 border border-white/60 dark:border-neutral-700/60 transition-all">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-xs text-muted-foreground/80 font-bold uppercase tracking-wide">Avg. Savings (40L)</div>
                            <div className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-md">Typical</div>
                          </div>
                          <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            ₱{(potentialSavingsPerLiter * 40).toFixed(2)}
                          </div>
                        </div>
                        
                        <div className="relative bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-2xl p-5 lg:p-6 shadow-xl shadow-black/10 border border-white/60 dark:border-neutral-700/60 transition-all">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-xs text-muted-foreground/80 font-bold uppercase tracking-wide">Max Savings (40L)</div>
                            <div className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-2 py-1 rounded-md">Maximum</div>
                          </div>
                          <div className="text-3xl lg:text-4xl font-bold text-foreground">
                            ₱{(maxSavingsPerLiter * 40).toFixed(2)}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2 font-medium">Comparing lowest vs highest price in city</p>
                        </div>
                      </div>
                    </div>

                    {/* Border glow */}
                    <div className="absolute inset-0 border border-white/20 dark:border-white/10 rounded-3xl pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
