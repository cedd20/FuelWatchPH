import { LucideIcon } from "lucide-react";

interface QuickActionButtonProps {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

export function QuickActionButton({
  label,
  icon: Icon,
  onClick,
  variant = "secondary",
}: QuickActionButtonProps) {
  const variantStyles =
    variant === "primary"
      ? "bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white shadow-2xl shadow-emerald-500/50 hover:shadow-emerald-500/70 hover:scale-105 border-2 border-emerald-400/30"
      : "bg-white dark:bg-neutral-900 backdrop-blur-xl border-2 border-gray-200 dark:border-neutral-700 text-foreground hover:bg-gray-50 dark:hover:bg-neutral-800 shadow-xl shadow-black/10 hover:shadow-2xl hover:scale-105";

  return (
    <button
      onClick={onClick}
      className={`flex-1 px-5 py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all ${variantStyles}`}
    >
      <Icon className="w-4 h-4" strokeWidth={2.5} />
      <span>{label}</span>
    </button>
  );
}
