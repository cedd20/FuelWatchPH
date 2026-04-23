import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeftRight, TrendingDown, MapPin } from "lucide-react";
import { FuelTypeChip } from "@/shared/components/FuelTypeChip";
import { FUEL_TYPES } from "@/shared/utils/fuelTypes";

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

  const getFuelKey = (type) => {
    return type.toLowerCase().replace(/\s+/g, "");
  };

  const currentFuelKey = getFuelKey(selectedFuelType);

  const getSortedStations = () => {
    return [...mockStations].sort((a, b) => (a.prices[currentFuelKey] || 0) - (b.prices[currentFuelKey] || 0));
  };

  const sortedStations = getSortedStations();
  const lowestStation = sortedStations[0];
  const lowestPrice = lowestStation?.prices[currentFuelKey] || 0;
  const highestPrice = sortedStations[sortedStations.length - 1]?.prices[currentFuelKey] || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 pb-20">
      <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-14 pb-10 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
             <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <ArrowLeftRight className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Compare Prices</h1>
          </div>
          <p className="text-white/90 font-medium">Find the best fuel prices near you</p>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800 sticky top-0 z-40 px-4 py-4">
        <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide">
          {fuelTypes.map((type) => (
            <FuelTypeChip key={type} label={type} active={selectedFuelType === type} onClick={() => setSelectedFuelType(type)} />
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-8">
        {/* Best Price Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <TrendingDown className="w-6 h-6" />
              <span className="font-bold uppercase tracking-widest text-sm">Lowest Price Today</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-6xl font-bold mb-2">₱{lowestPrice.toFixed(2)}</div>
                <div className="text-xl font-bold opacity-90">{lowestStation.name}</div>
                <div className="flex items-center gap-2 opacity-80 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{lowestStation.distance} km away</span>
                </div>
              </div>
              <button 
                onClick={() => navigate(`/app/station/${lowestStation.id}`)}
                className="bg-white text-emerald-600 px-8 py-4 rounded-2xl font-bold shadow-lg hover:scale-105 transition-all"
              >
                View Station
              </button>
            </div>
          </div>
        </div>

        {/* Comparison List */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-foreground">Available Stations</h3>
          {sortedStations.map((station) => {
            const price = station.prices[currentFuelKey] || 0;
            const diff = price - lowestPrice;
            return (
              <div 
                key={station.id}
                onClick={() => navigate(`/app/station/${station.id}`)}
                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 ${price === lowestPrice ? "border-emerald-500 bg-emerald-50/50" : "border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-lg text-foreground">{station.name}</div>
                    <div className="flex items-center gap-4 text-sm mt-1">
                      <span className="text-muted-foreground font-medium">{station.distance} km away</span>
                      {diff > 0 && <span className="text-rose-600 font-bold">+₱{diff.toFixed(2)}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${price === lowestPrice ? "text-emerald-600" : "text-foreground"}`}>₱{price.toFixed(2)}</div>
                    <div className="text-xs font-bold text-muted-foreground">per liter</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
