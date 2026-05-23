import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Info, 
  ChevronDown, 
  Loader2, 
  TrendingDown, 
  TrendingUp, 
  Minus,
  MapPin,
  Calendar,
} from "lucide-react";

// Utilities & Hooks
import { usePriceHistory } from "@/hooks/usePrices";
import { formatPrice, isValidPrice } from "@/shared/utils/priceUtils";
import { getCitiesSortedByProximity, PHILIPPINE_CITIES } from "@/shared/utils/philippineCities";

// UI Components
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import * as Accordion from "@radix-ui/react-accordion";

// Fuel type mapping
const fuelTypeMap = {
  All: "all",
  DSL: "diesel",
  PDSL: "premiumDiesel",
  UL91: "unleaded91",
  PR95: "unleaded95",
  PR97: "unleaded98",
  Kerosene: "kerosene",
};

const fuelTypeColors = {
  UL91: "#16A34A",
  PR95: "#F59E0B",
  PR97: "#EF4444",
  DSL: "#0EA5E9",
  PDSL: "#0369A1",
  Kerosene: "#8B5CF6",
};

const chartFuelOrder = ["UL91", "PR95", "PR97", "DSL", "PDSL", "Kerosene"];

const getPriceChange = (data, currentIndex, fuelType) => {
  if (currentIndex >= data.length - 1) return 0;
  const current = data[currentIndex].averages[fuelTypeMap[fuelType]];
  const previous = data[currentIndex + 1].averages[fuelTypeMap[fuelType]];
  return current - previous;
};

