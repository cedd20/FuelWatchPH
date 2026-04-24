import { getBrandLogo, getAcronym } from "../utils/brandMapping";

export function BrandLogoPin({
  brandName,
  price,
  avgPrice,
  isSelected = false,
  onClick,
  showPrice = true,
}) {

  const logoPath = getBrandLogo(brandName);
  const acronym = getAcronym(brandName);

  // Determine border color based on price level
  const getBorderColor = () => {
    if (price <= avgPrice * 0.98) return "border-emerald-500"; // Low
    if (price >= avgPrice * 1.02) return "border-rose-500"; // High
    return "border-yellow-500"; // Average
  };

  const borderColor = getBorderColor();

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        className={`relative rounded-full bg-white dark:bg-neutral-800 shadow-lg transition-all duration-200 ${isSelected ? "scale-125 ring-4 ring-emerald-500/30" : "hover:scale-110"}`}
      >
        <div className={`w-12 h-12 rounded-full p-0.5 ${borderColor} border-4`}>
          <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
            {logoPath ? (
              <img src={logoPath} alt={brandName} className="w-full h-full object-contain p-1" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600">
                <span className="text-[10px] font-black text-white tracking-tighter">
                  {acronym}
                </span>
              </div>
            )}
          </div>
        </div>
        {isSelected && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-neutral-900" />
        )}
      </button>
      {showPrice && (
        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md ${isSelected ? "bg-emerald-500 text-white" : "bg-white dark:bg-neutral-800 text-foreground border border-gray-200 dark:border-neutral-700"}`}>
          ₱{price.toFixed(2)}
        </div>
      )}
    </div>
  );
}

