import { X } from "lucide-react";

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

export function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-bold border-2 border-emerald-300 dark:border-emerald-800 shadow-lg">
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="hover:bg-emerald-200 dark:hover:bg-emerald-900 rounded-full p-0.5 transition-colors"
      >
        <X className="w-3 h-3" strokeWidth={2.5} />
      </button>
    </div>
  );
}
