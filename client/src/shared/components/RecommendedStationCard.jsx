import { MapPin, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { getBrandLogo, getAcronym } from "../utils/brandMapping";

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
  const brandImage = getBrandLogo(brand || name);
  const acronym = getAcronym(brand || name);

  const handleClick = () => {
    navigate(`/app/station/${id}`);
  };

  return (
    <div
      className="relative flex-shrink-0 w-64 h-48 lg:w-full lg:h-56 rounded-3xl overflow-hidden cursor-pointer group shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-emerald-500/30 transition-all hover:scale-105"
      onClick={handleClick}
    >
      {/* Background Image/Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black">
        {brandImage ? (
          <div className="w-full h-full bg-white flex items-center justify-center p-8">
            <img
              src={brandImage}
              alt={brand}
              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-700">
            <span className="text-4xl font-black text-white/20 tracking-tighter uppercase select-none group-hover:scale-110 transition-transform duration-500">
              {acronym}
            </span>
          </div>
        )}
      </div>

      {/* Enhanced Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />


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
            {Number(distance || 0).toFixed(1)} km away
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
