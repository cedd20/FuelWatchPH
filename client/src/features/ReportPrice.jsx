import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, CheckCircle, Clock3, Fuel, NotebookPen } from "lucide-react";
import { Button } from "@/shared/components/Button";
import { ConfirmationModal } from "@/shared/components/ConfirmationModal";
import { useAuth } from "@/app/providers/AuthContext";
import { useStation } from "@/hooks/useStations";
import { useReportPrice } from "@/hooks/usePrices";
import { toast } from "sonner";
import { FUEL_TYPES } from "@/shared/utils/fuelTypes";
import { formatPrice, isValidPrice } from "@/shared/utils/priceUtils";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function ReportPrice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [selectedFuelType, setSelectedFuelType] = useState("UL91");
  const [price, setPrice] = useState("");
  const [observedAt, setObservedAt] = useState(todayIsoDate());
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAnonymousConfirm, setShowAnonymousConfirm] = useState(false);
  const queryClient = useQueryClient();
  const { data: rawStation, isLoading } = useStation(id);
  const reportPriceMutation = useReportPrice();

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

  const currentStationPrice = useMemo(() => {
    if (!station) return null;
    return station.prices?.find((entry) => entry.type === selectedFuelType) || null;
  }, [selectedFuelType, station]);

  const validate = () => {
    const nextErrors = {};
    const numericPrice = Number(price);

    if (!selectedFuelType) nextErrors.selectedFuelType = "Select a fuel type";
    if (!price) nextErrors.price = "Enter a price";
    else if (Number.isNaN(numericPrice) || numericPrice < 40 || numericPrice > 200) {
      nextErrors.price = "Price must be between PHP 40 and PHP 200";
    }
    if (!observedAt) nextErrors.observedAt = "Pick a date";

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitPrice = async ({ anonymous = false } = {}) => {
    try {
      await reportPriceMutation.mutateAsync({
        station_id: id,
        fuel_type: selectedFuelType,
        price: Number(price),
        observed_at: new Date(observedAt).toISOString(),
        notes: notes || undefined,
      });

      // Invalidate notifications to show the update notification immediately
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      setShowSuccess(true);
      toast.success(anonymous ? "Price saved anonymously." : "Price reported successfully!");
      setTimeout(() => {
        navigate(`/app/station/${id}`);
      }, 1500);
    } catch (error) {
      toast.error(error.message || "Something went wrong. Please check your connection.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setShowAnonymousConfirm(true);
      return;
    }

    if (!validate()) {
      return;
    }

    await submitPrice({ anonymous: false });
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Price Submitted</h2>
        <p className="text-muted-foreground max-w-sm">
          Thanks for helping keep FuelWatch PH accurate.
        </p>
      </div>
    );
  }

  return (
    <>
      <ConfirmationModal
        isOpen={showAnonymousConfirm}
        onClose={() => setShowAnonymousConfirm(false)}
        onConfirm={() => {
          setShowAnonymousConfirm(false);
          if (validate()) {
            submitPrice({ anonymous: true });
          }
        }}
        title="Submit anonymously?"
        message="You are about to submit this price without signing in. It will be saved locally on this device and used immediately in the app."
        confirmText="Continue anonymously"
        cancelText="Go back"
        type="info"
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 pb-20">
        <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-12 pb-6 px-4 relative overflow-hidden">
          <div className="relative z-10 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Report Price</h1>
                <p className="text-white/80 text-sm">{station?.name || "Select a station"}</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-border p-5 shadow-lg">
            <label className="block text-sm font-bold text-foreground mb-3">Fuel Type</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FUEL_TYPES.map((fuel) => (
                <button
                  key={fuel}
                  type="button"
                  onClick={() => setSelectedFuelType(fuel)}
                  className={`min-h-11 rounded-xl border-2 px-3 py-3 text-sm font-bold transition-all ${
                    selectedFuelType === fuel
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300"
                      : "border-border bg-white dark:bg-neutral-900 text-foreground"
                  }`}
                >
                  {fuel}
                </button>
              ))}
            </div>
            {fieldErrors.selectedFuelType && <p className="mt-2 text-sm text-rose-600">{fieldErrors.selectedFuelType}</p>}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-border p-5 shadow-lg">
              <label className="block text-sm font-bold text-foreground mb-3">Price</label>
              <div className="relative">
                <Fuel className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="64.50"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-border bg-white dark:bg-neutral-900 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              {fieldErrors.price ? (
                <p className="mt-2 text-sm text-rose-600">{fieldErrors.price}</p>
              ) : currentStationPrice ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Current recorded price: {formatPrice(currentStationPrice.price)}
                </p>
              ) : null}
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-border p-5 shadow-lg">
              <label className="block text-sm font-bold text-foreground mb-3">Date Observed</label>
              <div className="relative">
                <Clock3 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="date"
                  value={observedAt}
                  onChange={(e) => setObservedAt(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-border bg-white dark:bg-neutral-900 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              {fieldErrors.observedAt && <p className="mt-2 text-sm text-rose-600">{fieldErrors.observedAt}</p>}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-border p-5 shadow-lg">
            <label className="block text-sm font-bold text-foreground mb-3">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Optional notes about the observed price"
              className="w-full rounded-xl border-2 border-border bg-white dark:bg-neutral-900 p-4 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
            />
          </div>

          {!isAuthenticated && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-border p-5 shadow-lg">
              <p className="text-sm font-semibold text-foreground mb-1">Submitting anonymously</p>
              <p className="text-sm text-muted-foreground">
                You can continue without signing in, but the price will only be stored locally on this device.
              </p>
            </div>
          )}

          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-4 flex items-start gap-3">
            <NotebookPen className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-semibold mb-1">Share a fresh price</p>
              <p className="text-muted-foreground">Use the current roadside price as observed, not an estimated average.</p>
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" fullWidth disabled={reportPriceMutation.isPending} variant="primary">
              {reportPriceMutation.isPending ? "Submitting..." : "Submit Price"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
