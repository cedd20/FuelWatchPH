import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, MapPin, Plus, Bell, Fuel, Building2, Map, TrendingUp, ChevronRight } from "lucide-react";
import { FuelTypeChip } from "@/shared/components/FuelTypeChip";
import { ImprovedKPICard } from "@/shared/components/ImprovedKPICard";
import { QuickActionButton } from "@/shared/components/QuickActionButton";
import { CityCard } from "@/shared/components/CityCard";
import { RecommendedStationCard } from "@/shared/components/RecommendedStationCard";
import { Logo } from "@/shared/components/Logo";
import { FUEL_TYPES } from "@/shared/utils/fuelTypes";

const citiesData = [
  {
    name: "Quezon City",
    stationCount: 245,
    prices: {
      "Diesel": 58.40,
      "Premium Diesel": 62.50,
      "Unleaded 91": 67.20,
      "Premium 95": 71.00,
      "Premium 97": 75.80,
      "Kerosene": 55.30,
    }
  },
  {
    name: "Manila",
    stationCount: 182,
    prices: {
      "Diesel": 58.60,
      "Premium Diesel": 62.70,
      "Unleaded 91": 67.40,
      "Premium 95": 71.20,
      "Premium 97": 76.00,
      "Kerosene": 55.50,
    }
  },
  {
    name: "Makati",
    stationCount: 156,
    prices: {
      "Diesel": 58.80,
      "Premium Diesel": 62.90,
      "Unleaded 91": 67.60,
      "Premium 95": 71.40,
      "Premium 97": 76.20,
      "Kerosene": 55.70,
    }
  },
  {
    name: "Pasig",
    stationCount: 134,
    prices: {
      "Diesel": 58.50,
      "Premium Diesel": 62.60,
      "Unleaded 91": 67.30,
      "Premium 95": 71.10,
      "Premium 97": 75.90,
      "Kerosene": 55.40,
    }
  }
];

const recommendedStationsData = [
  {
    id: "1",
    name: "Petron Quezon Avenue",
    brand: "Petron",
    address: "123 Quezon Ave, Quezon City",
    distance: 0.5,
    prices: {
      "Diesel": 55.30,
      "Premium Diesel": 59.50,
      "Unleaded 91": 64.50,
      "Premium 95": 68.20,
      "Premium 97": 72.80,
      "Kerosene": 52.40,
    },
  },
  {
    id: "2",
    name: "Shell EDSA",
    brand: "Shell",
    address: "456 EDSA, Mandaluyong",
    distance: 1.2,
    prices: {
      "Diesel": 56.10,
      "Premium Diesel": 60.20,
      "Unleaded 91": 65.10,
      "Premium 95": 69.00,
      "Premium 97": 73.20,
      "Kerosene": 53.10,
    },
  },
  {
    id: "3",
    name: "Caltex Commonwealth",
    brand: "Caltex",
    address: "789 Commonwealth Ave, QC",
    distance: 2.1,
    prices: {
      "Diesel": 55.80,
      "Premium Diesel": 59.90,
      "Unleaded 91": 64.80,
      "Premium 95": 68.50,
      "Premium 97": 72.90,
      "Kerosene": 52.80,
    },
  }
];

const fuelPriceData = {
  "Diesel": { avg: 58.40, change: 0.35 },
  "Premium Diesel": { avg: 62.50, change: 0.30 },
  "Unleaded 91": { avg: 67.20, change: 0.40 },
  "Premium 95": { avg: 71.00, change: 0.35 },
  "Premium 97": { avg: 75.80, change: 0.40 },
  "Kerosene": { avg: 55.30, change: 0.30 },
};

