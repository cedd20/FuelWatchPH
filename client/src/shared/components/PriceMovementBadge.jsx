import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function PriceMovementBadge({ change, showIcon = true }) {
  const isPositive = change > 0;
  const isNeutral = change === 0;

  // Positive change (price increase) = bad (rose/red)
  // Negative change (price decrease) = good (emerald/teal)
  const colorClass = isNeutral
    ? "text-muted-foreground bg-gray-100 dark:bg-neutral-800"
    : isPositive
    ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200"
    : "text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200";

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${colorClass} border-2 shadow-lg`}>
      {showIcon && <Icon className="w-4 h-4" strokeWidth={2.5} />}
      <span>
        {isPositive && "+"}₱{Math.abs(change).toFixed(2)}
      </span>
    </div>
  );
}
