import { MapPin, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import shellLogo from "../../imports/Shell-Logo.png";
import petronLogo from "../../imports/Petron-Logo.jpg";

// Brand logo mapping
const BRAND_IMAGES = {
  Shell: shellLogo,
  Petron: petronLogo,
};

// Brand background colors for fallback
const BRAND_GRADIENTS = {
  Shell: "from-yellow-400 to-red-500",
  Petron: "from-red-600 to-red-800",
  Caltex: "from-red-700 to-red-900",
  Seaoil: "from-emerald-600 to-teal-800",
  Cleanfuel: "from-green-600 to-green-800",
  Unioil: "from-orange-500 to-orange-700",
  Phoenix: "from-red-500 to-orange-600",
  TotalEnergies: "from-red-600 to-pink-700",
  Jetti: "from-emerald-700 to-teal-900",
  RePhil: "from-green-500 to-green-700",
  "Flying V": "from-orange-600 to-red-600",
};

export function RecommendedStationCard({
  id,
  name,
  brand,
  address,
  distance,
  lowestPrice,
  fuelType,
}) {
  const navigate = useNavigate();
  const brandImage = BRAND_IMAGES[brand];
  const brandGradient = BRAND_GRADIENTS[brand] || "from-gray-600 to-gray-800";

  const handleClick = () => {
    navigate(`/app/station/${id}`);
  };

  return (
    <div
      className="relative flex-shrink-0 w-64 h-48 lg:w-full lg:h-56 rounded-3xl overflow-hidden cursor-pointer group shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-emerald-500/30 transition-all hover:scale-105"
      onClick={handleClick}
    >
      {/* Background Image/Gradient */}
      {brandImage ? (
        <div className="absolute inset-0">
          <img
            src={brandImage}
            alt={brand}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${brandGradient}`} />
      )}

      {/* Enhanced Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />

      {/* Subtle edge glow */}
      <div className="absolute inset-0 border border-white/10 rounded-3xl group-hover:border-emerald-400/30 transition-colors" />

      {/* Open Button - Top Left - Floating Glass Pill */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        className="absolute top-3 left-3 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full text-xs font-bold text-gray-900 flex items-center gap-1 hover:bg-white transition-all shadow-lg shadow-black/20 hover:scale-110 z-10"
      >
        Open
        <ArrowRight className="w-3 h-3" />
      </button>

      {/* Content - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-5 text-white z-10">
        <h3 className="font-bold text-lg mb-1.5 line-clamp-1 drop-shadow-lg">{name}</h3>
        <div className="flex items-center gap-1.5 text-sm text-white/95 mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{address}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-white/90 font-medium">
            {distance?.toFixed(1) || 0} km away
          </div>
          {lowestPrice && fuelType && (
            <div className="bg-white/25 backdrop-blur-lg px-3 py-1.5 rounded-full border border-white/20 shadow-lg">
              <div className="text-xs font-bold">
                {fuelType} ₱{lowestPrice.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hover Effect with subtle glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-600/0 via-transparent to-transparent group-hover:from-emerald-600/20 transition-all duration-300" />
    </div>
  );
}