export function Home() {
  const navigate = useNavigate();
  const [selectedFuelType, setSelectedFuelType] = useState("Diesel");
  const [searchQuery, setSearchQuery] = useState("");

  const currentFuelData = fuelPriceData[selectedFuelType] || fuelPriceData["Diesel"];

  const recommendedStations = recommendedStationsData.map(station => ({
    id: station.id,
    name: station.name,
    brand: station.brand,
    address: station.address,
    distance: station.distance,
    lowestPrice: station.prices[selectedFuelType],
    fuelType: selectedFuelType,
  })).sort((a, b) => a.lowestPrice - b.lowestPrice);

  const cities = citiesData.map(city => ({
    name: city.name,
    stationCount: city.stationCount,
    avgPrice: `₱${city.prices[selectedFuelType].toFixed(2)}/L`,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900">
      <div className="lg:hidden relative z-20 px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <Logo size="sm" className="drop-shadow-lg" />
          <button
            onClick={() => navigate("/app/notifications")}
            className="w-11 h-11 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-xl rounded-full flex items-center justify-center relative shadow-xl shadow-black/10 hover:bg-white dark:hover:bg-neutral-700 transition-all hover:scale-110 border border-white/40 dark:border-neutral-700/50"
          >
            <Bell className="w-5 h-5 text-gray-700 dark:text-white" />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/60 ring-2 ring-white" />
          </button>
        </div>
      </div>

      <div className="px-4 lg:px-8 lg:pt-6 pb-6 lg:pb-8">
        <div className="max-w-6xl mx-auto relative rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

          <div className="absolute inset-0 opacity-60">
            <img
              src="https://images.unsplash.com/photo-1710172510070-9c130a9a310a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200"
              alt="Gas Station"
              className="w-full h-full object-cover"
              style={{
                maskImage: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.2) 100%)',
                WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.2) 100%)',
              }}
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

          <button
            onClick={() => navigate("/app/notifications")}
            className="hidden lg:flex absolute top-6 right-6 z-20 w-11 h-11 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-xl rounded-full items-center justify-center shadow-xl shadow-black/20 hover:bg-white dark:hover:bg-neutral-700 transition-all hover:scale-110 border border-white/40 dark:border-neutral-700/50"
          >
            <Bell className="w-5 h-5 text-gray-700 dark:text-white" />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/60 ring-2 ring-white dark:ring-neutral-800" />
          </button>

          <div className="relative z-10 px-6 lg:px-12 py-8 lg:py-12 flex flex-col items-center text-center space-y-5 lg:space-y-6">
            <h1 className="text-4xl lg:text-5xl font-bold text-white drop-shadow-2xl tracking-tight">
              FuelWatch PH
            </h1>

            <div className="flex items-center gap-2 text-white/95">
              <MapPin className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="text-sm lg:text-base font-medium drop-shadow-lg">Quezon City, Metro Manila</span>
            </div>

            <div className="relative w-full lg:max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-gray-500 z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stations or locations"
                className="w-full pl-11 lg:pl-12 pr-4 py-2.5 lg:py-3.5 bg-white backdrop-blur-lg rounded-full border-2 border-white/60 focus:outline-none focus:ring-2 focus:ring-white/80 shadow-xl shadow-black/20 focus:shadow-2xl focus:shadow-white/30 transition-all placeholder:text-gray-500 text-sm lg:text-base font-medium"
              />
            </div>
          </div>

          <div className="absolute inset-0 border border-white/20 rounded-3xl pointer-events-none" />
        </div>
      </div>

      <div className="px-4 lg:px-8 py-8 lg:py-10 space-y-8 lg:space-y-10">
        <div className="max-w-6xl mx-auto space-y-8 lg:space-y-10">
          <div>
            <h3 className="text-base lg:text-lg font-bold text-foreground mb-4 lg:mb-5 tracking-tight">Select Fuel Type</h3>
            <div className="flex gap-2.5 overflow-x-auto lg:overflow-x-visible pb-2 scrollbar-hide lg:flex-wrap">
              {FUEL_TYPES.map((type) => (
                <FuelTypeChip
                  key={type}
                  label={type}
                  active={selectedFuelType === type}
                  onClick={() => setSelectedFuelType(type)}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide lg:overflow-x-visible lg:grid lg:grid-cols-3 lg:gap-4">
            <ImprovedKPICard
              title={`${selectedFuelType} Avg`}
              value={`₱${currentFuelData.avg.toFixed(2)}/L`}
              subtitle="Updated today"
              icon={Fuel}
              iconColor="text-warning"
            />
            <ImprovedKPICard
              title="Stations"
              value="1,284"
              subtitle="Community listed"
              icon={Building2}
              iconColor="text-accent"
            />
            <ImprovedKPICard
              title="Areas"
              value="42"
              subtitle="Cities covered"
              icon={Map}
              iconColor="text-success"
            />
          </div>

          <div className="flex gap-4 lg:max-w-md">
            <QuickActionButton
              label="Add Station"
              icon={Plus}
              onClick={() => navigate("/app/add-station")}
              variant="primary"
            />
            <QuickActionButton
              label="My Updates"
              icon={TrendingUp}
              onClick={() => navigate("/app/contributions")}
              variant="secondary"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4 lg:mb-5">
              <h3 className="text-lg font-bold text-foreground">Browse by City</h3>
              <button
                onClick={() => navigate("/app/map")}
                className="hidden lg:flex text-sm font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 bg-clip-text text-transparent items-center gap-1 hover:gap-2 transition-all"
              >
                View all
                <ChevronRight className="w-4 h-4 text-emerald-600" />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide lg:overflow-x-visible lg:grid lg:grid-cols-4 lg:gap-4">
              {cities.map((city) => (
                <CityCard
                  key={city.name}
                  name={city.name}
                  stationCount={city.stationCount}
                  avgPrice={city.avgPrice}
                  fuelType={selectedFuelType}
                  onClick={() => navigate("/app/map")}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-foreground">Recommended for You</h3>
              <button
                onClick={() => navigate("/app/map")}
                className="text-sm lg:text-base font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 bg-clip-text text-transparent flex items-center gap-1 hover:gap-2 transition-all"
              >
                View all
                <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600" />
              </button>
            </div>
            <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 lg:overflow-x-visible lg:grid lg:grid-cols-3 lg:gap-4 lg:mx-0 lg:px-0">
              {recommendedStations.map((station) => (
                <RecommendedStationCard key={station.id} {...station} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
