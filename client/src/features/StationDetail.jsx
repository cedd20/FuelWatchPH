import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Share2,
  Heart,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertCircle,
  Navigation,
  SearchX,
  CheckCircle2,
} from "lucide-react";
import { useStation, useDeleteStation } from "@/hooks/useStations";
import { usePrices, useDeletePrice, useConfirmPrice, useMyContributions } from "@/hooks/usePrices";
import { AuthPrompt } from "@/shared/components/AuthPrompt";
import { ConfirmationModal } from "@/shared/components/ConfirmationModal";
import { StationPriceHistoryCard } from "@/shared/components/StationPriceHistoryCard";
import { useAuth } from "@/app/providers/AuthContext";
import { StationLogo } from "@/shared/components/StationLogo";
import { toggleSaveStation, isStationSaved } from "@/shared/utils/favorites";
import { toast } from "sonner";

export function StationDetail() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSaved, setIsSaved] = useState(() => isStationSaved(id));

  const { user, isAuthenticated, refreshProfile } = useAuth();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [priceDeleteTarget, setPriceDeleteTarget] = useState(null);

  const { data: rawStation, isLoading, error } = useStation(id);
  const { data: rawPrices = [] } = usePrices({ station_id: id });
  const { data: myContributions = [] } = useMyContributions();

  const deleteStationMutation = useDeleteStation(id);
  const deletePriceMutation = useDeletePrice();
  const confirmPriceMutation = useConfirmPrice();

  // Clear stale session confirmations when user changes (e.g., different account logs in)
  useEffect(() => {
    // Key prefix for this user — if user changes, old keys won't match
    const currentUserPrefix = `confirmed_price_${user?.id}_`;
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith('confirmed_price_') && !k.startsWith(currentUserPrefix)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => sessionStorage.removeItem(k));
  }, [user?.id]);

  const station = useMemo(() => {
    if (!rawStation) return null;
    return {
      ...rawStation,
      prices: Object.entries(rawStation.latest_prices || {}).map(([type, details]) => ({
        type,
        price: details.price,
        confirmations: details.confirmation_count,
        observed_at: details.observed_at,
        id: details.id
      })),
      lastUpdated: rawStation.latest_prices && Object.keys(rawStation.latest_prices).length > 0 
        ? new Date(Math.max(...Object.values(rawStation.latest_prices).map(p => new Date(p.observed_at)))).toLocaleDateString()
        : 'No reports',
      distance: rawStation.distance_km || 0
    };
  }, [rawStation]);

  const userRole = (user?.role || user?.app_metadata?.role || user?.user_metadata?.role || "").toLowerCase();
  const canEditStation = isAuthenticated;
  const canDeleteStation = ["admin", "moderator"].includes(userRole);

  const handleToggleSave = () => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }
    const newState = toggleSaveStation(id);
    setIsSaved(newState);
  };

  const handleEditStation = () => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

    navigate("/app/add-station", { state: { station } });
  };

  const handleDeleteStation = () => {
    deleteStationMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(`Deleted ${station.name}`);
        setShowDeleteConfirm(false);
        navigate("/app/map");
      },
      onError: (err) => {
        toast.error(err.message || "Failed to delete station");
      }
    });
  };

  const handleEditPrice = (fuel) => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

    navigate(`/app/update-price/${id}`, { state: { fuelType: fuel.type } });
  };

  const handleDeletePrice = () => {
    if (!priceDeleteTarget) return;

    deletePriceMutation.mutate(priceDeleteTarget.id, {
      onSuccess: () => {
        toast.success(`Deleted ${priceDeleteTarget.type} price`);
        setPriceDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(err.message || "Could not delete price");
      }
    });
  };

  const handleConfirmPrice = async (fuel) => {
    if (!fuel.id) return;
    
    // Scope the key to this specific user to prevent cross-account contamination
    const confirmedKey = `confirmed_price_${user?.id}_${fuel.id}`;
    
    const isAlreadyConfirmed = !!sessionStorage.getItem(confirmedKey) || 
      myContributions.some(c => c.type === "Confirmed" && c.price_report_id === fuel.id);
      
    if (isAlreadyConfirmed) {
      toast.info("You've already confirmed this price.");
      return;
    }

    confirmPriceMutation.mutate(fuel.id, {
      onSuccess: () => {
        // Scope the session key to the current user ID
        const confirmedKey = `confirmed_price_${user?.id}_${fuel.id}`;
        sessionStorage.setItem(confirmedKey, "true");
        toast.success("Price confirmed. Thank you!");
        
        // Optimistically update the station data in the query cache
        qc.setQueryData(["stations", id], (oldStation) => {
          if (!oldStation) return oldStation;
          const newStation = JSON.parse(JSON.stringify(oldStation));
          if (newStation.latest_prices) {
            for (const key in newStation.latest_prices) {
              if (newStation.latest_prices[key].id === fuel.id) {
                newStation.latest_prices[key].confirmation_count = (newStation.latest_prices[key].confirmation_count || 0) + 1;
              }
            }
          }
          newStation.contributors = (newStation.contributors || 1) + 1;
          newStation.accuracy = Math.min(100, (newStation.accuracy || 85) + 5);
          return newStation;
        });

        // Also update the full list cache if it exists
        qc.setQueryData(["stations", {}], (oldStations) => {
          if (!oldStations || !Array.isArray(oldStations)) return oldStations;
          return oldStations.map(s => {
            if (s.id === id) {
              const newStation = JSON.parse(JSON.stringify(s));
              if (newStation.latest_prices) {
                for (const key in newStation.latest_prices) {
                  if (newStation.latest_prices[key].id === fuel.id) {
                    newStation.latest_prices[key].confirmation_count = (newStation.latest_prices[key].confirmation_count || 0) + 1;
                  }
                }
              }
              newStation.contributors = (newStation.contributors || 1) + 1;
              newStation.accuracy = Math.min(100, (newStation.accuracy || 85) + 5);
              return newStation;
            }
            return s;
          });
        });

        // Refresh profile stats to show new confirmation
        refreshProfile();
      },
      onError: (err) => {
        if (err.status === 429) {
          const confirmedKey = `confirmed_price_${user?.id}_${fuel.id}`;
          sessionStorage.setItem(confirmedKey, "true");
          toast.error("You've already confirmed this recently.");
        } else {
          toast.error("Something went wrong. Please check your connection.");
        }
      }
    });
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

  // TODO: wire to POST /api/routes for in-app route generation
  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;
    window.open(url, "_blank");
  };

  return (
    <>
      <AuthPrompt
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        message="Sign in to save stations and contribute price updates."
      />
      <ConfirmationModal
        isOpen={Boolean(priceDeleteTarget)}
        onClose={() => setPriceDeleteTarget(null)}
        onConfirm={handleDeletePrice}
        title={priceDeleteTarget ? `Delete ${priceDeleteTarget.type}?` : "Delete price?"}
        message={priceDeleteTarget ? `Are you sure you want to delete the ${priceDeleteTarget.type} price for ${station.name}? This cannot be undone.` : "Are you sure?"}
        confirmText="Delete Price"
        cancelText="Cancel"
        type="warning"
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-950 pb-20 lg:pb-8">
      {/* Compact Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-4 pb-3 sm:pt-5 sm:pb-4 lg:pt-6 lg:pb-5 px-4 sm:px-5 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Top Row: Back + Actions */}
          <div className="flex items-center justify-between mb-3 sm:mb-3.5 gap-2">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 sm:w-11 sm:h-11 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg shadow-black/20 hover:scale-105 transition-transform border-2 border-white/40 flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
            </button>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="w-10 h-10 sm:w-11 sm:h-11 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg shadow-black/20 hover:scale-105 transition-transform border-2 border-white/40"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-200" strokeWidth={2.5} />
              </button>
              <button
                onClick={handleToggleSave}
                className="w-10 h-10 sm:w-11 sm:h-11 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg shadow-black/20 hover:scale-105 transition-transform border-2 border-white/40"
              >
                <Heart
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    isSaved ? "fill-rose-500 text-rose-500" : "text-gray-700 dark:text-gray-200"
                  }`}
                  strokeWidth={2.5}
                />
              </button>
            </div>
          </div>

          {/* Station Info Row */}
          <div className="flex items-start gap-2.5 sm:gap-3 mb-2 sm:mb-2.5">
            <StationLogo name={station.name} size="md" className="flex-shrink-0 shadow-lg mt-0.5" />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white drop-shadow-lg tracking-tight line-clamp-2">{station.name}</h1>
              <div className="flex items-center gap-1 text-white/90 text-xs sm:text-sm font-medium drop-shadow-sm mt-0.5">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="line-clamp-1">{station.address}</span>
              </div>
            </div>
          </div>

          {/* Metadata + Accuracy Row */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 text-xs sm:text-sm text-white/90 font-medium drop-shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">{station.distance} km</span>
              </div>
              <div className="w-1 h-1 bg-white/40 rounded-full flex-shrink-0" />
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">{station.lastUpdated}</span>
              </div>
            </div>
            
            {/* Accuracy Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white/15 backdrop-blur-md rounded-full border border-white/20 flex-shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={2.5} />
              <span className="font-bold text-white text-xs sm:text-sm whitespace-nowrap">
                {station.prices?.length > 0 ? (station.accuracy || 100) : 0}%
              </span>
            </div>
          </div>

          {/* Edit/Delete Buttons (Compact) */}
          {(canEditStation || canDeleteStation) && (
            <div className="flex items-center gap-2 mt-2 sm:mt-2.5">
              {canEditStation && (
                <button
                  onClick={handleEditStation}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-white/15 backdrop-blur-md text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm border border-white/20 shadow-lg hover:bg-white/20 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Edit</span>
                </button>
              )}
              {canDeleteStation && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-rose-500/20 backdrop-blur-md text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm border border-rose-300/30 shadow-lg hover:bg-rose-500/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="hidden lg:block px-6 xl:px-8 py-10 mb-10">
        <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-6 tracking-tight">Current Prices</h3>
              <div className="grid grid-cols-2 gap-4">
                {station.prices.map((fuel, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-2xl shadow-black/10 hover:border-emerald-400/50 hover:scale-[1.02] transition-all"
                  >
                    <div className="mb-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="font-bold text-foreground text-lg">{fuel.type}</div>
                        {canDeleteStation ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPriceDeleteTarget(fuel)}
                              className="min-h-11 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300"
                            >
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        {fuel.trend === "up" ? (
                          <TrendingUp className="w-5 h-5 text-rose-600 dark:text-rose-400" strokeWidth={2.5} />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-emerald-600 dark:text-emerald-500" strokeWidth={2.5} />
                        )}
                        <span
                          className={`text-sm font-bold ${
                            fuel.trend === "up" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-500"
                          }`}
                        >
                          ₱{Math.abs(fuel.change || 0).toFixed(2)}{" "}
                          {fuel.trend === "up" ? "higher" : "lower"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-foreground tracking-tighter mb-1">
                        ₱{fuel.price.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground/70 font-semibold mb-3">per liter</div>
                      {(() => {
                        const isConfirmed = !!sessionStorage.getItem(`confirmed_price_${user?.id}_${fuel.id}`) || 
                                            myContributions.some(c => c.type === "Confirmed" && c.price_report_id === fuel.id);
                        return (
                          <button
                            onClick={() => handleConfirmPrice(fuel)}
                            disabled={confirmPriceMutation.isPending || isConfirmed}
                            className={`flex items-center justify-end gap-1.5 w-full font-medium text-sm transition-all group ${
                              isConfirmed
                                ? "text-emerald-500 cursor-default opacity-80"
                                : "text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 active:scale-95"
                            }`}
                          >
                            {confirmPriceMutation.isPending && confirmPriceMutation.variables === fuel.id ? (
                              <div className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                            ) : isConfirmed ? (
                              <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            )}
                            <span>
                              Confirm ({fuel.confirmations || 0})
                            </span>
                          </button>
                        );
                      })()}
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
                    {station.prices?.length > 0 ? (station.accuracy || 100) : 0}% Accuracy
                  </div>
                  <div className="text-sm text-muted-foreground/80 font-medium">
                    {station.prices?.length > 0 
                      ? `Verified by ${station.contributors || 1} contributors`
                      : "Be the first to report prices!"}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/app/update-price/${id}`)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white rounded-2xl font-bold text-base shadow-2xl shadow-emerald-500/50 transition-all border-2 border-emerald-400/30"
                >
                  Update Fuel Price
                </button>
                {/* Report Price removed — use Update Fuel Price flow instead */}
                <button
                  onClick={handleGetDirections}
                  className="w-full px-5 py-3.5 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-2xl font-bold text-sm text-foreground shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4" strokeWidth={2.5} />
                  Get Directions
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Accuracy Summary */}
      <div className="lg:hidden px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-b border-emerald-200 dark:border-emerald-800/40">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-bold text-foreground text-sm">
                {station.prices?.length > 0 ? (station.accuracy || 100) : 0}% Accuracy
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                {station.prices?.length > 0 
                  ? `${station.contributors || 1} contributor${station.contributors !== 1 ? 's' : ''}`
                  : "No reports yet"}
              </div>
            </div>
          </div>
          {station.prices?.length > 0 && (
            <div className="px-2.5 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold whitespace-nowrap shadow-sm">
              Trusted
            </div>
          )}
        </div>
      </div>

      {/* Mobile Prices Section */}
      <div className="lg:hidden px-4 sm:px-5 py-5 sm:py-6">
        <h3 className="text-lg font-bold text-foreground mb-4 tracking-tight">Current Prices</h3>
        <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
          {station.prices.map((fuel, index) => (
            <div
              key={index}
              className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-2xl shadow-black/10 transition-all"
            >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="font-bold text-foreground text-base">{fuel.type}</div>
                        {canDeleteStation ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPriceDeleteTarget(fuel)}
                              className="min-h-11 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300"
                            >
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </div>
                    <div className="flex items-center gap-2">
                      {fuel.trend === "up" ? (
                        <TrendingUp className="w-4 h-4 text-rose-600 dark:text-rose-400" strokeWidth={2.5} />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-500" strokeWidth={2.5} />
                      )}
                      <span className={`text-sm font-bold ${fuel.trend === "up" ? "text-rose-600" : "text-emerald-600"}`}>
                        ₱{Math.abs(fuel.change || 0).toFixed(2)} {fuel.trend === "up" ? "higher" : "lower"}
                      </span>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="text-3xl font-bold text-foreground tracking-tighter mb-1">
                    ₱{fuel.price.toFixed(2)}
                  </div>
                  {(() => {
                    const isConfirmed = !!sessionStorage.getItem(`confirmed_price_${user?.id}_${fuel.id}`) || 
                                        myContributions.some(c => c.type === "Confirmed" && c.price_report_id === fuel.id);
                    return (
                      <button
                        onClick={() => handleConfirmPrice(fuel)}
                        disabled={confirmPriceMutation.isPending || isConfirmed}
                        className={`flex items-center gap-1.5 font-medium text-sm transition-all ${
                          isConfirmed
                            ? "text-emerald-500 opacity-80"
                            : "text-emerald-600 dark:text-emerald-500 active:scale-95"
                        }`}
                      >
                        {confirmPriceMutation.isPending && confirmPriceMutation.variables === fuel.id ? (
                          <div className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                        ) : isConfirmed ? (
                          <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>
                          Confirm ({fuel.confirmations || 0})
                        </span>
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => navigate(`/app/update-price/${id}`)}
            className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white rounded-2xl font-bold text-base shadow-2xl shadow-emerald-500/50 transition-all border-2 border-emerald-400/30"
          >
            Update Fuel Price
          </button>
          {/* Report Price removed — use Update Fuel Price flow instead */}
          <button
            onClick={handleGetDirections}
            className="w-full px-5 py-3.5 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-2xl font-bold text-sm text-foreground shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Navigation className="w-4 h-4" strokeWidth={2.5} />
            Get Directions
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-5 lg:px-8 pb-6 lg:pb-10">
        <div className="max-w-6xl mx-auto">
          <StationPriceHistoryCard stationId={id} stationName={station.name} compact />
        </div>
      </div>
      </div>
    </>
  );
}
