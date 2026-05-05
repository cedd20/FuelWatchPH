import { useState, useMemo, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useLocation } from "react-router";
import { ArrowLeft, CheckCircle, MapPin, AlertTriangle, TrendingDown, TrendingUp, Info, X, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/Button";
import { AuthPrompt } from "@/shared/components/AuthPrompt";
import { useAuthGuard } from "@/shared/hooks/useAuthGuard";
import { useStation } from "@/hooks/useStations";
import { useReportPricesBatch } from "@/hooks/usePrices";
import { toast } from "sonner";
import { FUEL_TYPES } from "@/shared/utils/fuelTypes";
import { appendStationPriceHistory } from "@/shared/utils/stationPriceHistory";
import { formatPrice, isValidPrice } from "@/shared/utils/priceUtils";
import { useAuth } from "@/app/providers/AuthContext";
import { KarmaService } from "@/lib/karmaService";

function formatPeso(value) {
  return formatPrice(value);
}

function PriceUpdateConfirmationModal({
  isOpen,
  stationName,
  changes,
  isSubmitting,
  error,
  onCancel,
  onConfirm,
  onRetry,
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === "Escape" && !isSubmitting) {
          onCancel();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, isSubmitting, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !isSubmitting && onCancel()}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl sm:max-h-[88vh] overflow-hidden rounded-t-3xl sm:rounded-3xl border-2 border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)] my-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 px-5 py-6 sm:px-7 sm:py-7 text-white relative flex items-start justify-between">
          <div className="flex-1 pr-4">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Review Price Updates</h3>
            <p className="mt-2 text-sm sm:text-base text-white/90 font-medium">
              {error ? "An error occurred" : "Please review before confirming"}
            </p>
          </div>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(100vh-340px)] sm:max-h-[calc(88vh-280px)] px-5 sm:px-7 py-6 sm:py-7 space-y-5">
          {error ? (
            <div className="rounded-2xl border border-rose-300 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/30 p-4 sm:p-5 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 mt-0.5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              <div>
                <p className="text-sm sm:text-base font-bold text-rose-900 dark:text-rose-200 mb-1">Update Failed</p>
                <p className="text-sm text-rose-800 dark:text-rose-300 leading-relaxed">
                  {error}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-emerald-200/70 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/30 p-4 sm:p-5">
                <p className="text-xs uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-300">Station Name</p>
                <p className="mt-1.5 text-base sm:text-lg font-bold text-foreground">{stationName || "Unknown Station"}</p>
              </div>

              <div className="rounded-2xl border border-amber-200/70 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/20 p-4 sm:p-5 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 mt-0.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <p className="text-sm sm:text-base text-amber-900 dark:text-amber-200 font-medium leading-relaxed">
                  These fuel price updates will be visible to other users. Please ensure reliability.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm font-black tracking-wide text-muted-foreground uppercase">Changes ({changes.length})</p>
                  <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full">
                    {changes.length} {changes.length === 1 ? "item" : "items"}
                  </span>
                </div>

                {changes.map((change) => {
                  const diffClass = change.isNew
                    ? "text-emerald-600 dark:text-emerald-400"
                    : change.difference > 0
                      ? "text-rose-600 dark:text-rose-400"
                      : change.difference < 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-foreground";

                  return (
                    <div
                      key={change.fuelType}
                      className="rounded-2xl border-2 border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <h4 className="text-base sm:text-lg font-bold text-foreground">{change.fuelType}</h4>
                        <span className={`text-xs sm:text-sm font-bold ${diffClass} whitespace-nowrap`}>
                          {change.isNew ? "🆕 New price" : `${change.difference > 0 ? "📈" : "📉"} ${change.difference > 0 ? "+" : ""}${formatPeso(change.difference)}`}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 p-3 sm:p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current</p>
                          <p className="mt-2 text-sm sm:text-base font-bold text-foreground">
                            {formatPrice(change.previousPrice)}
                          </p>
                        </div>
                        <div className="rounded-xl border-2 border-emerald-300 dark:border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 p-3 sm:p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Updated To</p>
                          <p className="mt-2 text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-300">
                            {formatPeso(change.newPrice)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 backdrop-blur px-5 py-4 sm:px-7 sm:py-5 grid grid-cols-2 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-2xl border-2 border-gray-300 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-800 px-4 py-3 sm:py-3.5 text-sm sm:text-base font-bold text-foreground hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={error ? onRetry : onConfirm}
            disabled={isSubmitting && !error}
            className="rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 px-4 py-3 sm:py-3.5 text-sm sm:text-base font-bold text-white shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isSubmitting && !error ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : error ? (
              "Try Again"
            ) : (
              "Confirm Update"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function UpdatePrice() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const isKarmaBlocked = user?.karma < 0;
  const selectedFuelType = location.state?.fuelType;
  
  const [prices, setPrices] = useState({});
  const [isNearStation] = useState(true); 
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [submissionError, setSubmissionError] = useState(null);

  const queryClient = useQueryClient();
  const { data: rawStation, isLoading } = useStation(id);
  const reportPricesBatchMutation = useReportPricesBatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const station = useMemo(() => {
    if (!rawStation) return null;
    return {
      ...rawStation,
      prices: Object.entries(rawStation.latest_prices || {}).map(([type, details]) => ({
        type,
        price: details.price
      }))
    };
  }, [rawStation]);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
    }
  }, [isAuthenticated]);

  const fuelTypesList = useMemo(() => {
    if (isLoading || !rawStation) return [];
    
    // Create a map of existing prices for easy lookup
    const existingPrices = rawStation.latest_prices || {};
    
    // Return all standard fuel types, noting current prices if they exist
    return FUEL_TYPES.map(label => ({
      id: label.toLowerCase().replace(/ /g, ''),
      label: label,
      currentPrice: existingPrices[label]?.price || null,
      isNew: !existingPrices[label]
    }));
  }, [rawStation, isLoading]);

  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const handlePriceChange = (fuelId, value) => {
    setPrices(prev => {
      const newPrices = { ...prev };
      if (value === "") {
        delete newPrices[fuelId];
      } else {
        newPrices[fuelId] = value;
      }
      return newPrices;
    });
  };

  const hasAnyPrice = Object.keys(prices).length > 0;

  const buildValidatedChanges = () => {
    const epsilon = 0.0001;
    const invalidFuelTypes = [];
    const changes = [];

    const entries = Object.entries(prices).filter(([, value]) => String(value).trim() !== "");

    for (const [fuelId, rawValue] of entries) {
      const fuelMeta = fuelTypesList.find((fuel) => fuel.id === fuelId);
      if (!fuelMeta) continue;

      const numericValue = Number(rawValue);

      if (!Number.isFinite(numericValue) || numericValue <= 0) {
        invalidFuelTypes.push(fuelMeta.label);
        continue;
      }

      const previousPrice = fuelMeta.currentPrice == null ? null : Number(fuelMeta.currentPrice);
      const isChanged = previousPrice == null || Math.abs(numericValue - previousPrice) > epsilon;

      if (!isChanged) continue;

      changes.push({
        fuelId,
        fuelType: fuelMeta.label,
        previousPrice,
        newPrice: numericValue,
        difference: previousPrice == null ? numericValue : numericValue - previousPrice,
        isNew: previousPrice == null,
      });
    }

    return { changes, invalidFuelTypes };
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

    if (!isNearStation) {
      toast.error("You must be near the station to update prices");
      return;
    }

    if (!hasAnyPrice) {
      toast.error("Please enter at least one fuel price");
      return;
    }

    const { changes, invalidFuelTypes } = buildValidatedChanges();

    if (invalidFuelTypes.length > 0) {
      toast.error(`Enter valid numeric prices for: ${invalidFuelTypes.join(", ")}`);
      return;
    }

    if (changes.length === 0) {
      toast.error("No actual price changes detected. Update at least one fuel price before submitting.");
      return;
    }

    setPendingChanges(changes);
    setSubmissionError(null);
    setShowConfirmation(true);
  };

  const handleConfirmSave = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);
    
    try {
      const batchData = pendingChanges.map((change) => ({
          station_id: id,
          fuel_type: change.fuelType,
          price: change.newPrice,
          observed_at: new Date().toISOString()
        }));

      if (batchData.length === 0) {
        setIsSubmitting(false);
        setSubmissionError("No valid changes found to submit.");
        return;
      }

      await reportPricesBatchMutation.mutateAsync(batchData);

      try {
        appendStationPriceHistory({
          stationId: id,
          stationName: station?.name,
          entries: pendingChanges.map((change) => ({
            fuelType: change.fuelType,
            price: change.newPrice,
            observedAt: new Date().toISOString(),
          })),
        });
      } catch (historyError) {
        console.warn("Could not save local price history", historyError);
      }

      // Add to KarmaService
      KarmaService.addContribution('Updated Fuel Price', {
        stationName: station?.name,
        fuelType: pendingChanges.map(c => c.fuelType).join(', '),
        price: pendingChanges[0]?.newPrice // Just for logging context
      });
      
      // Invalidate notifications to show the update notification immediately
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      
      // Close modal and show success screen
      setShowConfirmation(false);
      setShowSuccess(true);
      setPendingChanges([]);
      
      setTimeout(() => {
        navigate(`/app/station/${id}`);
      }, 2500);
    } catch (error) {
      const errorMsg = error.message || "Failed to update prices. Please check your connection and try again.";
      setSubmissionError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    handleConfirmSave();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Fetching station details...</p>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-6 lg:mb-8 shadow-2xl shadow-teal-500/50">
          <CheckCircle className="w-14 h-14 lg:w-16 lg:h-16 text-white" strokeWidth={2.5} />
        </div>
        <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-3 lg:mb-4 tracking-tight">Success!</h2>
        <p className="text-center text-muted-foreground mb-6 lg:mb-8 font-medium lg:text-lg">
          Your price updates have been submitted
        </p>
        <div className="flex items-center gap-2 text-sm lg:text-base text-muted-foreground font-semibold">
          <div className="w-2 h-2 lg:w-3 lg:h-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full animate-pulse shadow-lg shadow-teal-500/50" />
          <span>Verifying updates...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <AuthPrompt
        isOpen={showAuthPrompt}
        onClose={() => {
          setShowAuthPrompt(false);
          navigate(`/app/station/${id}`);
        }}
        message="Sign in to report or update fuel prices."
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 pb-10">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-12 pb-16 lg:pb-24 px-4 relative overflow-hidden">
          {/* Enhanced radial glow background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl" />

          <div className="relative z-10 max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-3 lg:mb-4">
              <button
                onClick={() => navigate(-1)}
                className="w-12 h-12 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl shadow-black/20 hover:scale-110 transition-transform border-2 border-white/40"
              >
                <ArrowLeft className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              </button>
              <h1 className="text-3xl lg:text-4xl font-bold text-white drop-shadow-2xl tracking-tight">Update Fuel Prices</h1>
            </div>
            <p className="text-white/95 text-base lg:text-lg font-medium drop-shadow-lg pl-1 lg:pl-2">
              {station?.name || "Loading..."}
            </p>
            {selectedFuelType && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
                Editing {selectedFuelType}
              </div>
            )}
          </div>
        </div>

        {/* Content Container */}
        <div className="max-w-6xl mx-auto px-4 lg:px-8 -mt-10 lg:-mt-16 relative z-20">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl shadow-black/10 border-2 border-gray-100 dark:border-neutral-800 p-6 lg:p-8 backdrop-blur-2xl">
            {isKarmaBlocked ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-6 border-4 border-rose-200 dark:border-rose-800">
                  <AlertTriangle className="w-10 h-10 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Action Blocked</h3>
                <p className="text-lg text-muted-foreground max-w-md font-medium leading-relaxed">
                  Your Karma is currently negative. You cannot update fuel prices until your Karma improves.
                </p>
                <Button 
                  className="mt-8"
                  onClick={() => navigate(`/app/station/${id}`)}
                >
                  Return to Station
                </Button>
              </div>
            ) : (
              <>
            {/* Location Status */}
            <div className="mb-8">
              {isNearStation ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-400/50 rounded-2xl p-5 flex items-start gap-3 lg:gap-4 shadow-xl shadow-emerald-500/10 transition-all hover:shadow-emerald-500/20">
                  <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-xl flex-shrink-0">
                    <MapPin className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1 lg:text-lg">
                      Location Verified
                    </div>
                    <div className="text-sm lg:text-base text-emerald-600/80 dark:text-emerald-400/80 font-medium">
                      You are within range to update prices for this station
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-950/30 border-2 border-yellow-400/50 rounded-2xl p-5 flex items-start gap-3 lg:gap-4 shadow-xl shadow-yellow-500/10">
                  <div className="bg-yellow-100 dark:bg-yellow-900/50 p-2 rounded-xl flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <div className="font-bold text-yellow-600 dark:text-yellow-400 mb-1 lg:text-lg">
                      Too Far from Station
                    </div>
                    <div className="text-sm lg:text-base text-yellow-600/80 dark:text-yellow-400/80 font-medium">
                      Please move closer to the station to update prices
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-4 tracking-tight">
                  Update Prices
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Enter new prices for any fuel types you want to update. Leave fields blank if the price hasn't changed.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                  {fuelTypesList.map((fuel) => {
                    const currentEnteredPrice = prices[fuel.id];
                    const isEdited = currentEnteredPrice !== undefined && currentEnteredPrice !== "";
                    const hasCurrent = fuel.currentPrice != null;
                    
                    return (
                      <div
                        key={fuel.id}
                        className={`w-full p-5 lg:p-6 rounded-3xl border-2 transition-all shadow-xl flex flex-col gap-5 ${
                          isEdited
                            ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 ring-2 ring-emerald-500/10"
                            : hasCurrent
                              ? "border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900/50"
                              : "border-dashed border-gray-200 dark:border-neutral-700 bg-gray-50/50 dark:bg-neutral-900/30"
                        }`}
                      >
                        {/* Status Badge */}
                        <div className="flex items-center justify-between gap-3">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            hasCurrent 
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" 
                              : "bg-gray-200 text-gray-600 dark:bg-neutral-700 dark:text-neutral-400"
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${hasCurrent ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
                            {hasCurrent ? "Current Price Recorded" : "No Price Recorded Yet"}
                          </div>
                          
                          {isEdited && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Editing
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col flex-1 gap-4">
                          {/* Fuel Info */}
                          <div>
                            <h4 className="font-black text-foreground text-xl lg:text-2xl tracking-tight mb-1">
                              {fuel.label}
                            </h4>
                            
                            <div className={`mt-3 p-3.5 rounded-2xl border ${
                              hasCurrent 
                                ? "bg-emerald-500/5 border-emerald-500/20" 
                                : "bg-gray-100/50 dark:bg-neutral-800/50 border-gray-200 dark:border-neutral-700"
                            }`}>
                              <div className="text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-1">
                                {hasCurrent ? "Recorded Price" : "Entry Status"}
                              </div>
                              <div className={`text-lg lg:text-xl font-bold tracking-tight ${hasCurrent ? "text-foreground" : "text-muted-foreground/60"}`}>
                                {hasCurrent ? (
                                  <span className="flex items-baseline gap-1">
                                    <span className="text-sm">₱</span>
                                    {formatPrice(fuel.currentPrice).replace('₱', '')}
                                  </span>
                                ) : (
                                  <span className="text-sm italic">Pending First Entry</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Input Field Area */}
                          <div className="space-y-2 mt-auto">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 pl-1">
                              New Price
                            </label>
                            <div className="relative w-full">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground pointer-events-none">
                                ₱
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                value={currentEnteredPrice || ""}
                                onChange={(e) => handlePriceChange(fuel.id, e.target.value)}
                                placeholder={hasCurrent ? "Enter updated price..." : "Enter first-time price..."}
                                className="w-full pl-10 pr-4 py-4 text-xl font-bold bg-white dark:bg-neutral-950 rounded-2xl border-2 border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 shadow-sm text-foreground transition-all placeholder:text-muted-foreground/30 placeholder:font-medium placeholder:text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Price Difference Indicator */}
                        {isEdited && hasCurrent && (
                          <div className="mt-2 pt-4 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Price Change:</span>
                            <div
                              className={`flex items-center gap-1 font-black text-base ${
                                parseFloat(currentEnteredPrice) < fuel.currentPrice
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : parseFloat(currentEnteredPrice) > fuel.currentPrice 
                                    ? "text-rose-600 dark:text-rose-400"
                                    : "text-foreground"
                              }`}
                            >
                              {parseFloat(currentEnteredPrice) < fuel.currentPrice ? (
                                <TrendingDown className="w-4 h-4" strokeWidth={3} />
                              ) : parseFloat(currentEnteredPrice) > fuel.currentPrice ? (
                                <TrendingUp className="w-4 h-4" strokeWidth={3} />
                              ) : null}
                              <span>{formatPrice(Math.abs(parseFloat(currentEnteredPrice) - fuel.currentPrice))}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border-2 border-emerald-200/50 dark:border-emerald-800/30 rounded-2xl p-6 shadow-lg">
                <h4 className="font-bold text-foreground text-base lg:text-lg mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Update Guidelines
                </h4>
                <ul className="space-y-2 text-sm lg:text-base text-muted-foreground font-medium">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    Verify the prices directly from the station display
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    Update only if you're currently at the station
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    Double-check all entered prices for reliability
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  disabled={!hasAnyPrice || !isNearStation}
                  className="py-4 lg:py-5 text-lg shadow-xl shadow-emerald-500/20"
                >
                  Submit Updates
                </Button>
              </div>
            </form>
            </>
            )}
          </div>
        </div>
      </div>
      <PriceUpdateConfirmationModal
        isOpen={showConfirmation}
        stationName={station?.name}
        changes={pendingChanges}
        isSubmitting={isSubmitting}
        error={submissionError}
        onCancel={() => setShowConfirmation(false)}
        onConfirm={handleConfirmSave}
        onRetry={handleRetry}
      />
    </>
  );
}
