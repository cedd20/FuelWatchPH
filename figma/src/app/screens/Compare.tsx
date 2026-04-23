import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeftRight, TrendingDown, MapPin } from "lucide-react";
import { FuelTypeChip } from "../components/FuelTypeChip";
import { FUEL_TYPES } from "../utils/fuelTypes";

const fuelTypes = FUEL_TYPES;

const mockStations = [
  {
    id: "1",
    name: "Petron Quezon Avenue",
    distance: 0.5,
    prices: {
      diesel: 55.30,
      premiumdiesel: 59.50,
      unleaded91: 64.50,
      premium95: 68.20,
      premium97: 72.80,
      kerosene: 52.40,
    },
  },
  {
    id: "2",
    name: "Shell EDSA",
    distance: 1.2,
    prices: {
      diesel: 56.10,
      premiumdiesel: 60.20,
      unleaded91: 65.10,
      premium95: 69.00,
      premium97: 73.20,
      kerosene: 53.10,
    },
  },
  {
    id: "3",
    name: "Caltex Commonwealth",
    distance: 2.1,
    prices: {
      diesel: 55.80,
      premiumdiesel: 59.90,
      unleaded91: 64.80,
      premium95: 68.50,
      premium97: 72.90,
      kerosene: 52.80,
    },
  },
  {
    id: "4",
    name: "Seaoil Timog",
    distance: 1.8,
    prices: {
      diesel: 55.00,
      premiumdiesel: 59.20,
      unleaded91: 64.20,
      premium95: 67.90,
      premium97: 72.50,
      kerosene: 52.00,
    },
  },
];

