import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ChevronRight, Clock3, Fuel } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  buildStationPriceHistoryChartData,
  FUEL_HISTORY_COLORS,
  readStationPriceHistory,
  STATION_HISTORY_RANGES,
  STATION_PRICE_HISTORY_EVENT,
  getStationPriceHistoryFuelTypes,
} from "@/shared/utils/stationPriceHistory";
import { formatPrice } from "@/shared/utils/priceUtils";

function formatPeso(value) {
  return `${formatPrice(value)}/L`;
}

function PriceHistoryTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl px-4 py-3 shadow-2xl shadow-black/10 min-w-[180px]">
      <p className="text-sm font-bold text-foreground mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload
          .filter((item) => Number.isFinite(item.value))
          .map((item) => (
            <div key={item.dataKey} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.stroke || item.color }}
                />
                <span className="font-medium text-muted-foreground truncate">{item.name}</span>
              </div>
              <span className="font-bold text-foreground whitespace-nowrap">{formatPeso(item.value)}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

function PriceHistoryLegend({ payload }) {
  if (!payload?.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {payload.map((item) => (
        <div key={item.value} className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-neutral-700 bg-white/80 dark:bg-neutral-900/80 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export function StationPriceHistoryCard({ stationId, stationName, compact = false }) {
  const [selectedRange, setSelectedRange] = useState("3M");
  const [historyEntries, setHistoryEntries] = useState([]);

  useEffect(() => {
    const refresh = () => {
      setHistoryEntries(readStationPriceHistory({ stationId, stationName }));
    };

    refresh();

    const handleStorage = (event) => {
      if (!event.key || event.key.includes(String(stationId))) {
        refresh();
      }
    };

    const handleCustomUpdate = () => refresh();

    window.addEventListener("storage", handleStorage);
    window.addEventListener(STATION_PRICE_HISTORY_EVENT, handleCustomUpdate);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(STATION_PRICE_HISTORY_EVENT, handleCustomUpdate);
    };
  }, [stationId, stationName]);

  const chartData = useMemo(() => buildStationPriceHistoryChartData(historyEntries, selectedRange), [historyEntries, selectedRange]);
  const fuelTypes = useMemo(() => getStationPriceHistoryFuelTypes(historyEntries, selectedRange), [historyEntries, selectedRange]);

  return (
    <section className={`bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-3xl border-2 border-gray-200 dark:border-neutral-700 shadow-2xl shadow-black/10 overflow-hidden ${compact ? "" : ""}`}>
      <div className={`${compact ? "px-4 sm:px-5 pt-4 sm:pt-5 pb-3" : "px-5 sm:px-6 pt-5 sm:pt-6 pb-4"} border-b border-gray-200/70 dark:border-neutral-700/70`}>
        <div className={`flex items-start justify-between gap-4 ${compact ? "mb-3" : "mb-4"}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`${compact ? "w-10 h-10" : "w-11 h-11"} rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/20 flex items-center justify-center flex-shrink-0`}>
              <Fuel className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h3 className={`${compact ? "text-base sm:text-lg" : "text-lg sm:text-xl"} font-bold text-foreground tracking-tight`}>Price History</h3>
              <p className={`${compact ? "text-[11px] sm:text-xs" : "text-xs sm:text-sm"} text-muted-foreground font-medium truncate`}>
                Station-specific history for {stationName || "this station"}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-gray-50 dark:bg-neutral-800 px-3 py-2 rounded-full">
            <Clock3 className="w-3.5 h-3.5" />
            Local history
          </div>
        </div>

        <div className={`flex gap-2 overflow-x-auto pb-1 scrollbar-hide ${compact ? "-mx-0.5 pr-0.5" : ""}`}>
          {STATION_HISTORY_RANGES.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setSelectedRange(range)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full ${compact ? "text-[11px] sm:text-xs" : "text-sm"} font-bold transition-all border ${
                selectedRange === range
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/30"
                  : "bg-gray-50 dark:bg-neutral-800 text-muted-foreground border-gray-200 dark:border-neutral-700 hover:border-emerald-300 hover:text-foreground"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className={`${compact ? "p-4 sm:p-5" : "p-4 sm:p-6"}`}>
        {chartData.length === 0 ? (
          <div className={`${compact ? "min-h-[160px] sm:min-h-[180px] px-5 py-8" : "min-h-[240px] sm:min-h-[280px] px-6 py-10"} flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-neutral-700 bg-gray-50/50 dark:bg-neutral-800/30`}>
            <div className={`${compact ? "w-12 h-12 mb-3" : "w-14 h-14 mb-4"} rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center`}>
              <AlertCircle className={`${compact ? "w-6 h-6" : "w-7 h-7"} text-emerald-600 dark:text-emerald-400`} />
            </div>
            <h4 className={`${compact ? "text-sm sm:text-base" : "text-base sm:text-lg"} font-bold text-foreground mb-2`}>No price history available for this station yet.</h4>
            <p className={`${compact ? "text-xs sm:text-sm" : "text-sm sm:text-base"} text-muted-foreground max-w-md`}>
              Updates from the Update Fuel Price flow will appear here and stay tied to this station only.
            </p>
          </div>
        ) : (
          <>
            <div className={compact ? "h-[210px] sm:h-[250px]" : "h-[260px] sm:h-[320px]"}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    minTickGap={18}
                    interval="preserveStartEnd"
                    tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={48}
                    tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }}
                    tickFormatter={(value) => `₱${Number(value).toFixed(0)}`}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip content={<PriceHistoryTooltip />} />
                  <Legend content={<PriceHistoryLegend />} verticalAlign="top" align="left" wrapperStyle={{ marginBottom: compact ? 8 : 12 }} />
                  {fuelTypes.map((fuelType) => (
                    <Line
                      key={fuelType}
                      type="monotone"
                      dataKey={fuelType}
                      name={fuelType}
                      stroke={FUEL_HISTORY_COLORS[fuelType] || "#0f766e"}
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className={`${compact ? "mt-3" : "mt-4"} flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground font-medium`}>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
                <ChevronRight className="w-3.5 h-3.5" />
                {fuelTypes.length} fuel type{fuelTypes.length === 1 ? "" : "s"} shown
              </span>
              <span>Only valid prices are plotted.</span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}