import { MapPin, Clock, ShieldCheck, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";

interface FuelPrice {
  type: string;
  price: number;
}

interface StationCardProps {
  id: string;
  name: string;
  address: string;
  distance: number;
  prices: FuelPrice[];
  lastUpdated: string;
  verified?: boolean;
  onClick?: () => void;
}

export function StationCard({
  id,
  name,
  address,
  distance,
  prices,
  lastUpdated,
  verified = false,
  onClick,
}: StationCardProps) {
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
      className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl lg:rounded-3xl border-2 border-gray-200 dark:border-neutral-700 p-5 lg:p-6 cursor-pointer hover:shadow-2xl hover:scale-[1.01] hover:border-emerald-400/40 transition-all shadow-xl shadow-black/10"
    >
      <div className="flex items-start justify-between mb-4 lg:mb-5">
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
            <span>{lastUpdated}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
          <div className="text-sm lg:text-base text-muted-foreground/80 mb-2 font-bold">{distance} km</div>
          <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-muted-foreground ml-auto" strokeWidth={2.5} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 lg:gap-3">
        {prices.map((fuel) => (
          <div key={fuel.type} className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 backdrop-blur-xl rounded-xl lg:rounded-2xl p-3 lg:p-4 border border-emerald-200/60 dark:border-emerald-800/40 shadow-lg">
            <div className="text-xs lg:text-sm text-muted-foreground/80 mb-1 font-bold">
              {fuel.type}
            </div>
            <div className="font-bold text-foreground text-base lg:text-lg tracking-tight">
              ₱{fuel.price.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
