import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowRight,
  ArrowRightLeft,
  Building2,
  ChevronDown,
  ChevronRight,
  Droplets,
  Loader2,
  Map as MapIcon,
  MapPin,
  MapPinned,
  TrendingUp,
  TrendingUp as TrendingUpIcon,
  Users,
} from "lucide-react";

import { useAuth } from "@/app/providers/AuthContext";
import { useTheme } from "@/app/providers/ThemeContext";
import { useStations } from "@/hooks/useStations";
import { useSummaryStats } from "@/hooks/useUsers";
import Mascot1 from "@/imports/For Users Already Signed In.png";
import Mascot2 from "@/imports/For Users Already Signed In (2).png";
import Mascot3 from "@/imports/For Users Already Signed In (3).png";
import Mascot4 from "@/imports/For Users Already Signed In (4).png";
import Mascot5 from "@/imports/For Users Already Signed In (5).png";
import { Badge } from "@/shared/components/ui/badge";
import { getBrandLogo } from "@/shared/utils/brandMapping";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shared/components/ui/chart";
import { isValidPrice } from "@/shared/utils/priceUtils";
import { PHILIPPINE_CITIES } from "@/shared/utils/philippineCities";
import { resolveCityFromCoordinates } from "@/shared/utils/location";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const FUEL_TYPES = ["UL91", "PR95", "PR97", "DSL", "PDSL"];
const FUEL_LABELS = {
  UL91: "Unleaded 91",
  PR95: "Premium 95",
  PR97: "Premium 97",
  DSL: "Diesel",
  PDSL: "Premium Diesel",
};
const MASCOTS = [Mascot1, Mascot2, Mascot3, Mascot4, Mascot5];

