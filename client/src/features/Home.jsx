import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { 
  MapPin, 
  ChevronRight, 
  Loader2,
  Users,
  Building2,
  Map as MapIcon,
  ChevronDown,
  TrendingUp as TrendingUpIcon
} from "lucide-react";

// Relative Imports for stability
import { useStations } from "../hooks/useStations";
import { useAuth } from "../app/providers/AuthContext";
import { getBrandLogo } from "../shared/utils/brandMapping";
import { isValidPrice } from "../shared/utils/priceUtils";
import { PHILIPPINE_CITIES } from "../shared/utils/philippineCities";

// shadcn UI Components (Relative)
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../shared/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../shared/components/ui/chart";
import { Badge } from "../shared/components/ui/badge";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

// Import Mascot Versions
import Mascot1 from "../imports/For Users Already Signed In.png";
import Mascot2 from "../imports/For Users Already Signed In (2).png";
import Mascot3 from "../imports/For Users Already Signed In (3).png";
import Mascot4 from "../imports/For Users Already Signed In (4).png";
import Mascot5 from "../imports/For Users Already Signed In (5).png";

const MASCOTS = [Mascot1, Mascot2, Mascot3, Mascot4, Mascot5];

export function Home() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: allStations = [], isLoading: stationsLoading } = useStations();
  
  const [userLocation, setUserLocation] = useState(null);
  const [cityName, setCityName] = useState("Makati"); 
  const [isLocating, setIsLocating] = useState(true);
  const [selectedFuelType, setSelectedFuelType] = useState("UL91");
  const [currentMascot, setCurrentMascot] = useState(Mascot1);
  const [globalStats, setGlobalStats] = useState(null);

  const fuelTypeMap = {
    "UL91": "Unleaded 91",
    "PR95": "Unleaded 95",
    "PR97": "Unleaded 98",
    "DSL": "Diesel",
    "PDSL": "Premium Diesel"
  };

  const fuelTypes = ["UL91", "PR95", "PR97", "DSL", "PDSL"];

  // Randomize Mascot on Mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * MASCOTS.length);
    setCurrentMascot(MASCOTS[randomIndex]);
  }, []);

  // Greeting based on time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Goodmorning";
    if (hour < 18) return "Goodafternoon";
    return "Goodevening";
  }, []);

  // Fetch Global Stats for Coverage
  useEffect(() => {
    import("../lib/apiClient").then(({ api }) => {
      api.get("/stats/summary").then(data => setGlobalStats(data)).catch(() => {});
    });
  }, []);

  // Get user location and identify closest city
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        
        // 1. First try to find if any station is very close (< 2km) and use its city
        const veryCloseStation = allStations.find(s => {
          const d = Math.sqrt(Math.pow(s.lat - latitude, 2) + Math.pow(s.lng - longitude, 2)) * 111;
          return d < 2;
        });

        if (veryCloseStation) {
          setCityName(veryCloseStation.city);
        } else {
          // 2. Fallback to closest predefined city
          let closest = null;
          let minDisk = Infinity;
          PHILIPPINE_CITIES.forEach(city => {
            const d = Math.sqrt(Math.pow(city.lat - latitude, 2) + Math.pow(city.lng - longitude, 2));
            if (d < minDisk) {
              minDisk = d;
              closest = city;
            }
          });
          if (closest) setCityName(closest.city);
        }
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [allStations]);

  // Data Calculations
  const stats = useMemo(() => {
    if (!allStations.length) return null;

    const cityStations = allStations.filter(s => s.city === cityName);
    const targetCityStations = cityStations.length > 0 ? cityStations : allStations;

    const avgPrices = fuelTypes.map(ft => {
      let prices = cityStations
        .map(s => s.latest_prices?.[ft]?.price)
        .filter(isValidPrice)
        .map(Number);
      
      // If no data in city, use all stations (national average)
      if (prices.length === 0) {
        prices = allStations
          .map(s => s.latest_prices?.[ft]?.price)
          .filter(isValidPrice)
          .map(Number);
      }
      
      return prices.length > 0 ? (prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    });

    const chartData = fuelTypes.map((ft, i) => ({
      fuel: ft,
      price: avgPrices[i]
    })).filter(d => d.price > 0); // Only show fuels with data

    // Nearest Station
    let nearest = null;
    if (userLocation) {
      const stationsWithDist = allStations.map(s => ({
        ...s,
        dist: Math.sqrt(Math.pow(s.lat - userLocation.lat, 2) + Math.pow(s.lng - userLocation.lng, 2)) * 111
      })).sort((a, b) => a.dist - b.dist);
      nearest = stationsWithDist[0];
    } else {
      nearest = allStations[0];
    }

    const cheapest = [...allStations]
      .filter(s => isValidPrice(s.latest_prices?.[selectedFuelType]?.price))
      .sort((a, b) => Number(a.latest_prices[selectedFuelType].price) - Number(b.latest_prices[selectedFuelType].price))[0];

    // Contributors: Unique people who created stations OR reported prices
    const uniqueCreators = new Set(allStations.map(s => s.created_by).filter(Boolean));
    const uniqueReporters = new Set();
    allStations.forEach(s => {
      if (s.latest_prices) {
        Object.values(s.latest_prices).forEach(p => {
          if (p.reported_by) uniqueReporters.add(p.reported_by);
        });
      }
    });
    
    // Combine sets for total contributors
    const totalContributors = new Set([...uniqueCreators, ...uniqueReporters]).size;
    const citiesCount = new Set(allStations.map(s => s.city)).size;

    return {
      chartData,
      nearest,
      cheapest,
      contributors: (globalStats?.active_users || totalContributors).toLocaleString(),
      citiesCount: citiesCount.toLocaleString(),
      stationsCount: allStations.length.toLocaleString()
    };
  }, [allStations, cityName, userLocation, selectedFuelType, globalStats]);

  const chartConfig = {
    price: {
      label: "Avg Price",
      color: "var(--color-emerald-500)",
    },
  };

  if (stationsLoading || isLocating || authLoading) {
    return (
      <div className="min-h-screen bg-[#050A09] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-emerald-500/60 font-bold animate-pulse">Loading FuelWatch...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050A09] text-white pb-24 overflow-x-hidden">
      <div className="max-w-md mx-auto px-5 pt-8 space-y-6">
        
        {/* Header Greeting */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <h1 className="text-xl font-bold tracking-tight">
            {greeting}, <span className="text-emerald-400">{user ? (user.name?.split(' ')[0] || user.username?.split(' ')[0] || "Tankmate") : "Tankmate"}</span>
          </h1>
        </motion.div>

        {/* Mascot Section - Rotating Selection */}
        <motion.div 
          key={currentMascot}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative -mt-4 -mb-2 flex justify-center z-10"
        >
          <div className="w-full max-w-sm">
            <img 
              src={currentMascot} 
              alt="Welcome Tankmates!" 
              className="w-full h-auto object-contain drop-shadow-[0_10px_30px_rgba(16,185,129,0.3)] transform hover:scale-105 transition-transform duration-500" 
            />
          </div>
        </motion.div>

        {/* Avg Price Pattern Chart Section */}
        <Card className="bg-[#0C1A17] border-emerald-500/10 rounded-[2rem] overflow-hidden shadow-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center justify-between text-white">
              Avg Price in <span className="text-warning ml-1">{cityName}</span>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-none font-black text-[10px]">
                <TrendingUpIcon className="w-3 h-3 mr-1" />
                Live Trends
              </Badge>
            </CardTitle>
            <CardDescription className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              Price trends per fuel type
            </CardDescription>
          </CardHeader>
          <CardContent className="px-1 pt-0">
            <ChartContainer config={chartConfig} className="h-56 w-full -ml-4">
              <AreaChart
                accessibilityLayer
                data={stats?.chartData}
                margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
              >
                <defs>
                  <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="#10b981"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor="#10b981"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis
                  dataKey="fuel"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fill: '#888', fontSize: 10, fontWeight: 700 }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={0}
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => `${val}`}
                  tick={{ fill: '#555', fontSize: 9, fontWeight: 600 }}
                />
                <ChartTooltip
                  cursor={{ stroke: '#10b981', strokeWidth: 1 }}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      className="bg-[#0C1A17] border-emerald-500/20 text-white shadow-2xl"
                      labelFormatter={(value) => (
                        <div className="border-emerald-500/20 mb-1 border-b pb-1">
                          <span className="text-[10px] font-bold text-emerald-400">{fuelTypeMap[value] || value}</span>
                        </div>
                      )}
                      formatter={(value, name) => (
                        <div className="flex w-full items-center justify-between gap-4">
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] text-gray-300">Avg Price</span>
                          </div>
                          <span className="text-sm font-black text-white">₱{Number(value).toFixed(2)}</span>
                        </div>
                      )}
                    />
                  }
                />
                <Area
                  dataKey="price"
                  type="monotone"
                  fill="url(#chart-gradient)"
                  stroke="#10b981"
                  strokeWidth={3}
                  activeDot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                  className="drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Nearest Station */}
          <div className="bg-[#0C1A17] rounded-[2rem] p-5 border border-emerald-500/10 flex flex-col items-center text-center">
            <div className="flex items-center justify-center h-6 mb-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nearest</h4>
            </div>
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 p-3 shadow-lg">
              <img src={getBrandLogo(stats?.nearest?.brand || stats?.nearest?.name)} className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 w-full px-2">
              <div className="font-bold text-sm truncate mb-1">{stats?.nearest?.name}</div>
              <div 
                className="flex items-center justify-center gap-1 text-[10px] text-emerald-400 font-bold cursor-pointer"
                onClick={() => navigate(`/app/station/${stats?.nearest?.id}`)}
              >
                {Number(stats?.nearest?.dist || 1.2).toFixed(1)}km away <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Cheapest Station */}
          <div className="bg-[#0C1A17] rounded-[2rem] p-5 border border-emerald-500/10 flex flex-col items-center text-center">
            <div className="flex items-center justify-center h-6 gap-1 mb-4">
               <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cheapest</h4>
               <div className="relative group">
                 <button className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                   {selectedFuelType} <ChevronDown className="w-2 h-2" />
                 </button>
                 <div className="absolute right-0 mt-1 bg-[#1A2E2A] rounded-lg shadow-2xl border border-emerald-500/20 hidden group-hover:block z-20">
                   {fuelTypes.map(ft => (
                     <button 
                       key={ft}
                       onClick={() => setSelectedFuelType(ft)}
                       className="block w-full text-left px-3 py-2 text-[10px] hover:bg-emerald-500/10"
                     >
                       {ft}
                     </button>
                   ))}
                 </div>
               </div>
            </div>
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 p-3 shadow-lg">
              <img src={getBrandLogo(stats?.cheapest?.brand || stats?.cheapest?.name)} className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 w-full px-2">
              <div className="font-bold text-sm truncate mb-1">{stats?.cheapest?.name || "Uno Fuel Leviste"}</div>
              <div 
                className="flex items-center justify-center gap-1 text-[10px] text-emerald-400 font-bold cursor-pointer"
                onClick={() => navigate(`/app/station/${stats?.cheapest?.id}`)}
              >
                {Number(stats?.cheapest?.dist || 2.5).toFixed(1)}km away <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Coverage Section */}
        <div className="bg-[#0C1A17] rounded-[2rem] p-6 border border-emerald-500/10">
          <h3 className="text-center font-bold text-sm mb-6 text-gray-400 uppercase tracking-widest">FuelWatchPH coverage</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#1A2E2A] rounded-2xl p-4 flex flex-col items-center justify-center space-y-1">
              <Users className="w-4 h-4 text-emerald-400/60" />
              <div className="text-lg font-black text-white">{stats?.contributors}</div>
              <div className="text-[9px] font-bold text-emerald-400/60 uppercase">Contributors</div>
            </div>
            <div className="bg-[#1A2E2A] rounded-2xl p-4 flex flex-col items-center justify-center space-y-1">
              <MapIcon className="w-4 h-4 text-emerald-400/60" />
              <div className="text-lg font-black text-white">{stats?.citiesCount}</div>
              <div className="text-[9px] font-bold text-emerald-400/60 uppercase">Cities</div>
            </div>
            <div className="bg-[#1A2E2A] rounded-2xl p-4 flex flex-col items-center justify-center space-y-1">
              <Building2 className="w-4 h-4 text-emerald-400/60" />
              <div className="text-lg font-black text-white">{stats?.stationsCount}</div>
              <div className="text-[9px] font-bold text-emerald-400/60 uppercase">Stations</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
