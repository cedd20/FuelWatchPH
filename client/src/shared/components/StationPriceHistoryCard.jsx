import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Clock3, Fuel } from "lucide-react";
import {
  CartesianGrid,
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
    <div className="app-panel-strong min-w-[180px] rounded-2xl px-4 py-3 shadow-2xl shadow-black/20">
      <p className="mb-2 text-sm font-bold text-foreground">{label}</p>
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
                <span className="truncate font-medium text-muted-foreground">{item.name}</span>
              </div>
              <span className="whitespace-nowrap font-bold text-foreground">{formatPeso(item.value)}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

function PriceHistoryLegend({ payload }) {
  if (!payload?.length) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
      {payload.map((item) => (
        <div
          key={item.value}
          className="app-panel-muted inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none shadow-sm"
        >
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: item.color }}
          />
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
    <section className={`app-panel rounded-3xl overflow-hidden shadow-2xl shadow-black/10 ${compact ? "" : ""}`}>
      <div className={`${compact ? "px-4 pt-4 pb-3" : "px-5 pt-5 pb-4"} border-b border-border/60`}>
        <div className={`flex items-start justify-between gap-4 ${compact ? "mb-3" : "mb-4"}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`${compact ? "w-9 h-9" : "w-11 h-11"} rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0`}>
              <Fuel className="w-5 h-5 text-emerald-400" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h3 className={`${compact ? "text-sm sm:text-lg" : "text-lg sm:text-xl"} font-bold text-foreground tracking-tight`}>Price History</h3>
              <p className={`${compact ? "text-[10px] sm:text-xs" : "text-xs sm:text-sm"} text-muted-foreground font-medium truncate`}>
                Station trends for {stationName || "this station"}
              </p>
            </div>
          </div>
          <div className="hidden rounded-full border border-emerald-500/15 bg-emerald-500/8 px-3 py-2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-300 sm:flex items-center gap-2">
            <Clock3 className="w-3 h-3" />
            Local history
          </div>
        </div>

        <div className={`flex gap-2 overflow-x-auto pb-1 scrollbar-hide ${compact ? "-mx-0.5 pr-0.5" : ""}`}>
          {STATION_HISTORY_RANGES.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setSelectedRange(range)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full ${compact ? "text-[10px]" : "text-sm"} font-bold transition-all border ${
                selectedRange === range
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/30"
                  : "app-panel-muted text-muted-foreground border-transparent hover:border-emerald-500/20 hover:text-foreground"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className={`${compact ? "p-4 sm:p-5" : "p-4 sm:p-6"}`}>
        {chartData.length === 0 ? (
          <div className={`${compact ? "min-h-[140px] px-4 py-6" : "min-h-[200px] px-6 py-10"} app-panel-muted flex flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center`}>
            <div className={`${compact ? "w-10 h-10 mb-2" : "w-14 h-14 mb-4"} rounded-full bg-emerald-500/10 flex items-center justify-center`}>
              <AlertCircle className={`${compact ? "w-5 h-5" : "w-7 h-7"} text-emerald-400`} />
            </div>
            <h4 className={`${compact ? "text-xs" : "text-sm"} mb-1 font-bold text-foreground`}>No local history yet.</h4>
            <p className={`${compact ? "text-[10px]" : "text-xs"} max-w-md text-muted-foreground`}>
              Updates you make will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className={compact ? "h-[220px] sm:h-[260px]" : "h-[270px] sm:h-[330px]"}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 145, 138, 0.28)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    minTickGap={18}
                    interval="preserveStartEnd"
                    tick={{ fill: "var(--app-text-muted)", fontSize: 12, fontWeight: 600 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={48}
                    tick={{ fill: "var(--app-text-muted)", fontSize: 12, fontWeight: 600 }}
                    tickFormatter={(value) => `₱${Number(value).toFixed(0)}`}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip content={<PriceHistoryTooltip />} />
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

            <div className={compact ? "mt-3 space-y-2" : "mt-4 space-y-2.5"}>
              <PriceHistoryLegend
                payload={fuelTypes.map((fuelType) => ({
                  value: fuelType,
                  color: FUEL_HISTORY_COLORS[fuelType] || "#0f766e",
                }))}
              />
              <p className="text-center text-[11px] font-medium text-slate-500 dark:text-slate-400 sm:text-xs">
                Only valid prices are plotted.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
