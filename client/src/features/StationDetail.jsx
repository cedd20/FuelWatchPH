import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Share2,
  Heart,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertCircle,
  Navigation,
  SearchX,
  PencilLine,
  Flag,
  FilePlus2,
  Minus,
} from "lucide-react";
import { getStations, toggleSaveStation, isStationSaved } from "@/shared/utils/stationStorage";
import { AuthPrompt } from "@/shared/components/AuthPrompt";
import { useAuth } from "@/app/providers/AuthContext";
import { StationLogo } from "@/shared/components/StationLogo";
import { FUEL_TYPES } from "@/shared/utils/fuelTypes";

export function StationDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSaved, setIsSaved] = useState(() => isStationSaved(id));

  const { isAuthenticated } = useAuth();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [station, setStation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStation = async () => {
      setIsLoading(true);
      try {
        // Simulate API Fetch: GET /api/stations/:id
        await new Promise((resolve) => setTimeout(resolve, 800));
        const stations = getStations();
        const found = stations.find((s) => s.id === id);
        setStation(found);
      } catch (error) {
        console.error("Failed to fetch station details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStation();
  }, [id]);

  const handleToggleSave = () => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }
    const newState = toggleSaveStation(id);
    setIsSaved(newState);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <MapPin className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500" />
        </div>
        <p className="mt-4 text-muted-foreground font-medium animate-pulse">Loading station details...</p>
      </div>
    );
  }

  if (!station) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-neutral-950 text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
          <SearchX className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Station Not Found</h1>
        <p className="text-muted-foreground mb-8 max-w-xs">
          The station you're looking for might have been removed or the link is invalid.
        </p>
        <button
          onClick={() => navigate("/app/map")}
          className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold transition-all shadow-lg"
        >
          Back to Map
        </button>
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: station.name,
        text: `Check fuel prices at ${station.name} on FuelWatchPH`,
        url: window.location.href,
      }).catch(console.error);
    }
  };

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;
    window.open(url, "_blank");
  };

  const priceCards = FUEL_TYPES.map((fuelType) => {
    const matched = station.prices.find((fuel) => fuel.type === fuelType);
    return matched || { type: fuelType, unavailable: true };
  });

  return (
    <>
      <AuthPrompt
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        message="Sign in to save stations and contribute price updates."
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-950 pb-44 lg:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-12 pb-8 px-4 lg:px-8 lg:pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <button
              onClick={() => navigate(-1)}
              className="w-12 h-12 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl shadow-black/20 hover:scale-110 transition-transform border-2 border-white/40"
            >
              <ArrowLeft className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="w-12 h-12 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl shadow-black/20 hover:scale-110 transition-transform border-2 border-white/40"
              >
                <Share2 className="w-5 h-5 text-gray-700 dark:text-gray-200" strokeWidth={2.5} />
              </button>
              <button
                onClick={handleToggleSave}
                className="w-12 h-12 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl shadow-black/20 hover:scale-110 transition-transform border-2 border-white/40"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isSaved ? "fill-rose-500 text-rose-500" : "text-gray-700 dark:text-gray-200"
                  }`}
                  strokeWidth={2.5}
                />
              </button>
            </div>
          </div>

          <StationLogo name={station.name} size="xl" className="mb-4 lg:mb-6 shadow-2xl" />
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 lg:mb-4 drop-shadow-2xl tracking-tight">{station.name}</h1>
          <div className="flex items-start gap-2 text-white/95 mb-4 lg:mb-5 drop-shadow-lg">
            <MapPin className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 flex-shrink-0" />
            <span className="text-sm lg:text-base font-medium">{station.address}</span>
          </div>
          <div className="flex items-center gap-4 lg:gap-6 text-sm lg:text-base text-white/95 font-medium drop-shadow-lg">
            <div className="flex items-center gap-1.5 lg:gap-2">
              <Navigation className="w-4 h-4 lg:w-5 lg:h-5" />
              <span>{station.distance} km away</span>
            </div>
            <div className="flex items-center gap-1.5 lg:gap-2">
              <Clock className="w-4 h-4 lg:w-5 lg:h-5" />
              <span>Updated {station.lastUpdated}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden mx-4 -mt-4 bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl p-6 border-2 border-emerald-400/30 dark:border-emerald-500/30 shadow-2xl shadow-emerald-500/10 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/5 rounded-xl flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-500" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-bold text-foreground text-base">
                {station.accuracy || 100}% Accuracy
              </div>
              <div className="text-xs text-muted-foreground/80 font-medium">
                Verified by {station.contributors || 1} contributors
              </div>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full text-xs font-bold shadow-lg shadow-teal-500/30">
            Trusted
          </div>
        </div>
      </div>

      <div className="hidden lg:block px-8 py-10 mb-10">
        <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2">
            <div className="mb-8">
              <div className="flex items-center justify-between gap-4 mb-6">
                <h3 className="text-2xl font-bold text-foreground tracking-tight">Current Prices</h3>
                <button
                  onClick={() => navigate(`/app/report/${id}`)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border-2 border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-bold text-sm shadow-lg transition-all"
                >
                  <FilePlus2 className="w-4 h-4" strokeWidth={2.5} />
                  Report New Price
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {priceCards.map((fuel, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-2xl shadow-black/10 hover:border-emerald-400/50 hover:scale-[1.02] transition-all"
                  >
                    <div className="mb-4">
                      <div className="font-bold text-foreground mb-2 text-lg">
                        {fuel.type}
                      </div>
                      {fuel.unavailable ? (
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                          <AlertCircle className="w-5 h-5" strokeWidth={2.5} />
                          <span className="text-sm font-bold">Unavailable right now</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {fuel.trend === "up" ? (
                            <TrendingUp className="w-5 h-5 text-rose-600 dark:text-rose-400" strokeWidth={2.5} />
                          ) : fuel.trend === "down" ? (
                            <TrendingDown className="w-5 h-5 text-emerald-600 dark:text-emerald-500" strokeWidth={2.5} />
                          ) : (
                            <Minus className="w-5 h-5 text-amber-500 dark:text-amber-400" strokeWidth={2.5} />
                          )}
                          <span
                            className={`text-sm font-bold ${
                              fuel.trend === "up"
                                ? "text-rose-600 dark:text-rose-400"
                                : fuel.trend === "down"
                                  ? "text-emerald-600 dark:text-emerald-500"
                                  : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {fuel.trend === "stable"
                              ? "No recent change"
                              : `₱${Math.abs(fuel.change || 0).toFixed(2)} ${fuel.trend === "up" ? "higher" : "lower"}`}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {fuel.unavailable ? (
                        <>
                          <div className="text-xl font-bold text-muted-foreground tracking-tight mb-1">No active report</div>
                          <div className="text-sm text-muted-foreground/70 font-semibold">Use Report New Price</div>
                        </>
                      ) : (
                        <>
                          <div className="text-4xl font-bold text-foreground tracking-tighter mb-1">
                            ₱{fuel.price.toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground/70 font-semibold">per liter</div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 space-y-6">
              <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl p-6 border-2 border-emerald-400/30 dark:border-emerald-500/30 shadow-2xl shadow-emerald-500/10 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/5 rounded-xl flex items-center justify-center shadow-lg">
                      <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-500" strokeWidth={2.5} />
                    </div>
                    <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full text-xs font-bold shadow-lg shadow-teal-500/30">
                      Trusted
                    </div>
                  </div>
                  <div className="font-bold text-foreground text-2xl mb-2 tracking-tight">
                    {station.accuracy || 100}% Accuracy
                  </div>
                  <div className="text-sm text-muted-foreground/80 font-medium">
                    Verified by {station.contributors || 1} contributors
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/app/update-price/${id}`)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white rounded-2xl font-bold text-base shadow-2xl shadow-emerald-500/50 transition-all border-2 border-emerald-400/30"
                >
                  Update Fuel Prices
                </button>
                <button
                  onClick={() => navigate(`/app/report/${id}`)}
                  className="w-full px-5 py-3.5 bg-white dark:bg-neutral-800 border-2 border-emerald-200 dark:border-emerald-900/40 rounded-2xl font-bold text-sm text-emerald-700 dark:text-emerald-300 shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <FilePlus2 className="w-4 h-4" strokeWidth={2.5} />
                  Report Fuel Price
                </button>
                <button
                  onClick={handleGetDirections}
                  className="w-full px-5 py-3.5 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-2xl font-bold text-sm text-foreground shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4" strokeWidth={2.5} />
                  Get Directions
                </button>
                <button
                  onClick={() => navigate(`/app/report-issue/${id}`)}
                  className="w-full px-5 py-3.5 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-2xl font-bold text-sm text-foreground shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Flag className="w-4 h-4" strokeWidth={2.5} />
                  Report Issues
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-bold text-foreground tracking-tight">Current Prices</h3>
          <button
            onClick={() => navigate(`/app/report/${id}`)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border-2 border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs shadow-lg transition-all"
          >
            <FilePlus2 className="w-4 h-4" strokeWidth={2.5} />
            Report New Price
          </button>
        </div>
        <div className="space-y-3">
          {priceCards.map((fuel, index) => (
            <div
              key={index}
              className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-2xl shadow-black/10 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-bold text-foreground mb-2 text-base">
                    {fuel.type}
                  </div>
                  {fuel.unavailable ? (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-4 h-4" strokeWidth={2.5} />
                      <span className="text-sm font-bold">Unavailable</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {fuel.trend === "up" ? (
                        <TrendingUp className="w-4 h-4 text-rose-600 dark:text-rose-400" strokeWidth={2.5} />
                      ) : fuel.trend === "down" ? (
                        <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-500" strokeWidth={2.5} />
                      ) : (
                        <Minus className="w-4 h-4 text-amber-500 dark:text-amber-400" strokeWidth={2.5} />
                      )}
                      <span className={`text-sm font-bold ${
                        fuel.trend === "up" ? "text-rose-600" : fuel.trend === "down" ? "text-emerald-600" : "text-amber-600"
                      }`}>
                        {fuel.trend === "stable"
                          ? "No recent change"
                          : `₱${Math.abs(fuel.change || 0).toFixed(2)} ${fuel.trend === "up" ? "higher" : "lower"}`}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {fuel.unavailable ? (
                    <div className="text-sm font-bold text-muted-foreground tracking-tight">
                      No current price
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-foreground tracking-tighter">
                      ₱{fuel.price.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="lg:hidden fixed inset-x-0 bottom-24 z-40 px-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)" }}
      >
        <div className="rounded-[2rem] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl border-2 border-white/50 dark:border-neutral-700/50 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] p-3">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => navigate(`/app/update-price/${id}`)}
              className="min-h-[72px] rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white font-bold text-xs px-3 py-3 flex flex-col items-center justify-center gap-2 shadow-xl shadow-emerald-500/30"
            >
              <PencilLine className="w-5 h-5" strokeWidth={2.5} />
              <span className="text-center leading-tight">Update Fuel Prices</span>
            </button>
            <button
              onClick={handleGetDirections}
              className="min-h-[72px] rounded-2xl bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 text-foreground font-bold text-xs px-3 py-3 flex flex-col items-center justify-center gap-2 shadow-lg"
            >
              <Navigation className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              <span className="text-center leading-tight">Get Directions</span>
            </button>
            <button
              onClick={() => navigate(`/app/report-issue/${id}`)}
              className="min-h-[72px] rounded-2xl bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 text-foreground font-bold text-xs px-3 py-3 flex flex-col items-center justify-center gap-2 shadow-lg"
            >
              <Flag className="w-5 h-5 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
              <span className="text-center leading-tight">Report Issues</span>
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
