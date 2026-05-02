import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Share2,
  Heart,
  Pencil,
  NotebookPen,
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
import { usePrices, useDeletePrice, useConfirmPrice } from "@/hooks/usePrices";
import { AuthPrompt } from "@/shared/components/AuthPrompt";
import { ConfirmationModal } from "@/shared/components/ConfirmationModal";
import { useAuth } from "@/app/providers/AuthContext";
import { StationLogo } from "@/shared/components/StationLogo";
import { toggleSaveStation, isStationSaved } from "@/shared/utils/favorites";
import { toast } from "sonner";

export function StationDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSaved, setIsSaved] = useState(() => isStationSaved(id));

  const { user, isAuthenticated } = useAuth();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [priceDeleteTarget, setPriceDeleteTarget] = useState(null);

  const { data: rawStation, isLoading, error } = useStation(id);
  const { data: rawPrices = [] } = usePrices({ station_id: id });

  const deleteStationMutation = useDeleteStation(id);
  const deletePriceMutation = useDeletePrice();
  const confirmPriceMutation = useConfirmPrice();

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

  const handleReportPrice = () => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

    navigate(`/app/report/${id}`);
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
    
    const confirmedKey = `confirmed_price_${fuel.id}`;
    
    if (sessionStorage.getItem(confirmedKey)) {
      toast.error("You've already confirmed this recently.");
      return;
    }

    confirmPriceMutation.mutate(fuel.id, {
      onSuccess: () => {
        sessionStorage.setItem(confirmedKey, "true");
        toast.success("Price confirmed. Thank you!");
      },
      onError: (err) => {
        if (err.status === 429) {
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

          {(canEditStation || canDeleteStation) && (
            <div className="flex flex-wrap items-center gap-3 mb-5 lg:mb-6">
              {canEditStation && (
                <button
                  onClick={handleEditStation}
                  className="min-h-11 flex items-center gap-2 px-4 py-3 bg-white/15 backdrop-blur-md text-white rounded-2xl font-bold border border-white/20 shadow-lg"
                >
                  <Pencil className="w-4 h-4" />
                  Edit Station
                </button>
              )}
              {canDeleteStation && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="min-h-11 flex items-center gap-2 px-4 py-3 bg-rose-500/20 backdrop-blur-md text-white rounded-2xl font-bold border border-rose-300/30 shadow-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Station
                </button>
              )}
            </div>
          )}

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

      <div className="lg:hidden mx-4 -mt-4 bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl p-5 sm:p-6 border-2 border-emerald-400/30 dark:border-emerald-500/30 shadow-2xl shadow-emerald-500/10 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/5 rounded-xl flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-500" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-bold text-foreground text-base">
                {station.prices?.length > 0 ? (station.accuracy || 100) : 0}% Accuracy
              </div>
              <div className="text-xs text-muted-foreground/80 font-medium">
                {station.prices?.length > 0 
                  ? `Verified by ${station.contributors || 1} contributors`
                  : "No reports yet"}
              </div>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full text-xs font-bold shadow-lg shadow-teal-500/30">
            Trusted
          </div>
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
                        <div className="font-bold text-foreground text-lg">
                          {fuel.type}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditPrice(fuel)}
                            className="min-h-11 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                          >
                            Edit
                          </button>
                          {canDeleteStation && (
                            <button
                              type="button"
                              onClick={() => setPriceDeleteTarget(fuel)}
                              className="min-h-11 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300"
                            >
                              Delete
                            </button>
                          )}
                        </div>
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
                      <button
                        onClick={() => handleConfirmPrice(fuel)}
                        className="flex items-center justify-end gap-1.5 w-full text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 font-medium text-sm transition-colors group"
                      >
                        <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>Confirm ({fuel.confirmations || 0})</span>
                      </button>
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
                <button
                  onClick={handleReportPrice}
                  className="w-full px-6 py-4 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-2xl font-bold text-sm text-foreground shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <NotebookPen className="w-4 h-4" strokeWidth={2.5} />
                  Report Price
                </button>
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

      <div className="lg:hidden px-4 sm:px-5 py-6">
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
                    <div className="font-bold text-foreground text-base">
                      {fuel.type}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditPrice(fuel)}
                        className="min-h-11 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                      >
                        Edit
                      </button>
                      {canDeleteStation && (
                        <button
                          type="button"
                          onClick={() => setPriceDeleteTarget(fuel)}
                          className="min-h-11 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300"
                        >
                          Delete
                        </button>
                      )}
                    </div>
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
                  <button
                    onClick={() => handleConfirmPrice(fuel)}
                    className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 font-medium text-sm transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm ({fuel.confirmations || 0})</span>
                  </button>
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
          <button
            onClick={handleReportPrice}
            className="w-full px-6 py-4 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-2xl font-bold text-sm text-foreground shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <NotebookPen className="w-4 h-4" strokeWidth={2.5} />
            Report Price
          </button>
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
    </>
  );
}