export function Compare() {
  const navigate = useNavigate();
  const [selectedFuelType, setSelectedFuelType] = useState("Diesel");

  const getFuelKey = (type: string) => {
    return type.toLowerCase().replace(/\s+/g, "");
  };

  const getSortedStations = () => {
    const fuelKey = getFuelKey(selectedFuelType) as keyof typeof mockStations[0]["prices"];
    return [...mockStations].sort((a, b) => a.prices[fuelKey] - b.prices[fuelKey]);
  };

  const sortedStations = getSortedStations();
  const lowestPrice = sortedStations[0]?.prices[getFuelKey(selectedFuelType) as keyof typeof sortedStations[0]["prices"]];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-14 pb-10 px-4 lg:px-8 relative overflow-hidden">
        {/* Enhanced radial glow background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg">
              <ArrowLeftRight className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white drop-shadow-2xl tracking-tight">Compare Prices</h1>
          </div>
          <p className="text-white/95 text-sm lg:text-base font-medium drop-shadow-lg pl-1">
            Find the best fuel prices near you
          </p>
        </div>
      </div>

      {/* Fuel Type Selection */}
      <div className="px-4 lg:px-8 py-5 lg:py-6 bg-white dark:bg-neutral-900 backdrop-blur-2xl border-b-2 border-gray-200 dark:border-neutral-700 sticky top-0 lg:static z-40 shadow-lg lg:shadow-none">
        <div className="max-w-6xl lg:mx-auto flex gap-2.5 overflow-x-auto lg:overflow-x-visible scrollbar-hide pb-1 lg:flex-wrap">
          {fuelTypes.map((type) => (
            <FuelTypeChip
              key={type}
              label={type}
              active={selectedFuelType === type}
              onClick={() => setSelectedFuelType(type)}
            />
          ))}
        </div>
      </div>

      {/* Main Content - Desktop 2-Column Layout */}
      <div className="px-4 lg:px-8 py-6 lg:py-10">
        <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            {/* Best Price Banner */}
            <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-3xl p-6 lg:p-8 text-white shadow-2xl shadow-teal-500/25 overflow-hidden">
          {/* Enhanced glow effects */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/12 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-300/15 rounded-full blur-2xl" />
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-teal-200/10 rounded-full blur-3xl" />

          {/* Glass overlay */}
          <div className="absolute inset-0 bg-white/[0.08] backdrop-blur-[1px]" />

              <div className="relative z-10">
                <div className="flex items-center gap-2.5 mb-4 lg:mb-5">
                  <div className="w-9 h-9 lg:w-10 lg:h-10 bg-white/25 backdrop-blur-lg rounded-xl flex items-center justify-center shadow-lg border border-white/30">
                    <TrendingDown className="w-5 h-5 lg:w-6 lg:h-6" strokeWidth={2.5} />
                  </div>
                  <span className="font-bold text-sm lg:text-base tracking-wider uppercase">Lowest Price</span>
                </div>
                <div className="flex items-end justify-between">
                  <div className="flex-1">
                    <div className="text-5xl lg:text-6xl font-bold mb-3 lg:mb-4 drop-shadow-2xl tracking-tighter">
                      ₱{lowestPrice?.toFixed(2)}
                    </div>
                    <div className="text-base lg:text-lg font-bold opacity-95 mb-1.5">{sortedStations[0]?.name}</div>
                    <div className="text-sm lg:text-base opacity-90 flex items-center gap-1.5 font-medium">
                      <MapPin className="w-4 h-4 lg:w-5 lg:h-5" />
                      {sortedStations[0]?.distance} km away
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/app/station/${sortedStations[0]?.id}`)}
                    className="px-6 py-3 lg:px-7 lg:py-3.5 bg-white backdrop-blur-md text-teal-700 rounded-full font-bold text-sm lg:text-base shadow-2xl shadow-black/30 hover:shadow-2xl hover:scale-110 transition-all border-2 border-white/60"
                  >
                    View
                  </button>
                </div>
              </div>

              {/* Subtle edge glow */}
              <div className="absolute inset-0 border border-white/25 rounded-3xl pointer-events-none" />
            </div>

            {/* Comparison List */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-foreground text-lg lg:text-xl tracking-tight">
                  All Stations
                </h3>
                <div className="px-3 py-1.5 bg-muted/50 rounded-full">
                  <span className="text-sm font-bold text-muted-foreground">{sortedStations.length}</span>
                </div>
              </div>
              <div className="space-y-3 lg:space-y-4">
          {sortedStations.map((station, index) => {
            const price = station.prices[getFuelKey(selectedFuelType) as keyof typeof station.prices];
            const isLowest = price === lowestPrice;
            const priceDiff = price - lowestPrice;

            return (
              <div
                key={station.id}
                onClick={() => navigate(`/app/station/${station.id}`)}
                className={`relative bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl rounded-2xl p-6 lg:p-7 border cursor-pointer transition-all hover:shadow-2xl hover:scale-[1.02] ${
                  isLowest
                    ? "border-teal-400/50 ring-2 ring-teal-500/25 shadow-2xl shadow-teal-500/15"
                    : "border-white/40 dark:border-neutral-700/50 shadow-xl shadow-black/5 hover:shadow-emerald-500/15 hover:border-emerald-400/40"
                }`}
              >
                {isLowest && (
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/6 to-teal-500/6 rounded-2xl pointer-events-none" />
                )}

                <div className="relative z-10 flex items-center justify-between gap-4 lg:gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2.5 lg:mb-3">
                      <span className="font-bold text-foreground text-base lg:text-lg truncate">
                        {station.name}
                      </span>
                      {isLowest && (
                        <span className="px-3 py-1 lg:px-4 lg:py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs lg:text-sm rounded-full font-bold shadow-lg shadow-teal-500/30 flex-shrink-0">
                          Best
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm lg:text-base">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                        <span className="font-semibold">{station.distance} km</span>
                      </div>
                      {!isLowest && (
                        <span className="text-rose-600 dark:text-rose-400 font-bold text-sm lg:text-base">
                          +₱{priceDiff.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div
                      className={`text-3xl lg:text-4xl font-bold tracking-tighter leading-none mb-1 ${
                        isLowest ? "text-teal-600 dark:text-teal-500" : "text-foreground"
                      }`}
                    >
                      ₱{price.toFixed(2)}
                    </div>
                    <div className="text-xs lg:text-sm text-muted-foreground/70 font-semibold">per liter</div>
                  </div>
                </div>

                {/* Subtle border glow */}
                <div className={`absolute inset-0 rounded-2xl pointer-events-none ${
                  isLowest ? "border border-teal-400/15" : "border border-white/10 dark:border-neutral-700/20"
                }`} />
              </div>
            );
              })}
              </div>
            </div>
          </div>

          {/* Right Column - Savings Estimator (Sticky on Desktop) */}
          <div className="lg:col-span-1 mt-6 lg:mt-0">
            <div className="lg:sticky lg:top-24">
              <div className="relative bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/30 dark:via-green-950/30 dark:to-teal-950/30 backdrop-blur-2xl border border-emerald-200/60 dark:border-emerald-800/40 rounded-3xl p-6 lg:p-7 shadow-2xl shadow-emerald-500/15 overflow-hidden">
                {/* Subtle glow effect */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-200/20 dark:bg-emerald-400/10 rounded-full blur-3xl" />

                <div className="relative z-10">
                  <h4 className="font-bold text-foreground mb-2 lg:mb-3 text-lg lg:text-xl tracking-tight">
                    Potential Savings
                  </h4>
                  <p className="text-sm lg:text-base text-muted-foreground/90 mb-5 lg:mb-6 font-medium">
                    By choosing the lowest price station, you could save:
                  </p>
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-5">
                    <div className="relative bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-2xl p-5 lg:p-6 text-center shadow-xl shadow-black/10 border border-white/60 dark:border-neutral-700/60 hover:scale-105 transition-transform">
                      <div className="text-xs text-muted-foreground/80 mb-2 lg:mb-3 font-bold uppercase tracking-wide">40L Tank</div>
                      <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        ₱{((sortedStations[sortedStations.length - 1]?.prices[getFuelKey(selectedFuelType) as keyof typeof sortedStations[0]["prices"]] - lowestPrice) * 40).toFixed(2)}
                      </div>
                    </div>
                    <div className="relative bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-2xl p-5 lg:p-6 text-center shadow-xl shadow-black/10 border border-white/60 dark:border-neutral-700/60 hover:scale-105 transition-transform">
                      <div className="text-xs text-muted-foreground/80 mb-2 lg:mb-3 font-bold uppercase tracking-wide">60L Tank</div>
                      <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        ₱{((sortedStations[sortedStations.length - 1]?.prices[getFuelKey(selectedFuelType) as keyof typeof sortedStations[0]["prices"]] - lowestPrice) * 60).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Border glow */}
                <div className="absolute inset-0 border border-white/20 dark:border-white/10 rounded-3xl pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
