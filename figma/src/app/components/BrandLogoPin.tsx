import { getPriceLevelColor } from "../utils/fuelTypes";
import { useTheme } from "../context/ThemeContext";
import shellLogo from "../../imports/Shell-Logo.png";
import petronLogo from "../../imports/Petron-Logo.jpg";

interface BrandLogoPinProps {
  brandName: string;
  price: number;
  avgPrice: number;
  isSelected?: boolean;
  onClick: () => void;
  showPrice?: boolean;
}

// Brand logo mapping
const BRAND_LOGOS: Record<string, string> = {
  Shell: shellLogo,
  Petron: petronLogo,
  // For brands without logos, we'll use fallback initials
  Caltex: "",
  Seaoil: "",
  Cleanfuel: "",
  Unioil: "",
  Phoenix: "",
  TotalEnergies: "",
  Jetti: "",
  RePhil: "",
  "Flying V": "",
};

// Brand color mapping for fallback display
const BRAND_COLORS: Record<string, { bg: string; text: string }> = {
  Shell: { bg: "bg-yellow-400", text: "text-red-600" },
  Petron: { bg: "bg-red-600", text: "text-white" },
  Caltex: { bg: "bg-red-700", text: "text-white" },
  Seaoil: { bg: "bg-emerald-600", text: "text-white" },
  Cleanfuel: { bg: "bg-green-600", text: "text-white" },
  Unioil: { bg: "bg-orange-500", text: "text-white" },
  Phoenix: { bg: "bg-red-500", text: "text-white" },
  TotalEnergies: { bg: "bg-red-600", text: "text-white" },
  Jetti: { bg: "bg-emerald-700", text: "text-white" },
  RePhil: { bg: "bg-green-500", text: "text-white" },
  "Flying V": { bg: "bg-orange-600", text: "text-white" },
};

export function BrandLogoPin({
  brandName,
  price,
  avgPrice,
  isSelected = false,
  onClick,
  showPrice = true,
}: BrandLogoPinProps) {
  const { theme } = useTheme();
  const priceLevel = getPriceLevelColor(price, avgPrice, theme === "dark");
  const logoPath = BRAND_LOGOS[brandName];
  const brandColor = BRAND_COLORS[brandName] || { bg: "bg-gray-500", text: "text-white" };

  // Determine border color based on price level
  const getBorderColor = () => {
    if (price <= avgPrice * 0.98) return "border-success"; // Green - Low
    if (price >= avgPrice * 1.02) return "border-destructive"; // Red - High
    return "border-warning"; // Amber - Average
  };

  const borderColor = getBorderColor();

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Pin Marker */}
      <button
        onClick={onClick}
        className={`
          relative rounded-full bg-card shadow-lg
          transition-all duration-200
          ${isSelected ? "scale-125 ring-4 ring-primary/30" : "hover:scale-110"}
        `}
      >
        {/* Border ring with price level color */}
        <div
          className={`
            w-12 h-12 rounded-full p-0.5
            ${borderColor} border-4
            ${isSelected ? "border-4" : "border-3"}
          `}
        >
          {/* Logo container */}
          <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
            {logoPath ? (
              <img
                src={logoPath}
                alt={brandName}
                className="w-full h-full object-cover"
              />
            ) : (
              // Fallback for brands without logos - use brand colors
              <div className={`w-full h-full flex items-center justify-center ${brandColor.bg}`}>
                <span className={`text-xs font-bold ${brandColor.text}`}>
                  {brandName.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Selected indicator dot */}
        {isSelected && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full border-2 border-card" />
        )}
      </button>

      {/* Optional Price Chip */}
    
    </div>
  );
}
