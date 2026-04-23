import { X } from "lucide-react";
import { useState } from "react";

export function MapPriceLegend() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-2.5 shadow-lg">
      <div className="flex items-start justify-between mb-2">
        <div className="text-xs font-semibold text-foreground">Price Level</div>
        <button
          onClick={() => setIsVisible(false)}
          className="w-4 h-4 rounded-full hover:bg-muted flex items-center justify-center"
        >
        </button>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-xs text-muted-foreground">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warning" />
          <span className="text-xs text-muted-foreground">Average</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <span className="text-xs text-muted-foreground">High</span>
        </div>
      </div>
    </div>
  );
}
