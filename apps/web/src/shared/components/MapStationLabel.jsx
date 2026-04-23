import { getBrandAbbreviation, getPriceLevelColor } from "@/shared/utils/fuelTypes";
import { useTheme } from "@/app/providers/ThemeContext";



export function MapStationLabel({
  brandName,
  price,
  avgPrice,
  isSelected = false,
  onClick,
}: MapStationLabelProps) {
  const { theme } = useTheme();
  const brandAbbr = getBrandAbbreviation(brandName);
  const priceLevel = getPriceLevelColor(price, avgPrice, theme === "dark");

  // Always show color coding
  const baseStyles = isSelected
    ? `${priceLevel.bg} ${priceLevel.border} border-2 ${priceLevel.text} scale-110`
    : `${priceLevel.bg} ${priceLevel.border} border ${priceLevel.text}`;

  return (
    <button
      onClick={onClick}
      className={`
        px-2.5 py-1.5 rounded-md font-medium text-xs
        transition-all shadow-md
        ${baseStyles}
        hover:scale-105
      `}
    >
      <div className="flex items-center gap-1">
        <span className="font-semibold">{brandAbbr}</span>
        <span>{price.toFixed(0)}</span>
      </div>
    </button>
  );
}
