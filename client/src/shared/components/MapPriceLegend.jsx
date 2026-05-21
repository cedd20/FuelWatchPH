import { X } from "lucide-react";
import { useState } from "react";

export function MapPriceLegend() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-auto w-[9.75rem] bg-white/92 dark:bg-neutral-900/92 backdrop-blur-xl border border-gray-200/80 dark:border-neutral-700/80 rounded-[1.15rem] px-3 py-2.5 shadow-[0_16px_36px_rgba(15,23,42,0.14)] flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.16em]">Price Level</div>
        <button
          onClick={() => setIsVisible(false)}
          className="h-5 w-5 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors"
        >
          <X className="w-3 h-3 text-foreground" />
        </button>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.14)]" />
          <span className="text-xs font-semibold text-foreground">Lowest</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.16)]" />
          <span className="text-xs font-semibold text-foreground">Average</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.14)]" />
          <span className="text-xs font-semibold text-foreground">Highest</span>
        </div>
      </div>
    </div>
  );
}
