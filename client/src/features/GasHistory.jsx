import { useState, useEffect, useMemo } from "react";
import { Fuel, Info, ChevronDown, Loader2 } from "lucide-react";
import { PriceMovementBadge } from "@/shared/components/PriceMovementBadge";
import { FuelTypeChip } from "@/shared/components/FuelTypeChip";
import { getCitiesSortedByProximity, PHILIPPINE_CITIES } from "@/shared/utils/philippineCities";
import { usePriceHistory } from "@/hooks/usePrices";
import { formatPrice, isValidPrice } from "@/shared/utils/priceUtils";
import { PageHeaderSkeleton, ChartSkeleton, Skeleton } from "@/shared/components/Skeleton";
import * as Accordion from "@radix-ui/react-accordion";

const GAS_HISTORY_STATE_KEY = "fuelwatch_gas_history_state";

// Fuel type mapping
const fuelTypeMap = {
  "All": "all",
  "Diesel": "diesel",
  "Premium Diesel": "premiumDiesel",
  "Unleaded 91": "unleaded91",
  "Unleaded 95": "unleaded95",
  "Unleaded 98": "unleaded98",
  "Kerosene": "kerosene",
};

const fuelTypeColors = {
  "Diesel": "#F59E0B",
  "Premium Diesel": "#EF4444",
  "Unleaded 91": "#3B82F6",
  "Unleaded 95": "#8B5CF6",
  "Unleaded 98": "#EC4899",
  "Kerosene": "#10B981",
};



// Helper to calculate price change relative to previous data point
const getPriceChange = (data, currentIndex, fuelType) => {
  if (currentIndex >= data.length - 1) return 0;
  const current = data[currentIndex].averages[fuelTypeMap[fuelType]];
  const previous = data[currentIndex + 1].averages[fuelTypeMap[fuelType]];
  return current - previous;
};

