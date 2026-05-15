import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useBlocker } from "react-router";
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
  X,
  Flag,
} from "lucide-react";
import { useStation, useDeleteStation } from "@/hooks/useStations";
import { usePrices, useDeletePrice, useConfirmPrice } from "@/hooks/usePrices";
import { AuthPrompt } from "@/shared/components/AuthPrompt";
import { ConfirmationModal } from "@/shared/components/ConfirmationModal";
import { StationPriceHistoryCard } from "@/shared/components/StationPriceHistoryCard";
import { useAuth } from "@/app/providers/AuthContext";
import { StationLogo } from "@/shared/components/StationLogo";
import { toggleSaveStation, isStationSaved } from "@/shared/utils/favorites";
import { KarmaService } from "@/lib/karmaService";
import { formatPrice } from "@/shared/utils/priceUtils";
import { PageHeaderSkeleton, CardSkeleton, ChartSkeleton } from "@/shared/components/Skeleton";
import { toast } from "sonner";

const STATION_ISSUE_STORAGE_KEY = "fuelwatch_station_issue_reports";
const stationIssueTypes = [
  "Incorrect station information",
  "Wrong location pin",
  "Station permanently closed",
  "Station temporarily unavailable",
  "Duplicate station",
  "Incorrect brand/logo",
  "Other",
];

