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
      className="group relative bg-[#0C1A17] rounded-[2rem] border border-emerald-500/10 p-5 lg:p-6 cursor-pointer shadow-2xl shadow-black/40 hover:border-emerald-500/30 transition-all overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-start gap-4 mb-5">
          <div className="relative">
            <StationLogo name={name} size="md" className="rounded-2xl shadow-xl border border-emerald-500/10" />
            {verified && (
              <div className="absolute -top-1 -right-1 bg-[#050A09] p-0.5 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-white text-base lg:text-lg tracking-tight truncate group-hover:text-emerald-400 transition-colors">
              {name}
            </h3>
            
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 font-bold">
              <MapPin className="w-3 h-3 text-emerald-500/50" />
              <span className="truncate">{address}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
              {distance} KM
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {prices.slice(0, 4).map((fuel) => (
            <div key={fuel.type} className="bg-[#1A2E2A] rounded-2xl p-3 border border-emerald-500/5 hover:border-emerald-500/20 transition-all shadow-lg">
              <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">
                {fuel.type}
              </div>
              <div className="font-black text-white text-sm lg:text-base">
                {formatPrice(fuel.price)}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-emerald-500/5">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-bold">
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
                className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/5"
              >
                <Navigation className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="p-2 bg-[#1A2E2A] text-gray-400 rounded-xl group-hover:text-emerald-400 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
  );
}
