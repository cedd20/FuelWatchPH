export function FuelTypeChip({ label, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
        active
          ? "bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white shadow-xl shadow-emerald-500/50 scale-105 border-2 border-emerald-400/40"
          : "bg-white dark:bg-neutral-800 backdrop-blur-md text-muted-foreground hover:bg-gray-50 dark:hover:bg-neutral-700 shadow-lg hover:shadow-xl hover:scale-105 border-2 border-gray-200 dark:border-neutral-700"
      }`}
    >
      {label}
    </button>
  );
}
