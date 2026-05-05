import { MapPin, Clock, ShieldCheck, ChevronRight, Navigation } from "lucide-react";
import { useNavigate } from "react-router";
import { StationLogo } from "./StationLogo";
import { formatPrice } from "@/shared/utils/priceUtils";

export function StationCard({
  id,
  name,
  address,
  distance,
  prices = [],
  lastUpdated,
  verified = false,
  lat,
  lng,
  onClick,
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/app/station/${id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white dark:bg-neutral-900 rounded-2xl lg:rounded-3xl border-2 border-gray-200 dark:border-neutral-700 p-5 lg:p-6 cursor-pointer hover:shadow-2xl hover:scale-[1.01] hover:border-emerald-400/40 transition-all shadow-xl shadow-black/10"
    >
      <div className="flex items-start gap-4 lg:gap-5 mb-4 lg:mb-5">
        <StationLogo name={name} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-foreground text-base lg:text-lg truncate">{name}</h3>
            {verified && (
              <ShieldCheck className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" strokeWidth={2.5} />
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm lg:text-base text-muted-foreground/80 mb-1.5 font-medium">
            <MapPin className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" strokeWidth={2.5} />
            <span className="truncate">{address}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs lg:text-sm text-muted-foreground/70 font-semibold">
            <Clock className="w-3.5 h-3.5 lg:w-4 lg:h-4 flex-shrink-0" strokeWidth={2.5} />
            <span>Updated {lastUpdated}</span>
          </div>
        </div>
        <div className="flex flex-col items-end flex-shrink-0 ml-3 lg:ml-4 gap-2">
          <div className="text-xs lg:text-sm text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
            {distance} km
          </div>
          <div className="mt-auto flex items-center gap-1.5">
            {lat && lng && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
                }}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors border border-blue-200 dark:border-blue-800 shadow-sm hover:scale-105"
                title="Directions"
              >
                <Navigation className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            )}
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors border border-gray-200 dark:border-neutral-700 shadow-sm hover:scale-105">
              <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:gap-3">
        {prices.slice(0, 4).map((fuel) => (
          <div key={fuel.type} className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl lg:rounded-2xl p-3 lg:p-4 border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm">
            <div className="text-xs text-muted-foreground/80 mb-1 font-bold">
              {fuel.type}
            </div>
            <div className="font-bold text-foreground text-sm lg:text-base tracking-tight">
              {formatPrice(fuel.price)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