export function StationDetail() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSaved, setIsSaved] = useState(() => isStationSaved(id));

  const { user, isAuthenticated, refreshProfile } = useAuth();
  const isKarmaBlocked = user?.karma < 0;
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authPromptMessage, setAuthPromptMessage] = useState("Sign in to save stations and contribute price updates.");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [priceDeleteTarget, setPriceDeleteTarget] = useState(null);
  const [showReportIssueModal, setShowReportIssueModal] = useState(false);
  const [issueType, setIssueType] = useState("");
  const [issueDetails, setIssueDetails] = useState("");

  const { data: rawStation, isLoading, error } = useStation(id);
  const { data: rawPrices = [] } = usePrices({ station_id: id });


  const deleteStationMutation = useDeleteStation(id);
  const deletePriceMutation = useDeletePrice();
  
  const [hasConfirmedStation, setHasConfirmedStation] = useState(() => {
    const stored = localStorage.getItem(`station_confirmed_${id}`);
    if (!stored) return false;
    try {
      const data = JSON.parse(stored);
      // If user is authenticated but they only confirmed anonymously, let them confirm again to get Karma
      if (isAuthenticated && data.isAnonymous) return false;
      return true;
    } catch {
      return !!stored;
    }
  });
  
  const [showBackModalStep, setShowBackModalStep] = useState(0);
  const [hasViewedMeaningfully, setHasViewedMeaningfully] = useState(false);

  useEffect(() => {
    // Mark as meaningfully viewed after 5 seconds
    const timer = setTimeout(() => {
      setHasViewedMeaningfully(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

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
      prices: Object.entries(rawStation.latest_prices || {}).map(([type, details]) => {
        // Calculate trend and change from historical prices
        let trend = undefined;
        let change = undefined;
        
        if (rawPrices && rawPrices.length > 0) {
          const fuelPrices = rawPrices
            .filter(p => p.fuel_type === type)
            .sort((a, b) => new Date(b.observed_at) - new Date(a.observed_at));
            
          // If we have at least 2 records, we can calculate the difference
          if (fuelPrices.length > 1) {
             const latest = Number(fuelPrices[0].price);
             const previous = Number(fuelPrices[1].price);
             change = latest - previous;
             trend = change > 0 ? "up" : change < 0 ? "down" : "flat";
          }
        }

        return {
          type,
          price: details.price,
          confirmations: details.confirmation_count,
          observed_at: details.observed_at,
          id: details.id,
          trend: trend,
          change: change
        };
      }),
      lastUpdated: rawStation.latest_prices && Object.keys(rawStation.latest_prices).length > 0 
        ? new Date(Math.max(...Object.values(rawStation.latest_prices).map(p => new Date(p.observed_at)))).toLocaleDateString()
        : 'No reports',
      distance: rawStation.distance_km || 0
    };
  }, [rawStation, rawPrices]);

  const userRole = (user?.role || user?.app_metadata?.role || user?.user_metadata?.role || "").toLowerCase();
  const canEditStation = isAuthenticated;
  const canDeleteStation = ["admin", "moderator"].includes(userRole);

  const handleToggleSave = () => {
    if (!isAuthenticated) {
      setAuthPromptMessage("Sign in to save stations and contribute price updates.");
      setShowAuthPrompt(true);
      return;
    }
    const newState = toggleSaveStation(id);
    setIsSaved(newState);
  };

  const handleEditStation = () => {
    if (!isAuthenticated) {
      setAuthPromptMessage("Sign in to edit station information.");
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
      setAuthPromptMessage("Sign in to update fuel prices.");
      setShowAuthPrompt(true);
      return;
    }

    if (isKarmaBlocked) {
      toast.error("Your Karma is currently negative. You cannot update fuel prices.");
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

  const blocker = useBlocker(
    ({ currentLocation, nextLocation, historyAction }) =>
      hasViewedMeaningfully && 
      !hasConfirmedStation && 
      station?.prices?.length > 0 &&
      showBackModalStep === 0 &&
      currentLocation.pathname !== nextLocation.pathname &&
      historyAction === "POP"
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      setShowBackModalStep(1);
    }
  }, [blocker.state]);

  const handleSkipConfirmation = () => {
    setShowBackModalStep(0);
    if (blocker.state === "blocked") {
      blocker.proceed();
    } else {
      navigate(-1);
    }
  };

  const handleFinalConfirm = () => {
    const confirmationData = {
      stationId: id,
      isAnonymous: !isAuthenticated,
      confirmedAt: new Date().toISOString(),
    };
    
    if (!isAuthenticated) {
      localStorage.setItem(`station_confirmed_${id}`, JSON.stringify(confirmationData));
      setHasConfirmedStation(true);
      
      toast.success("Price confirmed anonymously. Sign in to earn Karma!");
    } else {
      localStorage.setItem(`station_confirmed_${id}`, JSON.stringify(confirmationData));
      setHasConfirmedStation(true);
      // Add to KarmaService
      KarmaService.addContribution('Confirmed Price', {
        stationName: station?.name
      });
      toast.success("Price confirmed! Karma points added.");
    }

    // Optimistically update the station data in the query cache
    qc.setQueryData(["stations", id], (oldStation) => {
      if (!oldStation) return oldStation;
      const newStation = JSON.parse(JSON.stringify(oldStation));
      newStation.contributors = (newStation.contributors || 1) + 1;
      newStation.trustScore = Math.min(100, (newStation.trustScore || 85) + 5);
      return newStation;
    });

    // Also update the full list cache if it exists
    qc.setQueryData(["stations", {}], (oldStations) => {
      if (!oldStations || !Array.isArray(oldStations)) return oldStations;
      return oldStations.map(s => {
        if (s.id === id) {
          const newStation = JSON.parse(JSON.stringify(s));
          newStation.contributors = (newStation.contributors || 1) + 1;
          newStation.trustScore = Math.min(100, (newStation.trustScore || 85) + 5);
          return newStation;
        }
        return s;
      });
    });

    refreshProfile();
    setShowBackModalStep(0);
    setTimeout(() => {
      if (blocker.state === "blocked") {
        blocker.proceed();
      } else {
        navigate(-1);
      }
    }, 300); // small delay to let toast appear and modal close
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 pb-12">
        <PageHeaderSkeleton />
        <div className="max-w-6xl mx-auto px-4 lg:px-8 space-y-8 -mt-10 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Prices Skeleton */}
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            </div>
            <div className="lg:col-span-1 space-y-6">
              {/* Trust Score & Actions Skeleton */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border-2 border-gray-100 dark:border-neutral-800 shadow-xl space-y-6">
                <div className="flex items-center gap-3">
                  <CardSkeleton className="w-12 h-12 rounded-xl" />
                  <CardSkeleton className="h-6 w-32" />
                </div>
                <CardSkeleton className="h-14 w-full rounded-2xl" />
                <CardSkeleton className="h-14 w-full rounded-2xl" />
              </div>
            </div>
          </div>
          {/* Chart History Skeleton */}
          <ChartSkeleton />
        </div>
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

  const handleOpenUpdatePrices = () => {
    if (!isAuthenticated) {
      setAuthPromptMessage("Sign in to update fuel prices.");
      setShowAuthPrompt(true);
      return;
    }

    if (isKarmaBlocked) {
      toast.error("Your Karma is currently negative. You cannot update fuel prices.");
      return;
    }

    navigate(`/app/update-price/${id}`);
  };

  const handleOpenReportIssues = () => {
    if (!isAuthenticated) {
      setAuthPromptMessage({
        text: "Sign in to report station issues and help maintain accurate station information.",
        returnTo: `/app/station/${id}`,
      });
      setShowAuthPrompt(true);
      return;
    }

    setShowReportIssueModal(true);
  };

  const handleCloseReportIssues = () => {
    setShowReportIssueModal(false);
    setIssueType("");
    setIssueDetails("");
  };

  const handleSubmitIssueReport = () => {
    if (!issueType) {
      toast.error("Please select an issue type.");
      return;
    }

    const nextReport = {
      id: `issue-${Date.now()}`,
      stationId: id,
      stationName: station.name,
      issueType,
      details: issueDetails.trim(),
      reportedAt: new Date().toISOString(),
      reportedBy: user?.id || "anonymous",
    };

    const existingReports = JSON.parse(localStorage.getItem(STATION_ISSUE_STORAGE_KEY) || "[]");
    localStorage.setItem(
      STATION_ISSUE_STORAGE_KEY,
      JSON.stringify([nextReport, ...existingReports]),
    );

    toast.success("Issue report submitted. Thank you for helping keep station information accurate.");
    handleCloseReportIssues();
  };

  return (
    <>
      <AuthPrompt
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        message={authPromptMessage}
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
      <ConfirmationModal
        isOpen={showBackModalStep === 1}
        onClose={handleSkipConfirmation}
        onConfirm={() => setShowBackModalStep(2)}
        title="Confirm Station Prices?"
        message={
          isAuthenticated 
            ? "Do you want to confirm if the prices are correct in this station? This helps improve data reliability and increases your Karma points."
            : "Do you want to confirm if the prices are correct? You can confirm as a guest, but Karma rewards are only available when signed in."
        }
        confirmText="Proceed"
        cancelText="Skip"
        type="info"
      />
      <ConfirmationModal
        isOpen={showBackModalStep === 2}
        onClose={() => setShowBackModalStep(1)}
        onConfirm={handleFinalConfirm}
        title="Are you sure?"
        message={
          isAuthenticated
            ? "Are you sure you want to confirm these station prices as reliable? Karma points will be added to your profile."
            : "Are you sure? You are confirming as an anonymous guest. Your contribution helps the community, but you won't earn Karma points."
        }
        confirmText="Yes, Confirm Prices"
        cancelText="Cancel"
        type="info"
      />
      {showReportIssueModal ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/55 backdrop-blur-sm p-0 lg:items-center lg:p-4">
          <div
            className="absolute inset-0"
            onClick={handleCloseReportIssues}
          />
          <div className="relative w-full max-w-xl rounded-t-[2rem] lg:rounded-[2rem] bg-white dark:bg-neutral-900 border border-white/20 dark:border-neutral-800 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.45)]">
            <div className="px-5 pt-4 pb-3 lg:px-6 lg:pt-5 lg:pb-4 border-b border-gray-100 dark:border-neutral-800">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-200 dark:bg-neutral-700 lg:hidden" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 dark:bg-amber-950/30 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300 mb-3">
                    <Flag className="w-3.5 h-3.5" strokeWidth={2.5} />
                    Station Issues Only
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">Report Issues</h3>
                  <p className="mt-1 text-sm text-muted-foreground font-medium">
                    Report station information problems for {station.name}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseReportIssues}
                  className="w-10 h-10 rounded-full border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <div className="px-5 py-4 lg:px-6 lg:py-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="rounded-2xl bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Station Name</div>
                <div className="font-bold text-foreground">{station.name}</div>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Issue Type</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full rounded-2xl border-2 border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select an issue type</option>
                  {stationIssueTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Details (Optional)</label>
                <textarea
                  value={issueDetails}
                  onChange={(e) => setIssueDetails(e.target.value)}
                  placeholder="Add more context to help us understand the station issue."
                  rows={4}
                  className="w-full rounded-2xl border-2 border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            <div className="px-5 py-4 lg:px-6 border-t border-gray-100 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 rounded-b-[2rem] pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="flex flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseReportIssues}
                  fullWidth
                  size="md"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmitIssueReport}
                  variant="primary"
                  fullWidth
                  size="md"
                  className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 shadow-xl shadow-orange-500/25 border-orange-400/20"
                >
                  Submit Issue
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-950 pb-48 lg:pb-8">
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

          {/* Metadata + Trust Score Row */}
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
            
            {/* Trust Score Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white/15 backdrop-blur-md rounded-full border border-white/20 flex-shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={2.5} />
              <span className="font-bold text-white text-xs sm:text-sm whitespace-nowrap">
                {station.prices?.length > 0 ? (station.trustScore || station.accuracy || 100) : 0}%
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
                      <div className="flex items-center gap-2 mt-1">
                        {typeof fuel.change === 'number' && fuel.change !== 0 ? (
                          fuel.trend === "up" ? (
                            <>
                              <TrendingUp className="w-5 h-5 text-rose-600 dark:text-rose-400" strokeWidth={2.5} />
                              <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                                ₱{Math.abs(fuel.change).toFixed(2)} higher
                              </span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="w-5 h-5 text-emerald-600 dark:text-emerald-500" strokeWidth={2.5} />
                              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-500">
                                ₱{Math.abs(fuel.change).toFixed(2)} lower
                              </span>
                            </>
                          )
                        ) : typeof fuel.change === 'number' && fuel.change === 0 ? (
                          <span className="text-sm font-bold text-muted-foreground">No change</span>
                        ) : (
                          <span className="text-sm font-bold text-muted-foreground">No previous data</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-foreground tracking-tighter mb-1">
                        {formatPrice(fuel.price)}
                      </div>
                      <div className="text-sm text-muted-foreground/70 font-semibold mb-3">per liter</div>
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
                    {station.prices?.length > 0 ? (station.trustScore || station.accuracy || 100) : 0}% Trust Score
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
                  onClick={handleOpenUpdatePrices}
                  className={`w-full px-6 py-4 rounded-2xl font-bold text-base shadow-2xl transition-all border-2 ${
                    isKarmaBlocked 
                      ? "bg-gray-100 dark:bg-neutral-800 text-muted-foreground border-gray-200 dark:border-neutral-700 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white shadow-emerald-500/50 border-emerald-400/30"
                  }`}
                >
                  {isKarmaBlocked ? "Action Blocked (Negative Karma)" : "Update Fuel Price"}
                </button>
                <button
                  onClick={handleGetDirections}
                  className="w-full px-5 py-3.5 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-2xl font-bold text-sm text-foreground shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4" strokeWidth={2.5} />
                  Get Directions
                </button>
                <button
                  onClick={handleOpenReportIssues}
                  className="w-full px-5 py-3.5 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800/40 rounded-2xl font-bold text-sm text-amber-700 dark:text-amber-300 shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Flag className="w-4 h-4" strokeWidth={2.5} />
                  Report Issues
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Trust Score Summary */}
      <div className="lg:hidden px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-b border-emerald-200 dark:border-emerald-800/40">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-bold text-foreground text-sm">
                {station.prices?.length > 0 ? (station.trustScore || station.accuracy || 100) : 0}% Trust Score
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
                    <div className="flex items-center gap-2 mt-1">
                      {typeof fuel.change === 'number' && fuel.change !== 0 ? (
                        fuel.trend === "up" ? (
                          <>
                            <TrendingUp className="w-4 h-4 text-rose-600 dark:text-rose-400" strokeWidth={2.5} />
                            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                              ₱{Math.abs(fuel.change).toFixed(2)} higher
                            </span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-500" strokeWidth={2.5} />
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-500">
                              ₱{Math.abs(fuel.change).toFixed(2)} lower
                            </span>
                          </>
                        )
                      ) : typeof fuel.change === 'number' && fuel.change === 0 ? (
                        <span className="text-sm font-bold text-muted-foreground">No change</span>
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">No previous data</span>
                      )}
                    </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="text-3xl font-bold text-foreground tracking-tighter mb-1">
                    {formatPrice(fuel.price)}
                  </div>
                  <div className="text-xs text-muted-foreground/70 font-semibold mb-1">per liter</div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      <div className="px-4 sm:px-5 lg:px-8 pb-8 lg:pb-10">
        <div className="max-w-6xl mx-auto">
          <StationPriceHistoryCard stationId={id} stationName={station.name} compact />
        </div>
      </div>

      <div className="lg:hidden fixed inset-x-0 bottom-[6.5rem] z-40 px-4 sm:px-5 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto rounded-[1.9rem] border border-white/60 dark:border-neutral-700/70 bg-white/96 dark:bg-neutral-900/96 backdrop-blur-2xl shadow-[0_28px_60px_-24px_rgba(0,0,0,0.5)] px-3 py-3.5 pb-[calc(0.9rem+env(safe-area-inset-bottom))]">
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={handleOpenUpdatePrices}
              className={`min-h-[3.75rem] rounded-2xl px-3 py-3 text-xs font-bold leading-tight transition-all ${
                isKarmaBlocked
                  ? "bg-gray-100 dark:bg-neutral-800 text-muted-foreground border border-gray-200 dark:border-neutral-700"
                  : "bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
              }`}
            >
              Update Fuel Prices
            </button>
            <button
              type="button"
              onClick={handleGetDirections}
              className="min-h-[3.75rem] rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-3 text-xs font-bold leading-tight text-foreground"
            >
              Get Directions
            </button>
            <button
              type="button"
              onClick={handleOpenReportIssues}
              className="min-h-[3.75rem] rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 px-3 py-3 text-xs font-bold leading-tight text-amber-700 dark:text-amber-300"
            >
              Report Issues
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
