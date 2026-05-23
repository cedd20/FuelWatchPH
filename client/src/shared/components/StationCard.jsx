import { MapPin, Clock, ShieldCheck, ChevronRight, Navigation } from "lucide-react";
import { useNavigate } from "react-router";
import { StationLogo } from "./StationLogo";
import { formatPrice } from "@/shared/utils/priceUtils";
import { motion } from "framer-motion";

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
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={handleClick}
      className="app-panel group relative cursor-pointer overflow-hidden rounded-[2rem] border border-emerald-500/10 p-5 shadow-2xl shadow-black/20 transition-all hover:border-emerald-500/30 lg:p-6"
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-start gap-4 mb-5">
          <div className="relative">
            <StationLogo name={name} size="md" className="rounded-2xl border border-emerald-500/10 shadow-xl" />
            {verified && (
              <div className="app-panel-muted absolute -right-1 -top-1 rounded-full border border-emerald-500/20 p-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="truncate text-base font-black tracking-tight text-foreground transition-colors group-hover:text-emerald-400 lg:text-lg">
              {name}
            </h3>
            
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <MapPin className="w-3 h-3 text-emerald-500/50" />
              <span className="truncate">{address}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black text-emerald-600 shadow-lg shadow-emerald-500/5 dark:text-emerald-300">
              {distance} KM
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {prices.slice(0, 4).map((fuel) => (
            <div key={fuel.type} className="app-elevated rounded-2xl border border-emerald-500/5 p-3 shadow-lg transition-all hover:border-emerald-500/20">
              <div className="mb-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                {fuel.type}
              </div>
              <div className="text-sm font-black text-foreground lg:text-base">
                {formatPrice(fuel.price)}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-emerald-500/5 pt-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{lastUpdated}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {lat && lng && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
                }}
                className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 shadow-lg shadow-emerald-500/5 transition-all hover:bg-emerald-500 hover:text-white dark:text-emerald-300"
              >
                <Navigation className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="app-elevated rounded-xl p-2 text-muted-foreground transition-colors group-hover:text-emerald-400">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
