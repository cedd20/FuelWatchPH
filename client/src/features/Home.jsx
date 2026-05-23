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
import { resolveCityFromCoordinates } from "../shared/utils/location";

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
  const [fuelDropdownOpen, setFuelDropdownOpen] = useState(false);
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

  // Haversine formula for accurate distance calculation
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

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
    // 1. First check if a city filter is selected on the maps via localStorage
    let mapCity = null;
    try {
      const storedFilters = JSON.parse(localStorage.getItem("fuelwatch_map_filters"));
      if (storedFilters && storedFilters.location === "city" && storedFilters.selectedCity) {
        mapCity = storedFilters.selectedCity;
      } else {
        const storedState = JSON.parse(localStorage.getItem("fuelwatch_map_state"));
        if (storedState?.appliedFilters && storedState.appliedFilters.location === "city" && storedState.appliedFilters.selectedCity) {
          mapCity = storedState.appliedFilters.selectedCity;
        }
      }
    } catch (e) {
      console.error('⚠️ Error reading map storage for city:', e);
    }

    if (mapCity) {
      console.log('🗺️ Map selected city detected:', mapCity);
      setCityName(mapCity);
    }

    if (!("geolocation" in navigator)) {
      console.warn('⚠️ Geolocation not available');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const accuracy = position.coords.accuracy;
        console.log('📍 GPS Detected:', { latitude, longitude, accuracy: accuracy.toFixed(0) + 'm' });
        setUserLocation({ lat: latitude, lng: longitude });

        // If we already have a map-selected city, we don't overwrite it with the GPS resolved city
        if (mapCity) {
          setIsLocating(false);
          return;
        }

        try {
          // Resolve exact city using reverse geocoding
          const resolved = await resolveCityFromCoordinates(latitude, longitude);
          if (resolved?.city) {
            console.log('🏙️ Reverse geocoded city:', resolved.city);
            setCityName(resolved.city);
            setIsLocating(false);
            return;
          }
        } catch (err) {
          console.error('⚠️ Reverse geocoding failed:', err);
        }
        
        // Calculate distance to all stations and log nearby ones
        const stationsWithDistance = allStations.map(s => ({
          ...s,
          dist: calculateDistance(latitude, longitude, s.lat, s.lng)
        })).sort((a, b) => a.dist - b.dist);

        // Log top 5 nearest stations for debugging
        console.log('📊 Top 5 nearest stations:', stationsWithDistance.slice(0, 5).map(s => ({ name: s.name, city: s.city, dist: s.dist.toFixed(2) + 'km' })));
        
        // 1. First try to find if any station is within 50km and use its city
        const closeStations = stationsWithDistance.filter(s => s.dist <= 50);

        if (closeStations.length > 0) {
          const closestStation = closeStations[0];
          console.log('🏢 Closest station found:', closestStation.city, `(${closestStation.dist.toFixed(2)}km)`);
          setCityName(closestStation.city);
        } else {
          // 2. Fallback to closest predefined city using accurate calculation
          let closest = null;
          let minDistance = Infinity;
          PHILIPPINE_CITIES.forEach(city => {
            const d = calculateDistance(latitude, longitude, city.lat, city.lng);
            if (d < minDistance) {
              minDistance = d;
              closest = city;
            }
          });
          console.log('🏙️ No stations within 50km. Nearest city:', closest?.city, `(${minDistance.toFixed(2)}km)`);
          if (closest) setCityName(closest.city);
        }
        setIsLocating(false);
      },
      (error) => {
        console.error('❌ Geolocation failed:', error.message);
        // If we have a map-selected city, keep it. Otherwise fall back to Makati
        if (!mapCity) {
          console.log('ℹ️ Using default city: Makati');
          setCityName("Makati");
        }
        setIsLocating(false);
      },
      { 
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }, [allStations]);

  // Data Calculations
  const stats = useMemo(() => {
    if (!allStations.length) return null;

    // Find predefined city coordinates as fallback reference
    let referenceLocation = null;
    if (cityName) {
      const matchedCityObj = PHILIPPINE_CITIES.find(c => c.city.toLowerCase() === cityName.toLowerCase());
      if (matchedCityObj) {
        referenceLocation = { lat: matchedCityObj.lat, lng: matchedCityObj.lng };
      }
    }

    const calcLoc = userLocation || referenceLocation;

    // Get stations in user's city
    const cityStations = allStations.filter(s => s.city === cityName);
    
    // If no stations in city, also include nearby stations (within 15km radius)
    let relevantStations = cityStations;
    if (cityStations.length === 0 && calcLoc) {
      relevantStations = allStations
        .map(s => ({
          ...s,
          dist: calculateDistance(calcLoc.lat, calcLoc.lng, s.lat, s.lng)
        }))
        .filter(s => s.dist <= 15)
        .map(({ dist, ...s }) => s);
      console.log(`📊 No stations in ${cityName}, using ${relevantStations.length} nearby stations within 15km`);
    }

    const avgPrices = fuelTypes.map(ft => {
      let prices = relevantStations
        .map(s => s.latest_prices?.[ft]?.price)
        .filter(isValidPrice)
        .map(Number);
      
      // If still no data, use all stations (national average)
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
    if (calcLoc) {
      const stationsWithDist = allStations.map(s => ({
        ...s,
        dist: calculateDistance(calcLoc.lat, calcLoc.lng, s.lat, s.lng)
      })).sort((a, b) => a.dist - b.dist);
      nearest = stationsWithDist[0];
      console.log('📍 Nearest Station:', { name: nearest?.name, dist: nearest?.dist?.toFixed(2) + 'km' });
    } else {
      nearest = allStations[0];
    }

    // Cheapest Station (Location-based - within 30km radius)
    let cheapest = null;
    if (calcLoc) {
      // Only consider stations within 30km of calcLoc
      const nearbyStations = allStations
        .map(s => ({
          ...s,
          dist: calculateDistance(calcLoc.lat, calcLoc.lng, s.lat, s.lng)
        }))
        .filter(s => s.dist <= 30)
        .filter(s => isValidPrice(s.latest_prices?.[selectedFuelType]?.price))
        .sort((a, b) => Number(a.latest_prices[selectedFuelType].price) - Number(b.latest_prices[selectedFuelType].price));
      
      if (nearbyStations.length > 0) {
        cheapest = nearbyStations[0];
        console.log('💰 Cheapest Station (within 30km):', { 
          name: cheapest?.name, 
          fuelType: selectedFuelType, 
          price: cheapest?.latest_prices?.[selectedFuelType]?.price, 
          dist: cheapest?.dist?.toFixed(2) + 'km' 
        });
      } else {
        // If no stations within 30km, find cheapest from entire list
        const allValidCheapest = [...allStations]
          .filter(s => isValidPrice(s.latest_prices?.[selectedFuelType]?.price))
          .map(s => ({
            ...s,
            dist: calculateDistance(calcLoc.lat, calcLoc.lng, s.lat, s.lng)
          }))
          .sort((a, b) => Number(a.latest_prices[selectedFuelType].price) - Number(b.latest_prices[selectedFuelType].price));
        
        if (allValidCheapest.length > 0) {
          cheapest = allValidCheapest[0];
          console.log('⚠️ No stations within 30km, showing cheapest nationally:', { 
            name: cheapest?.name, 
            dist: cheapest?.dist?.toFixed(2) + 'km' 
          });
        }
      }
    } else {
      // Fallback when no user location or reference location
      const validCheapest = [...allStations]
        .filter(s => isValidPrice(s.latest_prices?.[selectedFuelType]?.price))
        .sort((a, b) => Number(a.latest_prices[selectedFuelType].price) - Number(b.latest_prices[selectedFuelType].price));
      
      if (validCheapest.length > 0) {
        cheapest = validCheapest[0];
      }
    }

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
      <div className="app-shell min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-emerald-500/60 font-bold animate-pulse">Loading FuelWatch...</p>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen overflow-x-hidden pb-24 text-foreground">
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
        <Card className="app-panel overflow-hidden rounded-[2rem] border-emerald-500/10 shadow-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-lg font-bold text-foreground">
              <div>Price in <span className="text-warning ml-1">{cityName}</span></div>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-none font-black text-[10px]">
                <TrendingUpIcon className="w-3 h-3 mr-1" />
                Live Trends
              </Badge>
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
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
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(120, 145, 138, 0.22)" />
                <XAxis
                  dataKey="fuel"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fill: 'var(--app-text-muted)', fontSize: 10, fontWeight: 700 }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={0}
                  domain={['auto', 'auto']}
                  tickFormatter={(val) => `${val}`}
                  tick={{ fill: 'var(--app-text-muted)', fontSize: 9, fontWeight: 600 }}
                />
                <ChartTooltip
                  cursor={{ stroke: '#10b981', strokeWidth: 1 }}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      className="app-panel-strong border-emerald-500/20 shadow-2xl"
                      labelFormatter={(value) => (
                        <div className="border-emerald-500/20 mb-1 border-b pb-1">
                          <span className="text-[10px] font-bold text-emerald-400">{fuelTypeMap[value] || value}</span>
                        </div>
                      )}
                      formatter={(value, name) => (
                        <div className="flex w-full items-center justify-between gap-4">
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] text-muted-foreground">Avg Price</span>
                          </div>
                          <span className="text-sm font-black text-foreground">₱{Number(value).toFixed(2)}</span>
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
          <div className="app-panel flex flex-col items-center rounded-[2rem] border border-emerald-500/10 p-5 text-center">
            <div className="flex items-center justify-center h-6 mb-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nearest</h4>
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
          <div className="app-panel flex flex-col items-center rounded-[2rem] border border-emerald-500/10 p-5 text-center">
            <div className="flex items-center justify-center h-6 gap-1 mb-4">
               <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cheapest</h4>
               <div className="relative">
                 <button 
                   onClick={() => setFuelDropdownOpen(!fuelDropdownOpen)}
                   className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 hover:bg-emerald-500/30 transition-colors"
                 >
                   {selectedFuelType} <ChevronDown className="w-2 h-2" />
                 </button>
                 {fuelDropdownOpen && (
                   <div className="app-panel-strong absolute right-0 z-20 mt-1 min-w-fit rounded-lg border border-emerald-500/20 shadow-2xl">
                     {fuelTypes.map(ft => (
                       <button 
                         key={ft}
                         onClick={() => {
                           setSelectedFuelType(ft);
                           setFuelDropdownOpen(false);
                         }}
                         className={`block w-full text-left px-3 py-2 text-[10px] transition-colors ${
                           selectedFuelType === ft 
                             ? 'bg-emerald-500/20 text-emerald-400' 
                             : 'hover:bg-emerald-500/10'
                         }`}
                       >
                         {ft}
                       </button>
                     ))}
                   </div>
                 )}
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
        <div className="app-panel rounded-[2rem] border border-emerald-500/10 p-6">
          <h3 className="mb-6 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground">FuelWatchPH coverage</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="app-elevated flex flex-col items-center justify-center space-y-1 rounded-2xl p-4">
              <Users className="w-4 h-4 text-emerald-400/60" />
              <div className="text-lg font-black text-foreground">{stats?.contributors}</div>
              <div className="text-[9px] font-bold text-emerald-400/60 uppercase">Contributors</div>
            </div>
            <div className="app-elevated flex flex-col items-center justify-center space-y-1 rounded-2xl p-4">
              <MapIcon className="w-4 h-4 text-emerald-400/60" />
              <div className="text-lg font-black text-foreground">{stats?.citiesCount}</div>
              <div className="text-[9px] font-bold text-emerald-400/60 uppercase">Cities</div>
            </div>
            <div className="app-elevated flex flex-col items-center justify-center space-y-1 rounded-2xl p-4">
              <Building2 className="w-4 h-4 text-emerald-400/60" />
              <div className="text-lg font-black text-foreground">{stats?.stationsCount}</div>
              <div className="text-[9px] font-bold text-emerald-400/60 uppercase">Stations</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