function calculateDistance(lat1, lng1, lat2, lng2) {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatDistance(value) {
  return `${Number(value || 0).toFixed(1)} km`;
}

function formatPrice(value) {
  return value ? `₱${Number(value).toFixed(2)}` : "₱0.00";
}

function formatObservedAt(observedAt) {
  const date = observedAt ? new Date(observedAt) : new Date();
  return `Today, ${date.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function getTickValues(values) {
  if (!values.length) return [75, 78, 81, 84, 87, 90];

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const paddedMin = Math.floor((minValue - 1.5) / 3) * 3;
  const paddedMax = Math.ceil((maxValue + 1.5) / 3) * 3;
  const start = Math.max(0, paddedMin);
  const end = Math.max(start + 15, paddedMax);

  return Array.from({ length: 6 }, (_, index) => start + index * ((end - start) / 5));
}

function buildSmoothPath(points) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const controlX = (current.x + next.x) / 2;
    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  return path;
}

function TrendChart({ data, isDark }) {
  const width = 860;
  const height = 305;
  const padding = { top: 22, right: 18, bottom: 38, left: 56 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const values = data.map((item) => item.price);
  const ticks = getTickValues(values);
  const minTick = ticks[0];
  const maxTick = ticks[ticks.length - 1];
  const denominator = Math.max(maxTick - minTick, 1);
  const stepX = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;

  const points = data.map((item, index) => ({
    ...item,
    x: padding.left + stepX * index,
    y: padding.top + ((maxTick - item.price) / denominator) * chartHeight,
  }));

  const linePath = buildSmoothPath(points);
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`
    : "";

  return (
    <div className="relative h-[305px] w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="home-chart-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={isDark ? "rgba(26,232,149,0.28)" : "rgba(20,173,118,0.20)"} />
            <stop offset="100%" stopColor={isDark ? "rgba(26,232,149,0.03)" : "rgba(20,173,118,0.02)"} />
          </linearGradient>
        </defs>

        {ticks.map((tick) => {
          const y = padding.top + ((maxTick - tick) / denominator) * chartHeight;
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke={isDark ? "rgba(144, 190, 168, 0.18)" : "rgba(15, 70, 53, 0.12)"}
                strokeDasharray="4 8"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                fill={isDark ? "rgba(231,245,239,0.82)" : "rgba(31,67,57,0.72)"}
                fontSize="11"
                fontWeight="700"
                textAnchor="end"
              >
                {Math.round(tick)}
              </text>
            </g>
          );
        })}

        {areaPath ? <path d={areaPath} fill="url(#home-chart-fill)" /> : null}
        {linePath ? (
          <path
            d={linePath}
            fill="none"
            stroke={isDark ? "#16e08c" : "#119f6f"}
            strokeWidth="4"
            strokeLinecap="round"
          />
        ) : null}

        {points.map((point) => (
          <g key={point.fuel}>
            <circle cx={point.x} cy={point.y} r="4.5" fill={isDark ? "#16e08c" : "#119f6f"} />
            <text
              x={point.x}
              y={height - 14}
              fill={isDark ? "rgba(231,245,239,0.82)" : "rgba(31,67,57,0.72)"}
              fontSize="12"
              fontWeight="700"
              textAnchor="middle"
            >
              {point.fuel}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function MetricCard({ icon: Icon, title, value, subtitle, isDark }) {
  return (
    <div
      className="rounded-[28px] border p-7"
      style={{
        background: isDark
          ? "linear-gradient(180deg, rgba(15,50,42,0.92), rgba(9,25,21,0.92))"
          : "linear-gradient(180deg, rgba(255,255,255,0.90), rgba(232,243,237,0.92))",
        borderColor: isDark ? "rgba(113, 178, 150, 0.14)" : "rgba(23, 73, 57, 0.10)",
        boxShadow: isDark
          ? "inset 0 1px 0 rgba(164,231,199,0.05)"
          : "inset 0 1px 0 rgba(255,255,255,0.65)",
      }}
    >
      <div
        className="mb-7 flex h-16 w-16 items-center justify-center rounded-full"
        style={{
          background: isDark ? "rgba(255,255,255,0.05)" : "rgba(12, 86, 63, 0.07)",
        }}
      >
        <Icon className="h-7 w-7" color={isDark ? "#e9fff4" : "#0c6346"} strokeWidth={1.8} />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-[var(--app-text-muted)]">{title}</p>
        <p className="text-[2.15rem] font-black leading-none tracking-[-0.03em]">{value}</p>
        <p className="text-sm font-semibold text-[#12c47f]">{subtitle}</p>
      </div>
    </div>
  );
}

function StationCard({
  title,
  station,
  metaTop,
  metaBottom,
  onAction,
  rightSlot,
  isDark,
}) {
  return (
    <section
      className="rounded-[30px] border px-9 py-8"
      style={{
        background: isDark
          ? "linear-gradient(135deg, rgba(16,45,38,0.98), rgba(10,24,20,0.96))"
          : "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(233,243,238,0.96))",
        borderColor: isDark ? "rgba(113, 178, 150, 0.16)" : "rgba(23, 73, 57, 0.10)",
      }}
    >
      <div className="mb-6 flex items-center justify-between">
        <p className="text-[0.92rem] font-black uppercase tracking-[0.28em] text-[var(--app-text-muted)]">
          {title}
        </p>
        {rightSlot}
      </div>

      <div className="relative flex min-h-[170px] items-start gap-6 pr-16">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-white p-4 shadow-[0_16px_34px_rgba(0,0,0,0.16)]">
          <img
            src={getBrandLogo(station?.brand || station?.name || "Fuel")}
            alt={station?.brand || station?.name || "Station"}
            className="h-full w-full object-contain"
          />
        </div>

        <div className="min-w-0 flex-1 pr-4">
          <h3 className="text-[1.9rem] leading-tight font-black tracking-[-0.03em] text-balance">
            {station?.name || "Station unavailable"}
          </h3>
          <p className="mt-2 text-[1.18rem] font-bold text-[#12c47f]">{metaTop}</p>
          <p className="mt-1 text-[1.08rem] font-semibold leading-snug text-[var(--app-text-soft)]">
            {metaBottom}
          </p>
        </div>

        <button
          type="button"
          onClick={onAction}
          disabled={!station?.id}
          aria-label={`Open ${station?.name || "station"}`}
          className="absolute bottom-3 right-0 inline-flex h-12 w-12 items-center justify-center rounded-full text-[#0fd184] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: isDark ? "rgba(14, 42, 36, 0.56)" : "rgba(12, 86, 63, 0.08)",
          }}
        >
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full border"
            style={{
              borderColor: isDark ? "rgba(84, 170, 135, 0.22)" : "rgba(12, 86, 63, 0.12)",
            }}
          >
            <ArrowRight className="h-4 w-4" />
          </span>
        </button>
      </div>
    </section>
  );
}

export function Home() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isDark } = useTheme();
  const { data: allStations = [], isLoading: stationsLoading } = useStations();
  const { data: globalStats } = useSummaryStats();

  const [userLocation, setUserLocation] = useState(null);
  const [cityName, setCityName] = useState("Makati");
  const [isLocating, setIsLocating] = useState(true);
  const [selectedFuelType, setSelectedFuelType] = useState("UL91");
  const [fuelDropdownOpen, setFuelDropdownOpen] = useState(false);
  const [currentMascot, setCurrentMascot] = useState(Mascot1);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Goodmorning";
    if (hour < 18) return "Goodafternoon";
    return "Goodevening";
  }, []);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * MASCOTS.length);
    setCurrentMascot(MASCOTS[randomIndex]);
  }, []);

  useEffect(() => {
    let mapCity = null;

    try {
      const storedFilters = JSON.parse(localStorage.getItem("fuelwatch_map_filters"));
      if (storedFilters?.location === "city" && storedFilters?.selectedCity) {
        mapCity = storedFilters.selectedCity;
      } else {
        const storedState = JSON.parse(localStorage.getItem("fuelwatch_map_state"));
        if (
          storedState?.appliedFilters?.location === "city" &&
          storedState?.appliedFilters?.selectedCity
        ) {
          mapCity = storedState.appliedFilters.selectedCity;
        }
      }
    } catch (error) {
      console.error("Unable to restore map city filter", error);
    }

    if (mapCity) {
      setCityName(mapCity);
    }

    if (!("geolocation" in navigator)) {
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        if (mapCity) {
          setIsLocating(false);
          return;
        }

        try {
          const resolved = await resolveCityFromCoordinates(latitude, longitude);
          if (resolved?.city) {
            setCityName(resolved.city);
            setIsLocating(false);
            return;
          }
        } catch (error) {
          console.error("Reverse geocoding failed", error);
        }

        const nearestCity = PHILIPPINE_CITIES.reduce(
          (closest, city) => {
            const distance = calculateDistance(latitude, longitude, city.lat, city.lng);
            if (distance < closest.distance) {
              return { city: city.city, distance };
            }
            return closest;
          },
          { city: "Makati", distance: Number.POSITIVE_INFINITY },
        );

        setCityName(nearestCity.city);
        setIsLocating(false);
      },
      () => {
        if (!mapCity) setCityName("Makati");
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  }, []);

  const stats = useMemo(() => {
    if (!allStations.length) return null;

    const matchedCity = PHILIPPINE_CITIES.find(
      (city) => city.city.toLowerCase() === cityName.toLowerCase(),
    );
    const referenceLocation = userLocation || (matchedCity ? { lat: matchedCity.lat, lng: matchedCity.lng } : null);

    const cityStations = allStations.filter((station) => station.city === cityName);
    let relevantStations = cityStations;

    if (!relevantStations.length && referenceLocation) {
      relevantStations = allStations
        .map((station) => ({
          ...station,
          nearbyDistance: calculateDistance(
            referenceLocation.lat,
            referenceLocation.lng,
            station.lat,
            station.lng,
          ),
        }))
        .filter((station) => station.nearbyDistance <= 15);
    }

    const chartData = FUEL_TYPES.map((fuel) => {
      let prices = relevantStations
        .map((station) => station.latest_prices?.[fuel]?.price)
        .filter(isValidPrice)
        .map(Number);

      if (!prices.length) {
        prices = allStations
          .map((station) => station.latest_prices?.[fuel]?.price)
          .filter(isValidPrice)
          .map(Number);
      }

      const average = prices.length
        ? prices.reduce((sum, price) => sum + price, 0) / prices.length
        : 0;

      return {
        fuel,
        label: FUEL_LABELS[fuel] || fuel,
        price: Number(average.toFixed(2)),
      };
    }).filter((item) => item.price > 0);

    const stationsWithDistance = referenceLocation
      ? allStations
          .map((station) => ({
            ...station,
            dist: calculateDistance(referenceLocation.lat, referenceLocation.lng, station.lat, station.lng),
          }))
          .sort((left, right) => left.dist - right.dist)
      : allStations.map((station, index) => ({ ...station, dist: index + 1 }));

    const nearest = stationsWithDistance[0] || null;

    const cheapestCandidates = stationsWithDistance
      .filter((station) => station.dist <= 30)
      .filter((station) => isValidPrice(station.latest_prices?.[selectedFuelType]?.price))
      .sort(
        (left, right) =>
          Number(left.latest_prices[selectedFuelType].price) -
          Number(right.latest_prices[selectedFuelType].price),
      );

    const fallbackCheapest = stationsWithDistance
      .filter((station) => isValidPrice(station.latest_prices?.[selectedFuelType]?.price))
      .sort(
        (left, right) =>
          Number(left.latest_prices[selectedFuelType].price) -
          Number(right.latest_prices[selectedFuelType].price),
      );

    const cheapest = cheapestCandidates[0] || fallbackCheapest[0] || null;

    const uniqueCreators = new Set(allStations.map((station) => station.created_by).filter(Boolean));
    const uniqueReporters = new Set();
    allStations.forEach((station) => {
      Object.values(station.latest_prices || {}).forEach((entry) => {
        if (entry?.reported_by) uniqueReporters.add(entry.reported_by);
      });
    });

    return {
      chartData,
      nearest,
      cheapest,
      citiesCount: String(globalStats?.cities || new Set(allStations.map((station) => station.city)).size),
      coverageCities: globalStats?.cities || new Set(allStations.map((station) => station.city)).size,
      stationsCount: String(globalStats?.stations || allStations.length),
      contributors: String(
        globalStats?.active_users || new Set([...uniqueCreators, ...uniqueReporters]).size,
      ),
    };
  }, [allStations, cityName, globalStats, selectedFuelType, userLocation]);

  const chartConfig = {
    price: {
      label: "Avg Price",
      color: "var(--color-emerald-500)",
    },
  };

  if (stationsLoading || isLocating || authLoading || !stats) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
          <p className="text-sm font-bold tracking-[0.18em] text-[#18c37e]">Loading FuelWatch...</p>
        </div>
      </div>
    );
  }

  const welcomeName = user?.name?.split(" ")[0] || user?.username?.split(" ")[0] || "Test";
  const locationLabel =
    cityName === "Makati" ? "Makati City, Metro Manila" : cityName;
  const bestPrice = stats.cheapest?.latest_prices?.[selectedFuelType];
  const priceValue = bestPrice?.price;
  const observedAt = bestPrice?.observed_at || bestPrice?.timestamp;

  return (
    <div className="app-shell min-h-screen overflow-x-hidden pb-24 text-foreground lg:px-8 lg:pb-8 lg:pt-4">
      <div className="mx-auto max-w-md px-5 pt-8 space-y-6 lg:hidden">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <h1 className="text-xl font-bold tracking-tight">
            {greeting},{" "}
            <span className="text-emerald-400">
              {user ? user.name?.split(" ")[0] || user.username?.split(" ")[0] || "Tankmate" : "Tankmate"}
            </span>
          </h1>
        </motion.div>

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

        <Card className="app-panel overflow-hidden rounded-[2rem] border-emerald-500/10 shadow-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-lg font-bold text-foreground">
              <div>
                Price in <span className="text-warning ml-1">{cityName}</span>
              </div>
              <Badge
                variant="secondary"
                className="bg-emerald-500/10 text-emerald-400 border-none font-black text-[10px]"
              >
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
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(120, 145, 138, 0.22)" />
                <XAxis
                  dataKey="fuel"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fill: "var(--app-text-muted)", fontSize: 10, fontWeight: 700 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={0}
                  domain={["auto", "auto"]}
                  tickFormatter={(val) => `${val}`}
                  tick={{ fill: "var(--app-text-muted)", fontSize: 9, fontWeight: 600 }}
                />
                <ChartTooltip
                  cursor={{ stroke: "#10b981", strokeWidth: 1 }}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      className="app-panel-strong border-emerald-500/20 shadow-2xl"
                      labelFormatter={(value) => (
                        <div className="border-emerald-500/20 mb-1 border-b pb-1">
                          <span className="text-[10px] font-bold text-emerald-400">
                            {FUEL_LABELS[value] || value}
                          </span>
                        </div>
                      )}
                      formatter={(value) => (
                        <div className="flex w-full items-center justify-between gap-4">
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] text-muted-foreground">Avg Price</span>
                          </div>
                          <span className="text-sm font-black text-foreground">
                            ₱{Number(value).toFixed(2)}
                          </span>
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
                  activeDot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                  className="drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <div className="app-panel flex flex-col items-center rounded-[2rem] border border-emerald-500/10 p-5 text-center">
            <div className="flex items-center justify-center h-6 mb-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nearest</h4>
            </div>
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 p-3 shadow-lg">
              <img
                src={getBrandLogo(stats?.nearest?.brand || stats?.nearest?.name)}
                className="w-full h-full object-contain"
              />
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
                    {FUEL_TYPES.map((fuel) => (
                      <button
                        key={fuel}
                        onClick={() => {
                          setSelectedFuelType(fuel);
                          setFuelDropdownOpen(false);
                        }}
                        className={`block w-full text-left px-3 py-2 text-[10px] transition-colors ${
                          selectedFuelType === fuel
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "hover:bg-emerald-500/10"
                        }`}
                      >
                        {fuel}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 p-3 shadow-lg">
              <img
                src={getBrandLogo(stats?.cheapest?.brand || stats?.cheapest?.name)}
                className="w-full h-full object-contain"
              />
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

        <div className="app-panel rounded-[2rem] border border-emerald-500/10 p-6">
          <h3 className="mb-6 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground">
            FuelWatchPH coverage
          </h3>
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

      <div className="hidden lg:block">
        <div className="mx-auto max-w-[1520px]">
        <section
          className="relative overflow-hidden rounded-[34px] border px-6 py-7 lg:px-12 lg:py-10"
          style={{
            background: isDark
              ? "linear-gradient(180deg, rgba(7,22,18,0.96), rgba(6,18,15,0.98))"
              : "linear-gradient(180deg, rgba(244,251,247,0.98), rgba(228,241,234,0.98))",
            borderColor: isDark ? "rgba(68, 148, 116, 0.22)" : "rgba(23, 73, 57, 0.10)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: isDark
                ? "radial-gradient(circle at 68% 35%, rgba(18,199,119,0.18), transparent 24%), linear-gradient(90deg, rgba(5,17,14,0.56) 0%, rgba(5,17,14,0.18) 46%, rgba(5,17,14,0.30) 100%)"
                : "radial-gradient(circle at 68% 35%, rgba(18,199,119,0.14), transparent 24%), linear-gradient(90deg, rgba(246,252,249,0.52) 0%, rgba(246,252,249,0.16) 46%, rgba(246,252,249,0.26) 100%)",
            }}
          />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="self-start pt-4">
              <div className="max-w-[560px]">
                <h1 className="text-[2.2rem] font-black leading-none tracking-[-0.045em] lg:text-[4rem]">
                  {greeting}, <span className="text-[#10d27f]">{welcomeName}</span>
                </h1>

                <div
                  className="mt-6 inline-flex items-center gap-3 rounded-full px-5 py-3 text-[1rem] font-semibold"
                  style={{
                    background: isDark ? "rgba(17, 55, 46, 0.76)" : "rgba(255,255,255,0.74)",
                    border: `1px solid ${isDark ? "rgba(92, 163, 132, 0.16)" : "rgba(23, 73, 57, 0.08)"}`,
                  }}
                >
                  <MapPinned className="h-5 w-5 text-[#10d27f]" />
                  <span>{locationLabel}</span>
                </div>
                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={() => navigate("/app/map")}
                    className="inline-flex items-center gap-3 rounded-full px-7 py-4 text-[1rem] font-black text-white shadow-[0_12px_32px_rgba(17,211,128,0.32)] transition hover:brightness-105"
                    style={{
                      background: "linear-gradient(90deg, #11c875 0%, #18dc8a 100%)",
                    }}
                  >
                    <MapIcon className="h-5 w-5" />
                    Open live map
                    <ArrowRight className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/app/compare")}
                    className="inline-flex items-center gap-3 rounded-full border px-7 py-4 text-[1rem] font-black text-[#12c47f] transition hover:bg-[#10d27f]/6"
                    style={{
                      borderColor: isDark ? "rgba(84, 170, 135, 0.22)" : "rgba(23, 73, 57, 0.12)",
                    }}
                  >
                    <ArrowRightLeft className="h-5 w-5" />
                    Compare stations
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="relative min-h-[360px]">
              <div className="absolute inset-y-0 right-0 left-[4%] flex items-end justify-end">
                <img
                  src={Mascot1}
                  alt="FuelWatch mascot"
                  className="h-full w-auto max-w-none object-contain object-right-bottom drop-shadow-[0_30px_58px_rgba(0,0,0,0.32)]"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.65fr_1fr]">
          <article
            className="rounded-[30px] border px-8 py-7 lg:px-8 lg:py-8"
            style={{
              background: isDark
                ? "linear-gradient(135deg, rgba(19,52,44,0.92), rgba(10,26,22,0.95))"
                : "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(232,243,237,0.96))",
              borderColor: isDark ? "rgba(113, 178, 150, 0.16)" : "rgba(23, 73, 57, 0.10)",
            }}
          >
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-[2rem] font-black tracking-[-0.04em]">
                  Price in <span className="text-[#f2ac2f]">{cityName}</span>
                </h2>
                <p className="mt-3 text-[0.9rem] font-black uppercase tracking-[0.24em] text-[var(--app-text-muted)]">
                  Price trends per fuel type
                </p>
              </div>

              <div
                className="inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-black text-[#12c47f]"
                style={{
                  background: isDark ? "rgba(14, 65, 50, 0.72)" : "rgba(18, 196, 127, 0.10)",
                }}
              >
                <TrendingUp className="h-4 w-4" />
                Live Trends
              </div>
            </div>

            <TrendChart data={stats.chartData} isDark={isDark} />
          </article>

          <div className="grid gap-5">
            <StationCard
              title="Nearest"
              station={stats.nearest}
              metaTop={`${formatDistance(stats.nearest?.dist)} away`}
              metaBottom={stats.nearest?.address || stats.nearest?.city || "Unavailable"}
              onAction={() => stats.nearest?.id && navigate(`/app/station/${stats.nearest.id}`)}
              isDark={isDark}
            />

            <StationCard
              title="Cheapest"
              station={stats.cheapest}
              metaTop={`${formatPrice(priceValue)} / liter`}
              metaBottom={`${formatDistance(stats.cheapest?.dist)} away`}
              onAction={() => stats.cheapest?.id && navigate(`/app/station/${stats.cheapest.id}`)}
              isDark={isDark}
              rightSlot={
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setFuelDropdownOpen((open) => !open)}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black text-[#12c47f]"
                    style={{
                      background: isDark ? "rgba(14, 65, 50, 0.72)" : "rgba(18, 196, 127, 0.10)",
                    }}
                  >
                    {selectedFuelType}
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {fuelDropdownOpen ? (
                    <div
                      className="absolute right-0 top-[calc(100%+0.6rem)] z-20 min-w-[150px] overflow-hidden rounded-2xl border py-2 shadow-[0_20px_45px_rgba(0,0,0,0.22)]"
                      style={{
                        background: isDark ? "rgba(12, 29, 25, 0.98)" : "rgba(255,255,255,0.98)",
                        borderColor: isDark ? "rgba(113, 178, 150, 0.18)" : "rgba(23, 73, 57, 0.10)",
                      }}
                    >
                      {FUEL_TYPES.map((fuel) => (
                        <button
                          key={fuel}
                          type="button"
                          onClick={() => {
                            setSelectedFuelType(fuel);
                            setFuelDropdownOpen(false);
                          }}
                          className="block w-full px-4 py-2 text-left text-sm font-bold transition hover:bg-[#10d27f]/10"
                        >
                          {fuel}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              }
            />
          </div>
        </section>

        <section
          className="mt-5 rounded-[30px] border px-8 py-7"
          style={{
            background: isDark
              ? "linear-gradient(135deg, rgba(16,45,38,0.98), rgba(10,24,20,0.96))"
              : "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(233,243,238,0.96))",
            borderColor: isDark ? "rgba(113, 178, 150, 0.16)" : "rgba(23, 73, 57, 0.10)",
          }}
        >
          <p className="mb-6 text-[1.05rem] font-black uppercase tracking-[0.24em] text-[var(--app-text-muted)]">
            FuelWatchPH Coverage
          </p>

          <div className="grid gap-4 lg:grid-cols-3">
            {[
              { icon: Users, value: stats.contributors, label: "Contributors" },
              { icon: MapIcon, value: stats.coverageCities, label: "Cities" },
              { icon: Building2, value: stats.stationsCount, label: "Stations" },
            ].map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="flex items-center justify-center gap-6 rounded-[24px] border px-7 py-6"
                style={{
                  background: isDark ? "rgba(10, 32, 27, 0.56)" : "rgba(250,254,252,0.82)",
                  borderColor: isDark ? "rgba(113, 178, 150, 0.14)" : "rgba(23, 73, 57, 0.10)",
                }}
              >
                <Icon className="h-8 w-8 text-[#10d27f]" strokeWidth={1.8} />
                <span className="text-[2rem] font-black tracking-[-0.04em]">{value}</span>
                <span className="text-[0.95rem] font-black uppercase tracking-[0.16em] text-[#10d27f]">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}
