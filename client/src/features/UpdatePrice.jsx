import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useLocation } from "react-router";
import { ArrowLeft, CheckCircle, MapPin, AlertTriangle, TrendingDown, TrendingUp, Info } from "lucide-react";
import { Button } from "@/shared/components/Button";
import { AuthPrompt } from "@/shared/components/AuthPrompt";
import { ConfirmationModal } from "@/shared/components/ConfirmationModal";
import { useAuthGuard } from "@/shared/hooks/useAuthGuard";
import { useStation } from "@/hooks/useStations";
import { useReportPricesBatch } from "@/hooks/usePrices";
import { toast } from "sonner";
import { FUEL_TYPES } from "@/shared/utils/fuelTypes";

export function UpdatePrice() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const selectedFuelType = location.state?.fuelType;
  
  const [prices, setPrices] = useState({});
  const [isNearStation] = useState(true); 
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

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

  const { showAuthPrompt: isAuthPromptOpen, closeAuthPrompt, requireAuth, returnTo } = useAuthGuard({
    defaultReturnTo: `/app/station/${id}`,
    message: "Sign in to report or update fuel prices.",
  });

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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!requireAuth(`/app/station/${id}`)) {
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

    // Show confirmation modal instead of immediate save
    setShowConfirmation(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmation(false);
    setIsSubmitting(true);
    
    try {
      const priceEntries = Object.entries(prices);
      const batchData = priceEntries.map(([fuelId, value]) => {
        const fuelType = fuelTypesList.find(f => f.id === fuelId)?.label;
        return {
          station_id: id,
          fuel_type: fuelType,
          price: parseFloat(value),
          observed_at: new Date().toISOString()
        };
      }).filter(entry => entry.fuel_type);

      if (batchData.length === 0) {
        setIsSubmitting(false);
        return;
      }

      await reportPricesBatchMutation.mutateAsync(batchData);
      
      // Invalidate notifications to show the update notification immediately
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      
      setShowSuccess(true);
      setTimeout(() => {
        navigate(`/app/station/${id}`);
      }, 2500);
    } catch (error) {
      toast.error(error.message || "Failed to update prices. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
        isOpen={isAuthPromptOpen}
        onClose={closeAuthPrompt}
        message={{ text: "Sign in to report or update fuel prices.", returnTo }}
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
                    
                    return (
                      <div
                        key={fuel.id}
                        className={`w-full p-4 lg:p-5 rounded-2xl border-2 transition-all shadow-lg flex flex-col ${
                          isEdited
                            ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-emerald-500/10"
                            : fuel.isNew
                              ? "border-dashed border-gray-300 dark:border-neutral-700 bg-gray-50/30 dark:bg-neutral-900/30 opacity-80"
                              : "border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50"
                        }`}
                      >
                        <div className="flex flex-col flex-1 gap-4">
                          {/* Fuel Info */}
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <div className="font-bold text-foreground text-lg">
                                {fuel.label}
                              </div>
                              {fuel.isNew && (
                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-gray-200 dark:bg-neutral-700 text-gray-600 dark:text-gray-400 rounded-md">
                                  Not Setup
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground font-semibold">
                              {fuel.currentPrice 
                                ? `Current Record: ₱${fuel.currentPrice.toFixed(2)}`
                                : "No price recorded yet"}
                            </div>
                          </div>

                          {/* Input Field */}
                          <div className="relative w-full mt-auto">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground pointer-events-none">
                              ₱
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              value={currentEnteredPrice || ""}
                              onChange={(e) => handlePriceChange(fuel.id, e.target.value)}
                              placeholder="0.00"
                              className="w-full pl-10 pr-4 py-3 text-xl font-bold bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm text-foreground transition-all"
                            />
                          </div>
                        </div>

                        {/* Price Difference Indicator */}
                        {isEdited && fuel.currentPrice && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-neutral-700 flex items-center justify-between">
                            <span className="text-sm font-bold text-muted-foreground">Diff:</span>
                            <div
                              className={`flex items-center gap-1 font-bold text-base ${
                                parseFloat(currentEnteredPrice) < fuel.currentPrice
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : parseFloat(currentEnteredPrice) > fuel.currentPrice 
                                    ? "text-rose-600 dark:text-rose-400"
                                    : "text-foreground"
                              }`}
                            >
                              {parseFloat(currentEnteredPrice) < fuel.currentPrice ? (
                                <TrendingDown className="w-4 h-4" strokeWidth={2.5} />
                              ) : parseFloat(currentEnteredPrice) > fuel.currentPrice ? (
                                <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
                              ) : null}
                              <span>₱{Math.abs(parseFloat(currentEnteredPrice) - fuel.currentPrice).toFixed(2)}</span>
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
                    Double-check all entered prices for accuracy
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
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmSave}
        title="Confirm Price Update"
        message="You are about to update the public fuel prices for this station. Your update will be visible to all users and used as a reference for the community. Please ensure accuracy."
        confirmText="Update Prices"
        cancelText="Cancel"
        type="info"
      />
    </>
  );
}
