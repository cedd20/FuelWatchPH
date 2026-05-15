import { MapPin } from "lucide-react";

export function CityCard({ name, stationCount, avgPrice, fuelType = "DSL", onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-44 lg:w-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/30 dark:border-neutral-700/40 rounded-2xl p-4 lg:p-5 shadow-lg shadow-black/5 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all hover:scale-105 hover:border-cyan-400/30"
    >
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-sky-500 rounded-lg flex items-center justify-center shadow-md">
          <MapPin className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <h4 className="font-bold text-foreground text-sm truncate flex-1 text-left">{name}</h4>
      </div>
      <div className="text-xs text-muted-foreground/70 mb-1.5">
        {stationCount} stations
      </div>
      <div className="text-sm font-bold bg-gradient-to-r from-cyan-600 to-sky-600 bg-clip-text text-transparent">
        {fuelType} avg. {avgPrice}
      </div>
    </button>
  );
}
