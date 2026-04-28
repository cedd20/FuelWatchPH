import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PriceMovementBadgeProps {
  change: number;
  showIcon?: boolean;
}

export function PriceMovementBadge({ change, showIcon = true }: PriceMovementBadgeProps) {
  const isPositive = change > 0;
  const isNeutral = change === 0;

  // Positive change (price increase) = bad (rose/red)
  // Negative change (price decrease) = good (emerald/teal)
  const colorClass = isNeutral
    ? "text-muted-foreground bg-muted/50"
    : isPositive
    ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30"
    : "text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30";

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${colorClass} backdrop-blur-md border border-white/40 dark:border-neutral-700/40 shadow-md`}>
      {showIcon && <Icon className="w-4 h-4" strokeWidth={2.5} />}
      <span>
        {isPositive && "+"}₱{Math.abs(change).toFixed(2)}
      </span>
    </div>
  );
}
