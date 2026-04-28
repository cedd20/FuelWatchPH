import { X } from "lucide-react";
import { useState } from "react";

export function MapPriceLegend() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border-2 border-gray-100 dark:border-neutral-800 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Price Level</div>
        <button
          onClick={() => setIsVisible(false)}
          className="w-6 h-6 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors"
        >
          <X className="w-3 h-3 text-foreground" />
        </button>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40" />
          <span className="text-sm font-bold text-foreground">Lowest</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/40" />
          <span className="text-sm font-bold text-foreground">Average</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-rose-500 shadow-lg shadow-rose-500/40" />
          <span className="text-sm font-bold text-foreground">Highest</span>
        </div>
      </div>
    </div>
  );
}