export function GasHistory() {
  const [timeRange, setTimeRange] = useState("1M");
  const [selectedFuelType, setSelectedFuelType] = useState("All");
  const [locationMode, setLocationMode] = useState("Nationwide");
  const [selectedCity, setSelectedCity] = useState("");
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation({ lat: 14.5995, lng: 120.9842 })
    );
  }, []);

  const sortedCities = useMemo(() => 
    userLocation ? getCitiesSortedByProximity(userLocation.lat, userLocation.lng) : PHILIPPINE_CITIES,
    [userLocation]
  );

  const { data: historyData = [], isLoading } = usePriceHistory({
    location: locationMode,
    city: locationMode === "By City" ? selectedCity : undefined,
    fuel_type: selectedFuelType === "All" ? undefined : selectedFuelType,
  });

  const visibleHistoryData = useMemo(() => {
    const rangeMap = { "7D": 1, "1M": 4, "3M": 12 };
    return historyData.slice(0, rangeMap[timeRange] || historyData.length);
  }, [historyData, timeRange]);

  const latestPoint = visibleHistoryData[0] || historyData[0];
  const chartPoints = useMemo(() => [...visibleHistoryData].reverse(), [visibleHistoryData]);
  const renderedFuels = useMemo(() => {
    if (selectedFuelType !== "All") return [selectedFuelType];

    return chartFuelOrder.filter((fuelType) =>
      chartPoints.some((point) => isValidPrice(point.averages[fuelTypeMap[fuelType]]))
    );
  }, [chartPoints, selectedFuelType]);

  if (isLoading) {
    return (
      <div className="app-shell min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-emerald-500/60 font-bold animate-pulse">Fetching history...</p>
      </div>
    );
  }

  const overallAvg = latestPoint ? (
    selectedFuelType === "All" 
      ? (() => {
          const values = Object.values(latestPoint.averages).filter(v => isValidPrice(v));
          return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        })()
      : latestPoint.averages[fuelTypeMap[selectedFuelType]]
  ) : 0;

  const movement = latestPoint && visibleHistoryData[1] ? (
    selectedFuelType === "All"
      ? (() => {
          const currVals = Object.values(latestPoint.averages).filter(v => isValidPrice(v));
          const currAvg = currVals.length > 0 ? currVals.reduce((a,b)=>a+b,0) / currVals.length : 0;
          const prevVals = Object.values(visibleHistoryData[1].averages).filter(v => isValidPrice(v));
          const prevAvg = prevVals.length > 0 ? prevVals.reduce((a,b)=>a+b,0) / prevVals.length : 0;
          return currAvg - prevAvg;
        })()
      : getPriceChange(visibleHistoryData, 0, selectedFuelType)
  ) : 0;

  const renderFiltersCard = ({ desktop = false } = {}) => (
    <Card
      className={`app-panel rounded-[2rem] border-emerald-500/10 ${
        desktop ? "rounded-[2.25rem] border-emerald-500/15 shadow-2xl" : ""
      }`}
    >
      <CardContent className={desktop ? "space-y-4 p-5 xl:p-6" : "space-y-4 p-4"}>
        <div className="space-y-2.5">
          <div className={desktop ? "flex flex-col gap-4 xl:gap-5" : "flex flex-col gap-3 sm:flex-row sm:items-center"}>
            <div
              className={`app-panel-muted inline-flex rounded-2xl border border-emerald-500/10 p-1 ${
                desktop ? "w-full lg:max-w-[340px]" : "w-full sm:w-auto sm:min-w-[248px]"
              }`}
            >
              {["Nationwide", "By City"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setLocationMode(mode)}
                  className={`min-h-[42px] flex-1 rounded-xl px-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                    locationMode === mode
                      ? "bg-emerald-500 text-white shadow-[0_10px_30px_rgba(16,185,129,0.22)]"
                      : "text-muted-foreground hover:text-foreground"
                  } ${desktop ? "lg:min-h-[46px]" : ""}`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {locationMode === "By City" && (
              <div className={`${desktop ? "min-w-0 xl:max-w-[320px]" : "relative min-w-0 flex-1 sm:max-w-[240px]"}`}>
                {desktop && (
                  <div className="mb-2 pl-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-400">
                    City
                  </div>
                )}
                <div className="relative min-w-0 flex-1">
                  <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-500" />
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className={`app-input min-h-[42px] w-full appearance-none rounded-2xl border border-emerald-500/10 pl-10 pr-9 text-[11px] font-bold outline-none transition-colors hover:border-emerald-500/20 focus:border-emerald-500/35 ${
                      desktop
                        ? "lg:min-h-[48px] lg:border-emerald-500/20 lg:bg-emerald-500/5 lg:text-[12px] lg:shadow-[0_10px_24px_rgba(16,185,129,0.08)]"
                        : ""
                    }`}
                  >
                    <option value="">Select City</option>
                    {sortedCities.map((c) => (
                      <option key={c.city} value={c.city}>{c.city}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {locationMode === "By City" && !selectedCity && (
            <p className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Select a city to focus the trend view.
            </p>
          )}
        </div>

        <div className={`flex gap-2 overflow-x-auto pb-1 scrollbar-hide ${desktop ? "lg:flex-wrap lg:overflow-visible lg:pb-0" : ""}`}>
          {Object.keys(fuelTypeMap).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedFuelType(type)}
              className={`whitespace-nowrap rounded-xl border-2 px-4 py-2 text-xs font-black transition-all ${
                selectedFuelType === type
                  ? "bg-emerald-500 border-emerald-400 text-white"
                  : "app-panel-muted border-transparent text-muted-foreground"
              } ${desktop ? "lg:min-w-[74px] lg:rounded-2xl lg:px-4 lg:text-[11px]" : ""}`}
            >
              {type}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderMarketPulseCard = ({ desktop = false } = {}) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`app-panel-strong relative overflow-hidden rounded-[2.5rem] border border-emerald-500/20 p-6 shadow-2xl ${
        desktop ? "rounded-[2.35rem] p-5 xl:p-6" : ""
      }`}
    >
      <div className={`absolute top-0 right-0 rounded-full bg-emerald-500/5 blur-3xl -translate-y-1/2 translate-x-1/2 ${desktop ? "h-36 w-36" : "w-32 h-32"}`} />
      <div className={`relative z-10 ${desktop ? "space-y-5" : "space-y-4"}`}>
        <div className="flex items-center justify-between">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black text-[10px] px-3 py-1">
            MARKET PULSE
          </Badge>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {latestPoint?.week}, {latestPoint?.year}
          </div>
        </div>

        <div className={`${desktop ? "flex items-end justify-between gap-6" : "flex items-end justify-between"}`}>
          <div className="space-y-1">
            <div className={`font-black tracking-tighter text-foreground ${desktop ? "text-6xl xl:text-[4.2rem]" : "text-5xl"}`}>
              {formatPrice(overallAvg)}
            </div>
            <div className={`pl-1 font-bold uppercase tracking-widest text-muted-foreground ${desktop ? "text-[11px]" : "text-xs"}`}>
              {selectedFuelType === "All" ? "Overall Avg" : `${selectedFuelType} Average`}
            </div>
          </div>

          <div
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-black ${
              movement < 0 ? "bg-emerald-500/10 text-emerald-400" :
              movement > 0 ? "bg-rose-500/10 text-rose-400" :
              "bg-gray-500/10 text-gray-400"
            } ${desktop ? "text-sm" : "text-xs"}`}
          >
            {movement < 0 ? <TrendingDown className="w-3 h-3" /> :
             movement > 0 ? <TrendingUp className="w-3 h-3" /> :
             <Minus className="w-3 h-3" />}
            {movement === 0 ? "STEADY" : `₱${Math.abs(movement).toFixed(2)}`}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderChartSection = ({ desktop = false } = {}) => {
    const chartWidth = desktop ? 620 : 380;
    const chartHeight = desktop ? 240 : 200;
    const xStart = desktop ? 48 : 40;
    const xEnd = desktop ? chartWidth - 28 : 380;

    return (
      <div className={desktop ? "space-y-5" : "space-y-4"}>
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Price Trend</h3>
          <div className="app-panel flex rounded-lg p-0.5">
            {["7D", "1M", "3M"].map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 text-[9px] font-black rounded-md transition-all ${
                  timeRange === r ? "bg-emerald-500 text-white shadow-lg" : "text-muted-foreground"
                } ${desktop ? "lg:px-4 lg:py-1.5 lg:text-[10px]" : ""}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <Card className={`app-panel overflow-hidden rounded-[2rem] border-emerald-500/5 ${desktop ? "rounded-[2.25rem] p-5 xl:p-6" : "p-4"}`}>
          <div className={`relative w-full ${desktop ? "h-[360px]" : "h-64"}`}>
            <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
              {(() => {
                const activeFuels = renderedFuels;

                const allPrices = [];
                activeFuels.forEach((f) => {
                  chartPoints.forEach((d) => {
                    const p = d.averages[fuelTypeMap[f]];
                    if (isValidPrice(p)) allPrices.push(p);
                  });
                });

                const min = allPrices.length > 0 ? Math.min(...allPrices) * 0.98 : 50;
                const max = allPrices.length > 0 ? Math.max(...allPrices) * 1.02 : 100;
                const range = max - min || 1;

                return (
                  <g>
                    {[0, 50, 100, 150, 200].map((y) => (
                      <line
                        key={y}
                        x1={desktop ? 38 : 30}
                        y1={y}
                        x2={xEnd}
                        y2={y}
                        stroke="rgba(120, 145, 138, 0.24)"
                        strokeWidth="1"
                      />
                    ))}

                    {activeFuels.map((fuel) => {
                      const points = chartPoints
                        .map((d, i) => {
                          const p = d.averages[fuelTypeMap[fuel]];
                          if (!isValidPrice(p)) return null;
                          const x = xStart + (i * ((xEnd - xStart - 12) / (chartPoints.length - 1 || 1)));
                          const y = chartHeight - ((p - min) / range) * chartHeight;
                          return { x, y };
                        })
                        .filter((p) => p !== null);

                      const color = fuelTypeColors[fuel] || "#10B981";

                      return (
                        <g key={fuel}>
                          <motion.polyline
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1, delay: 0.2 }}
                            points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                            fill="none"
                            stroke={color}
                            strokeWidth={desktop ? "3.5" : "3"}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {points.map((p, i) => (
                            <circle
                              key={i}
                              cx={p.x}
                              cy={p.y}
                              r={desktop ? "4.5" : "4"}
                              fill="var(--app-surface-strong)"
                              stroke={color}
                              strokeWidth="2"
                            />
                          ))}
                        </g>
                      );
                    })}
                  </g>
                );
              })()}
            </svg>
          </div>

          <div className={`mt-4 flex justify-between ${desktop ? "px-2" : "px-4"}`}>
            {visibleHistoryData.length > 0 && (
              <>
                <span className="text-[9px] font-bold text-muted-foreground">{visibleHistoryData[visibleHistoryData.length - 1].date}</span>
                <span className="text-[9px] font-bold text-muted-foreground">Today</span>
              </>
            )}
          </div>

          {selectedFuelType === "All" && renderedFuels.length > 0 && (
            <div
              className={`flex flex-wrap items-center gap-2.5 px-2 ${
                desktop ? "mt-6 justify-start" : "mt-5 justify-center sm:mt-4"
              }`}
            >
              {renderedFuels.map((fuelType) => (
                <div
                  key={fuelType}
                  className="app-panel-muted inline-flex min-h-[32px] items-center justify-center gap-1.5 rounded-full border border-emerald-500/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-foreground shadow-[0_8px_20px_rgba(0,0,0,0.08)]"
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: fuelTypeColors[fuelType] }}
                  />
                  <span>{fuelType}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderWeeklyLogs = ({ desktop = false } = {}) => (
    <div className={desktop ? "space-y-5" : "space-y-4"}>
      <h3 className="px-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Weekly Logs</h3>
      <Accordion.Root type="single" collapsible className={desktop ? "space-y-4" : "space-y-3"}>
        {historyData.map((week, idx) => {
          const weekMovement = idx < historyData.length - 1 ? (
            selectedFuelType === "All"
              ? (() => {
                  const cVals = Object.values(week.averages).filter((v) => isValidPrice(v));
                  const cAvg = cVals.length > 0 ? cVals.reduce((a, b) => a + b, 0) / cVals.length : 0;
                  const pVals = Object.values(historyData[idx + 1].averages).filter((v) => isValidPrice(v));
                  const pAvg = pVals.length > 0 ? pVals.reduce((a, b) => a + b, 0) / pVals.length : 0;
                  return cAvg - pAvg;
                })()
              : getPriceChange(historyData, idx, selectedFuelType)
          ) : 0;

          return (
            <Accordion.Item
              key={idx}
              value={`week-${idx}`}
              className={`app-panel overflow-hidden rounded-[2rem] border border-emerald-500/5 ${desktop ? "rounded-[2.15rem]" : ""}`}
            >
              <Accordion.Trigger className={`group w-full text-left ${desktop ? "px-6 py-5 xl:px-7" : "p-5"}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className={`${desktop ? "text-base" : "text-sm"} font-bold`}>{week.week}, {week.year}</h4>
                    <p className={`${desktop ? "text-[11px]" : "text-[10px]"} font-bold text-muted-foreground`}>{week.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`font-black ${
                      weekMovement < 0 ? "text-emerald-500" : weekMovement > 0 ? "text-rose-500" : "text-muted-foreground"
                    } ${desktop ? "text-xs" : "text-[11px]"}`}>
                      {weekMovement === 0 ? "—" : `${weekMovement < 0 ? "▼" : "▲"} ₱${Math.abs(weekMovement).toFixed(2)}`}
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                  </div>
                </div>
              </Accordion.Trigger>
              <Accordion.Content className={desktop ? "px-6 pb-6 xl:px-7" : "px-5 pb-5"}>
                <div className={`border-t border-emerald-500/5 pt-3 grid gap-3 ${desktop ? "grid-cols-3 xl:grid-cols-4" : "grid-cols-2"}`}>
                  {Object.entries(week.averages).map(([key, val]) => {
                    const name = Object.keys(fuelTypeMap).find((k) => fuelTypeMap[k] === key);
                    if (!name || name === "All") return null;
                    return (
                      <div key={key} className={`app-elevated rounded-2xl ${desktop ? "p-4" : "p-3"}`}>
                        <div className={`mb-1 font-black uppercase text-muted-foreground ${desktop ? "text-[10px]" : "text-[9px]"}`}>{name}</div>
                        <div className={`${desktop ? "text-base" : "text-sm"} font-black`}>{formatPrice(val)}</div>
                      </div>
                    );
                  })}
                </div>
              </Accordion.Content>
            </Accordion.Item>
          );
        })}
      </Accordion.Root>
    </div>
  );

  const renderInfoCard = ({ desktop = false } = {}) => (
    <div className={`app-panel rounded-[2rem] border border-emerald-500/10 text-center ${desktop ? "rounded-[2.15rem] p-5 text-left" : "p-6"}`}>
      {desktop ? (
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10">
            <Info className="h-7 w-7 text-emerald-500/20" />
          </div>
          <p className="text-sm font-bold leading-relaxed text-muted-foreground">
            Trend analysis uses weighted averages of verified station reports within each specific week and region.
          </p>
        </div>
      ) : (
        <>
          <Info className="w-8 h-8 text-emerald-500/20 mx-auto mb-3" />
          <p className="text-[11px] font-bold leading-relaxed text-muted-foreground">
            Trend analysis uses weighted averages of verified station reports within each specific week and region.
          </p>
        </>
      )}
    </div>
  );

  return (
    <div className="app-shell min-h-screen overflow-x-hidden pb-24 text-foreground">
      <div className="mx-auto max-w-md px-5 pt-8 space-y-6 md:max-w-3xl md:px-6 lg:max-w-[1380px] lg:space-y-7 lg:px-8 xl:px-10">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1 lg:max-w-4xl lg:space-y-2"
        >
          <div className="flex items-center gap-3 lg:gap-4">
             <div className="p-2 bg-emerald-500/10 rounded-xl lg:rounded-2xl lg:p-3">
               <TrendingUp className="w-6 h-6 text-emerald-400" />
             </div>
             <h1 className="text-2xl font-bold tracking-tight lg:text-4xl">Price History</h1>
          </div>
          <p className="pl-1 text-xs font-bold uppercase tracking-widest text-muted-foreground lg:pl-0 lg:max-w-3xl lg:text-sm lg:tracking-[0.28em]">
            Tracking verified trends {locationMode === "By City" ? `in ${selectedCity}` : "Nationwide"}
          </p>
        </motion.div>

        <div className="space-y-6 lg:hidden">
          {renderFiltersCard()}
          {renderMarketPulseCard()}
          {renderChartSection()}
          {renderWeeklyLogs()}
          {renderInfoCard()}
        </div>

        <div className="hidden lg:grid lg:grid-cols-[minmax(0,1.45fr)_minmax(330px,420px)] lg:items-start lg:gap-6 xl:gap-7">
          <div className="space-y-6 xl:space-y-7">
            {renderChartSection({ desktop: true })}
            {renderWeeklyLogs({ desktop: true })}
          </div>

          <div className="space-y-5 xl:space-y-6">
            {renderFiltersCard({ desktop: true })}
            {renderMarketPulseCard({ desktop: true })}
            {renderInfoCard({ desktop: true })}
          </div>
        </div>
      </div>
    </div>
  );
}
