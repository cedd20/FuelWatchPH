import { LucideIcon } from "lucide-react";

interface ImprovedKPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor?: string;
}

export function ImprovedKPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
}: ImprovedKPICardProps) {
  const gradientMap: Record<string, string> = {
    "text-warning": "from-amber-400 to-orange-500",
    "text-primary": "from-emerald-500 to-teal-600",
    "text-success": "from-cyan-400 to-sky-500",
    "text-accent": "from-rose-400 to-pink-500",
  };

  const gradient = gradientMap[iconColor] || "from-emerald-500 to-teal-600";

  return (
    <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/20 dark:border-neutral-700/30 rounded-2xl p-5 min-w-[170px] flex-shrink-0 shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-black/10 transition-all hover:scale-105 relative overflow-hidden group">
      {/* Subtle gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent dark:from-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10 flex items-start gap-3">
        <div className={`w-11 h-11 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-black/20`}>
          <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground/80 mb-1 font-medium">{title}</div>
          <div className="text-2xl font-bold text-foreground mb-0.5 tracking-tight">{value}</div>
          <div className="text-xs text-muted-foreground/70">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}
