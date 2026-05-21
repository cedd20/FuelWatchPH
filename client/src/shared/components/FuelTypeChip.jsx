export function FuelTypeChip({ label, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative shrink-0 rounded-full px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out ${
        active
          ? "bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white border border-emerald-300/35 shadow-[0_6px_16px_rgba(16,185,129,0.16),0_2px_6px_rgba(15,23,42,0.1)] dark:border-emerald-300/28 dark:shadow-[0_0_0_1px_rgba(110,231,183,0.12),0_8px_18px_rgba(3,8,7,0.34),0_0_18px_rgba(16,185,129,0.16)] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(16,185,129,0.2),0_3px_8px_rgba(15,23,42,0.12)] dark:hover:shadow-[0_0_0_1px_rgba(110,231,183,0.14),0_10px_22px_rgba(3,8,7,0.38),0_0_22px_rgba(16,185,129,0.2)]"
          : "bg-white/96 dark:bg-neutral-800/96 backdrop-blur-md text-muted-foreground border border-gray-200/90 dark:border-neutral-700/90 shadow-[0_6px_16px_rgba(15,23,42,0.07),0_1px_5px_rgba(15,23,42,0.05)] hover:bg-gray-50 dark:hover:bg-neutral-700 hover:-translate-y-0.5 hover:shadow-[0_9px_20px_rgba(15,23,42,0.1),0_3px_8px_rgba(15,23,42,0.07)]"
      }`}
    >
      {label}
    </button>
  );
}