function loadStoredHistoryState() {
  try {
    const raw = localStorage.getItem(GAS_HISTORY_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredHistoryState(state) {
  try {
    localStorage.setItem(GAS_HISTORY_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save gas history state:", error);
  }
}

export function GasHistory() {
  const [timeRange, setTimeRange] = useState("1M");
  const [selectedFuelType, setSelectedFuelType] = useState("All");
  const [locationMode, setLocationMode] = useState("Nationwide");
  const [selectedCity, setSelectedCity] = useState("");
  const [userLocation, setUserLocation] = useState(null);

  // Get user's geolocation to sort cities by proximity
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation({ lat: 14.5995, lng: 120.9842 }) // Metro Manila fallback
    );
  }, []);

  // Sort cities by proximity to user's location
  const sortedCities = userLocation
    ? getCitiesSortedByProximity(userLocation.lat, userLocation.lng)
    : PHILIPPINE_CITIES;

  const { data: historyData = [], isLoading } = usePriceHistory({
    location: locationMode,
    city: locationMode === "By City" ? selectedCity : undefined,
    fuel_type: selectedFuelType === "All" ? undefined : selectedFuelType,
  });

  // ALL hooks must be declared unconditionally before any early returns (Rules of Hooks)
  const visibleHistoryData = useMemo(() => {
    const rangeMap = {
      "7D": 1,
      "1M": 4,
      "3M": 12,
    };

    return historyData.slice(0, rangeMap[timeRange] || historyData.length);
  }, [historyData, timeRange]);

  const latestHistoryPoint = visibleHistoryData[0] || historyData[0];

  // Early returns AFTER all hooks — this is now safe (Rules of Hooks compliant)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 pb-12">
        <PageHeaderSkeleton />
        <div className="max-w-6xl mx-auto px-4 lg:px-8 space-y-8 -mt-10 relative z-20">
          {/* KPI Card Skeleton */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border-2 border-gray-100 dark:border-neutral-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>

          {/* Chart Skeleton */}
          <ChartSkeleton />

          {/* List Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-8 w-48 mb-6" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border-2 border-gray-100 dark:border-neutral-800 flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-24 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (historyData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex flex-col items-center justify-center p-8">
        <p className="text-muted-foreground">No historical data available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-950 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-14 pb-10 px-4 lg:px-8 relative overflow-hidden">
        {/* Enhanced radial glow background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 drop-shadow-2xl tracking-tight">Gas Price History</h1>
          <p className="text-white/95 text-sm lg:text-base font-medium drop-shadow-lg mb-4">
            Track average fuel price changes over time
          </p>
          <div className="flex items-start gap-2 text-xs lg:text-sm text-white/90">
            <div className="w-8 h-8 lg:w-9 lg:h-9 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
              <Info className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
            <span className="pt-1.5 lg:pt-2 font-medium drop-shadow-md">
              Historical prices are based on submitted and verified station updates
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 lg:px-8 space-y-8 -mt-3">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Data Timestamp */}
          <div className="text-center">
            <div className="inline-block bg-white dark:bg-neutral-900 backdrop-blur-xl border-2 border-gray-200 dark:border-neutral-700 rounded-full px-5 py-2.5 text-xs lg:text-sm font-semibold text-muted-foreground shadow-lg shadow-black/5">
              Showing {visibleHistoryData.length} week{visibleHistoryData.length === 1 ? "" : "s"} of verified submissions
            </div>
          </div>

          {/* Filters: Location and Fuel */}
          <div className="space-y-6">
            <div>
              <h3 className="text-base lg:text-lg font-bold text-foreground mb-4 lg:mb-5 tracking-tight">Location</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex bg-gray-100 dark:bg-neutral-800 rounded-xl p-1 w-fit">
                  <button
                    onClick={() => setLocationMode("Nationwide")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      locationMode === "Nationwide"
                        ? "bg-white dark:bg-neutral-700 text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Nationwide
                  </button>
                  <button
                    onClick={() => setLocationMode("By City")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      locationMode === "By City"
                        ? "bg-white dark:bg-neutral-700 text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    By City
                  </button>
                </div>
                {locationMode === "By City" && (
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="px-4 py-2.5 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-emerald-500 font-medium text-sm min-w-[200px]"
                  >
                    <option value="">Select a city...</option>
                    {sortedCities.map((c) => (
                      <option key={`${c.city}-${c.province}`} value={c.city}>{c.city}, {c.province}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-base lg:text-lg font-bold text-foreground mb-4 lg:mb-5 tracking-tight">Select Fuel Type</h3>
              <div className="flex gap-2.5 overflow-x-auto lg:overflow-x-visible pb-2 scrollbar-hide lg:flex-wrap">
                {Object.keys(fuelTypeMap).map((type) => (
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

          {/* Desktop 2-Column Layout */}
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* KPI Card - Single Selected Fuel Type */}
              <div className="relative bg-white dark:bg-neutral-900 backdrop-blur-2xl border-2 border-gray-200 dark:border-neutral-700 rounded-3xl p-6 lg:p-7 shadow-2xl shadow-black/10 overflow-hidden">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-green-50/20 to-teal-50/10 dark:from-emerald-950/10 dark:via-green-950/5 dark:to-teal-950/5 pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: selectedFuelType === "All" ? "#10B98120" : `${fuelTypeColors[selectedFuelType]}20` }}>
                      <Fuel className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: selectedFuelType === "All" ? "#10B981" : fuelTypeColors[selectedFuelType] }} strokeWidth={2.5} />
                    </div>
                    <div className="text-sm lg:text-base font-bold text-muted-foreground tracking-tight">{selectedFuelType === "All" ? "Overall Community" : selectedFuelType} Average</div>
                  </div>
                  <div className="text-4xl lg:text-5xl font-bold text-foreground mb-3 tracking-tighter">
                    {selectedFuelType === "All" ? (
                      <>
                        {(() => {
                          const values = Object.values(latestHistoryPoint.averages).filter(v => isValidPrice(v));
                          if (values.length === 0) return "No Data";
                          const avg = values.reduce((a, b) => a + b, 0) / values.length;
                          return formatPrice(avg) + "/L";
                        })()}
                      </>
                    ) : (
                      <>{formatPrice(latestHistoryPoint.averages[fuelTypeMap[selectedFuelType]])}/L</>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <PriceMovementBadge change={
                      selectedFuelType === "All" 
                        ? (() => {
                            const currentValues = Object.values(visibleHistoryData[0].averages).filter(v => isValidPrice(v));
                            const currentAvg = currentValues.length > 0 ? currentValues.reduce((a,b)=>a+b,0) / currentValues.length : 0;
                            const prevWeek = visibleHistoryData[1];
                            const prevValues = prevWeek ? Object.values(prevWeek.averages).filter(v => isValidPrice(v)) : [];
                            const prevAvg = prevValues.length > 0 
                              ? prevValues.reduce((a,b)=>a+b,0) / prevValues.length
                              : currentAvg;
                            return currentAvg - prevAvg;
                          })()
                        : getPriceChange(visibleHistoryData, 0, selectedFuelType)
                    } />
                    <div className="text-sm lg:text-base text-muted-foreground/80 font-medium">This week</div>
                  </div>
                </div>

                {/* Border glow */}
                <div className="absolute inset-0 border border-white/20 dark:border-white/10 rounded-3xl pointer-events-none" />
              </div>

              {/* Price Trend Chart */}
              <div className="relative bg-white dark:bg-neutral-900 backdrop-blur-2xl border-2 border-gray-200 dark:border-neutral-700 rounded-3xl p-4 lg:p-6 shadow-2xl shadow-black/10 overflow-hidden">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 via-green-50/10 to-teal-50/5 dark:from-emerald-950/10 dark:via-green-950/5 dark:to-teal-950/5 pointer-events-none" />

                <div className="relative z-10">
                  {/* Chart Title */}
                  <h3 className="text-base lg:text-lg font-bold text-foreground tracking-tight mb-4 lg:mb-5">Average Fuel Price Trend</h3>

                  {/* Time Range Filters */}
                  <div className="flex gap-2 mb-4 lg:mb-5">
                    {["7D", "1M", "3M"].map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                          timeRange === range
                            ? "bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30 scale-105"
                            : "bg-white dark:bg-neutral-800 backdrop-blur-md text-muted-foreground hover:bg-white/90 dark:hover:bg-neutral-700 shadow-lg hover:shadow-xl hover:scale-105 border-2 border-gray-200 dark:border-neutral-700"
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>

                  {/* Chart */}
                  <div className="relative h-72 lg:h-96 mb-3 lg:mb-4">
                    <svg className="w-full h-full" viewBox="0 0 380 280">
                      {(() => {
                        const chartPoints = [...visibleHistoryData].reverse();
                        const activeFuels = selectedFuelType === "All" 
                          ? Object.keys(fuelTypeColors) 
                          : [selectedFuelType];

                        // Calculate global min/max for scaling
                        let allPrices = [];
                        activeFuels.forEach(fuel => {
                          const fuelKey = fuelTypeMap[fuel];
                          chartPoints.forEach(d => {
                            const p = d.averages[fuelKey];
                            if (isValidPrice(p)) allPrices.push(Number(p));
                          });
                        });

                        const minPrice = allPrices.length > 0 ? Math.min(...allPrices) * 0.98 : 40;
                        const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) * 1.02 : 100;
                        const range = maxPrice - minPrice || 1;

                        // Calculate Y-axis labels
                        const yLabels = Array.from({ length: 5 }, (_, i) => minPrice + (range / 4) * i);

                        return (
                          <g>
                            {/* Grid lines */}
                            {[50, 100, 150, 200, 250].map((y) => (
                              <line
                                key={y}
                                x1="55"
                                y1={y}
                                x2="360"
                                y2={y}
                                stroke="currentColor"
                                className="text-border opacity-15"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                              />
                            ))}

                            {/* Y-axis */}
                            <line x1="55" y1="30" x2="55" y2="250" stroke="currentColor" className="text-border opacity-40" strokeWidth="1.5" />

                            {/* X-axis */}
                            <line x1="55" y1="250" x2="360" y2="250" stroke="currentColor" className="text-border opacity-40" strokeWidth="1.5" />

                            {/* Y-axis labels */}
                            {yLabels.map((label, i) => {
                              const y = 250 - (i * 50);
                              return (
                                <text
                                  key={i}
                                  x="48"
                                  y={y + 4}
                                  className="text-[10px] fill-current text-muted-foreground"
                                  textAnchor="end"
                                >
                                  ₱{label.toFixed(0)}
                                </text>
                              );
                            })}

                            {/* Lines for each fuel type */}
                            {activeFuels.map((fuel) => {
                              const fuelKey = fuelTypeMap[fuel];
                              const color = fuelTypeColors[fuel];
                              
                              return (
                                <g key={fuel}>
                                  {/* Line */}
                                  <polyline
                                    points={chartPoints.map((d, i) => {
                                      const price = d.averages[fuelKey];
                                      if (!isValidPrice(price)) return null;
                                      const y = 250 - ((price - minPrice) / range) * 200;
                                      const x = 90 + (i * 90);
                                      return `${x},${y}`;
                                    }).filter(p => p !== null).join(" ")}
                                    fill="none"
                                    stroke={color}
                                    strokeWidth={selectedFuelType === "All" ? "2" : "4"}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="transition-all duration-500"
                                  />

                                  {/* Data points */}
                                  {chartPoints.map((d, i) => {
                                    const price = d.averages[fuelKey];
                                    if (!isValidPrice(price)) return null;
                                    const y = 250 - ((price - minPrice) / range) * 200;
                                    const x = 90 + (i * 90);
                                    return (
                                      <circle
                                        key={i}
                                        cx={x}
                                        cy={y}
                                        r={selectedFuelType === "All" ? "3" : "5"}
                                        fill={color}
                                        stroke="white"
                                        strokeWidth="1.5"
                                        className="cursor-pointer hover:r-6 transition-all"
                                      >
                                        <title>{fuel}: {formatPrice(price)} ({d.date})</title>
                                      </circle>
                                    );
                                  })}
                                </g>
                              );
                            })}

                            {/* X-axis labels */}
                            {chartPoints.map((d, i) => (
                              <text key={i} x={90 + (i * 90)} y="268" className="text-[11px] font-bold fill-current text-muted-foreground" textAnchor="middle">
                                {d.date}
                              </text>
                            ))}
                          </g>
                        );
                      })()}
                    </svg>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    {(selectedFuelType === "All" ? Object.keys(fuelTypeColors) : [selectedFuelType]).map(fuel => (
                      <div key={fuel} className="flex items-center gap-2 px-3 py-1.5 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-md rounded-full border border-white/40 dark:border-neutral-700/40 shadow-sm">
                        <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ backgroundColor: fuelTypeColors[fuel] }} />
                        <span className="text-[10px] lg:text-xs font-bold text-muted-foreground">{fuel}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Border glow */}
                <div className="absolute inset-0 border border-white/20 dark:border-white/10 rounded-3xl pointer-events-none" />
              </div>

              {/* Weekly Breakdown Accordion */}
              <div>
                <h3 className="text-lg lg:text-xl font-bold text-foreground mb-5 lg:mb-6 tracking-tight">Weekly Breakdown</h3>
                <Accordion.Root type="single" collapsible className="space-y-4 lg:space-y-5">
                  {historyData.map((weekData, index) => (
                    <Accordion.Item
                      key={index}
                      value={`week-${index}`}
                      className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl border-2 border-white/40 dark:border-neutral-700/40 rounded-3xl overflow-hidden shadow-xl shadow-black/5 hover:shadow-2xl transition-shadow"
                    >
                      <Accordion.Trigger className="w-full p-6 lg:p-7 hover:bg-white/50 dark:hover:bg-neutral-800/50 transition-all group">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2.5 mb-2">
                              <div className="font-bold text-foreground text-base">{weekData.week}, {weekData.year}</div>
                              <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" strokeWidth={2.5} />
                            </div>
                            <div className="text-sm">
                              {selectedFuelType === "All" ? (
                                <div className="flex flex-wrap gap-x-3 gap-y-1">
                                  {Object.entries(weekData.averages).map(([key, value]) => {
                                    const fuelName = Object.keys(fuelTypeMap).find(k => fuelTypeMap[k] === key);
                                    if (!fuelName || fuelName === "All" || !isValidPrice(value)) return null;
                                    return (
                                      <span key={key} className="text-[10px] lg:text-xs font-bold text-muted-foreground">
                                        {fuelName.split(' ')[0]}: <span className="text-foreground">{formatPrice(value)}</span>
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-muted-foreground font-medium">
                                  {selectedFuelType}: <span className="text-foreground font-bold">{formatPrice(weekData.averages[fuelTypeMap[selectedFuelType]])}/L</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <PriceMovementBadge change={
                              selectedFuelType === "All"
                                ? (() => {
                                    const vals = Object.values(weekData.averages).filter(v => isValidPrice(v));
                                    const currentAvg = vals.length > 0 ? vals.reduce((a,b)=>a+b,0) / vals.length : 0;
                                    const prevWeek = visibleHistoryData[index + 1];
                                    const prevVals = prevWeek ? Object.values(prevWeek.averages).filter(v => isValidPrice(v)) : [];
                                    const prevAvg = prevVals.length > 0 
                                      ? prevVals.reduce((a,b)=>a+b,0) / prevVals.length
                                      : currentAvg;
                                    return currentAvg - prevAvg;
                                  })()
                                : getPriceChange(visibleHistoryData, index, selectedFuelType)
                            } />
                            <div className="text-xs text-muted-foreground/80 mt-1.5 font-semibold">
                              {(() => {
                                const change = selectedFuelType === "All"
                                  ? (() => {
                                      const vals = Object.values(weekData.averages).filter(v => isValidPrice(v));
                                      const currentAvg = vals.length > 0 ? vals.reduce((a,b)=>a+b,0) / vals.length : 0;
                                      const prevWeek = visibleHistoryData[index + 1];
                                      const prevVals = prevWeek ? Object.values(prevWeek.averages).filter(v => isValidPrice(v)) : [];
                                      const prevAvg = prevVals.length > 0 
                                        ? prevVals.reduce((a,b)=>a+b,0) / prevVals.length
                                        : currentAvg;
                                      return currentAvg - prevAvg;
                                    })()
                                  : getPriceChange(visibleHistoryData, index, selectedFuelType);
                                return change > 0 ? "Increased" : change < 0 ? "Decreased" : "Stable";
                              })()}
                            </div>
                          </div>
                        </div>
                      </Accordion.Trigger>

                      <Accordion.Content className="data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp overflow-hidden">
                        <div className="px-6 pb-6 pt-4 border-t border-white/20 dark:border-neutral-700/30">
                          <div className="flex items-center justify-between mb-4 lg:mb-5">
                            <h4 className="text-base lg:text-lg font-bold text-foreground tracking-tight">Price by Brand</h4>
                            <div className="text-xs font-semibold text-muted-foreground px-3 py-1 bg-gray-100 dark:bg-neutral-800 rounded-full">
                               Average: {(() => {
                                 const vals = Object.values(weekData.averages).filter(v => isValidPrice(v));
                                 if (vals.length === 0) return "No Data";
                                 const a = vals.reduce((x, y) => x + y, 0) / vals.length;
                                 return formatPrice(a);
                               })()}
                            </div>
                          </div>
                          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                            {weekData.brands.map((brand, brandIndex) => (
                              <div key={brandIndex} className="relative bg-white dark:bg-neutral-900 backdrop-blur-xl border-2 border-gray-200 dark:border-neutral-700 rounded-2xl lg:rounded-3xl p-5 lg:p-6 shadow-xl shadow-black/10 overflow-hidden hover:shadow-2xl transition-shadow">
                                <div className="relative z-10">
                                  {/* Brand Header */}
                                  <div className="flex items-start justify-between mb-4">
                                    <h5 className="font-bold text-foreground text-base">{brand.name}</h5>
                                    {brand.badge && (
                                      <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold rounded-full shadow-lg shadow-teal-500/30">
                                        {brand.badge}
                                      </div>
                                    )}
                                  </div>

                                  {/* Fuel Prices - Highlighted/Summary */}
                                  <div className="mb-4">
                                    <div className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-lg rounded-2xl p-4 border-2 shadow-lg border-emerald-500/20">
                                      {selectedFuelType === "All" ? (
                                        <div className="grid grid-cols-2 gap-3">
                                          {Object.entries(brand.prices).map(([key, value]) => {
                                            const fuelName = Object.keys(fuelTypeMap).find(k => fuelTypeMap[k] === key) || key;
                                            return (
                                              <div key={key}>
                                                <div className="text-[10px] text-muted-foreground/80 mb-0.5 font-black uppercase tracking-widest">{fuelName.split(' ')[0]}</div>
                                                <div className="text-sm font-bold text-foreground">
                                                  {formatPrice(value)}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <div className="text-xs text-muted-foreground/80 mb-1 font-semibold">{selectedFuelType}</div>
                                            <div className="text-xl font-bold tracking-tight" style={{ color: fuelTypeColors[selectedFuelType] }}>
                                              {formatPrice(brand.prices[fuelTypeMap[selectedFuelType]])}/L
                                            </div>
                                          </div>
                                          <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: fuelTypeColors[selectedFuelType] }} />
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Other Fuel Prices - Collapsed (Only if not in All mode) */}
                                  {selectedFuelType !== "All" && (
                                    <details className="mb-3">
                                      <summary className="cursor-pointer text-xs lg:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                                        View all fuel types
                                      </summary>
                                      <div className="grid grid-cols-2 lg:grid-cols-1 gap-x-4 gap-y-3 mt-4">
                                        {Object.entries(brand.prices).map(([key, value]) => {
                                          const fuelName = Object.keys(fuelTypeMap).find(k => fuelTypeMap[k] === key) || key;
                                          if (fuelName === selectedFuelType) return null;

                                          return (
                                            <div key={key}>
                                              <div className="text-xs text-muted-foreground/80 mb-1 font-semibold">{fuelName}</div>
                                              <div className="text-sm font-bold text-foreground">
                                                {formatPrice(value)}/L
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </details>
                                  )}

                                  {/* Price Movement */}
                                  {brand.movement && (
                                    <div className={`text-sm font-bold ${
                                      brand.movement.includes("Lower") ? "text-emerald-600 dark:text-emerald-500" :
                                      brand.movement.includes("Higher") ? "text-rose-600 dark:text-rose-400" :
                                      "text-muted-foreground"
                                    }`}>
                                      {brand.movement}
                                    </div>
                                  )}
                                </div>

                                {/* Border glow */}
                                <div className="absolute inset-0 border border-white/10 dark:border-neutral-700/20 rounded-2xl pointer-events-none" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </Accordion.Content>
                    </Accordion.Item>
                  ))}
                </Accordion.Root>
              </div>
            </div>

            {/* Right Column - Summary/Insights */}
            <div className="hidden lg:block lg:col-span-1 space-y-6">
              {/* Quick Summary Card */}
              <div className="lg:sticky lg:top-24 space-y-6">
                <div className="relative bg-white dark:bg-neutral-900 backdrop-blur-2xl border-2 border-gray-200 dark:border-neutral-700 rounded-3xl p-6 shadow-2xl shadow-black/10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-green-50/20 to-teal-50/10 dark:from-emerald-950/10 dark:via-green-950/5 dark:to-teal-950/5 pointer-events-none" />

                  <div className="relative z-10">
                    <h4 className="text-lg font-bold text-foreground mb-4 tracking-tight">Quick Summary</h4>

                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1 font-medium">Current Week</div>
                        <div className="text-xl font-bold text-foreground">{latestHistoryPoint.week}, {latestHistoryPoint.year}</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-1 font-medium">Tracking Period</div>
                        <div className="text-base font-bold text-foreground">{visibleHistoryData.length} Weeks</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-2 font-medium">Latest Movement</div>
                        <PriceMovementBadge change={
                          selectedFuelType === "All" 
                            ? (() => {
                                const currentAvg = Object.values(latestHistoryPoint.averages).reduce((a,b)=>a+b,0) / Object.values(latestHistoryPoint.averages).length;
                                const prevAvg = visibleHistoryData[1] 
                                  ? Object.values(visibleHistoryData[1].averages).reduce((a,b)=>a+b,0) / Object.values(visibleHistoryData[1].averages).length
                                  : currentAvg;
                                return currentAvg - prevAvg;
                              })()
                            : getPriceChange(visibleHistoryData, 0, selectedFuelType)
                        } />
                      </div>

                      <div className="pt-4 border-t border-gray-200 dark:border-neutral-700">
                        <div className="text-sm text-muted-foreground mb-2 font-medium">All Fuel Averages</div>
                        <div className="space-y-2">
                          {Object.entries(latestHistoryPoint.averages).map(([key, value]) => {
                            const fuelName = Object.keys(fuelTypeMap).find(k => fuelTypeMap[k] === key);
                            if (!fuelName) return null;

                            return (
                              <div key={key} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground font-medium">{fuelName}</span>
                                <span className="font-bold text-foreground">{formatPrice(value)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-0 border border-white/20 dark:border-white/10 rounded-3xl pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
