import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useBlocker } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
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
  Navigation,
  SearchX,
  CheckCircle2,
  X,
  Flag,
  Sparkles,
  Zap,
} from "lucide-react";
import { useStation, useDeleteStation } from "@/hooks/useStations";
import { usePrices, useDeletePrice, useConfirmPrice } from "@/hooks/usePrices";
import { AuthPrompt } from "@/shared/components/AuthPrompt";
import { ConfirmationModal } from "@/shared/components/ConfirmationModal";
import { StationPriceHistoryCard } from "@/shared/components/StationPriceHistoryCard";
import { useAuth } from "@/app/providers/AuthContext";
import { StationLogo } from "@/shared/components/StationLogo";
import { toggleSaveStation, isStationSaved } from "@/shared/utils/favorites";
import { getDistanceInKm } from "@/shared/utils/location";
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
      if (isAuthenticated && data.isAnonymous) return false;
      return true;
    } catch {
      return !!stored;
    }
  });
  
  const [showBackModalStep, setShowBackModalStep] = useState(0);
  const [hasViewedMeaningfully, setHasViewedMeaningfully] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(true);

  // Get user location on mount
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      console.warn("⚠️ Geolocation not available in StationDetail");
      setIsLocating(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
      },
      (error) => {
        console.warn("⚠️ Geolocation failed in StationDetail:", error.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasViewedMeaningfully(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const station = useMemo(() => {
    if (!rawStation) return null;
    return {
      ...rawStation,
      prices: Object.entries(rawStation.latest_prices || {}).map(([type, details]) => {
        let trend = undefined;
        let change = undefined;
        if (rawPrices && rawPrices.length > 0) {
          const fuelPrices = rawPrices
            .filter(p => p.fuel_type === type)
            .sort((a, b) => new Date(b.observed_at) - new Date(a.observed_at));
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
      distance: (() => {
        if (userLocation && rawStation.lat !== undefined && rawStation.lng !== undefined) {
          return getDistanceInKm(userLocation.lat, userLocation.lng, rawStation.lat, rawStation.lng).toFixed(1);
        }
        return rawStation.distance_km !== null && rawStation.distance_km !== undefined
          ? Number(rawStation.distance_km).toFixed(1)
          : "0.0";
      })()
    };
  }, [rawStation, rawPrices, userLocation]);

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

  const confirmPriceMutation = useConfirmPrice();

  const handleFinalConfirm = async () => {
    const confirmationData = { stationId: id, isAnonymous: !isAuthenticated, confirmedAt: new Date().toISOString() };
    localStorage.setItem(`station_confirmed_${id}`, JSON.stringify(confirmationData));
    setHasConfirmedStation(true);
    
    // Call confirmation mutation for each price report
    if (station?.prices && station.prices.length > 0) {
      try {
        const promises = station.prices.map(p => {
          if (p.id) {
            return confirmPriceMutation.mutateAsync(p.id).catch(err => {
              if (err.status === 429 || err.message?.includes("Already confirmed recently")) {
                return null; // Ignore duplicate confirmation
              }
              throw err; // Propagate actual errors
            });
          }
          return Promise.resolve();
        });
        await Promise.all(promises);
        
        if (isAuthenticated) {
          KarmaService.addContribution('Confirmed Price', { stationName: station?.name });
          toast.success("Price confirmed! Karma points added.");
        } else {
          toast.success("Price confirmed anonymously. Sign in to earn Karma!");
        }
      } catch (err) {
        console.error("Failed to confirm prices:", err);
        toast.error("Some prices could not be confirmed.");
      }
    } else {
      if (isAuthenticated) {
        KarmaService.addContribution('Confirmed Price', { stationName: station?.name });
        toast.success("Price confirmed! Karma points added.");
      } else {
        toast.success("Price confirmed anonymously. Sign in to earn Karma!");
      }
    }

    qc.invalidateQueries(["stations", id]);
    refreshProfile();
    setShowBackModalStep(0);
    setTimeout(() => {
      if (blocker.state === "blocked") blocker.proceed();
      else navigate(-1);
    }, 300);
  };

  const blocker = useBlocker(
    ({ currentLocation, nextLocation, historyAction }) =>
      station?.prices?.length > 0 &&
      showBackModalStep === 0 &&
      currentLocation.pathname !== nextLocation.pathname &&
      historyAction === "POP"
  );

  useEffect(() => {
    if (blocker.state === "blocked" && showBackModalStep === 0) {
      if (hasConfirmedStation) {
        setShowBackModalStep(3);
      } else {
        setShowBackModalStep(1);
      }
    }
  }, [blocker.state]);

  if (isLoading) return <div className="app-shell min-h-screen"><PageHeaderSkeleton /></div>;
  if (!station) return <div className="app-shell min-h-screen flex items-center justify-center"><SearchX className="w-20 h-20 text-foreground/10" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="app-shell min-h-screen pb-40 text-foreground">
      <AuthPrompt isOpen={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} message={authPromptMessage} />
      
      {/* Dynamic Header */}
      <div className="relative pt-8 pb-16 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-teal-500/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-10">
            <button onClick={() => navigate(-1)} className="app-panel group rounded-full p-3 transition-all hover:bg-emerald-500 hover:text-white shadow-2xl">
              <ArrowLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
            <div className="flex items-center gap-3">
              <button onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: station.name, text: `Check prices at ${station.name}`, url: window.location.href });
                }
              }} className="app-panel rounded-full p-3 transition-all hover:border-emerald-500/30 shadow-2xl">
                <Share2 className="w-5 h-5 text-muted-foreground" />
              </button>
              <button onClick={handleToggleSave} className="app-panel rounded-full p-3 transition-all hover:border-emerald-500/30 shadow-2xl">
                <Heart className={`w-5 h-5 ${isSaved ? "fill-rose-500 text-rose-500" : "text-muted-foreground"}`} />
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex items-start gap-4">
              <div className="app-panel-strong flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-500/20 p-1 shadow-2xl">
                <StationLogo name={station.name} size="lg" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                   <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate max-w-full">{station.name}</h1>
                   {station.isVerified && <ShieldCheck className="w-5 h-5 text-emerald-400" />}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-emerald-500" /> {station.address}</div>
                  <div className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-teal-500" /> 
                    {isLocating && !userLocation ? "Locating..." : `${station.distance} km`}
                  </div>
                  <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-muted-foreground" /> {station.lastUpdated}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {canEditStation && (
                <button onClick={handleEditStation} className="app-panel flex items-center gap-2 rounded-2xl border border-emerald-500/10 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all hover:border-emerald-500/40">
                  <Pencil className="w-4 h-4" /> Edit Station
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-8 grid lg:grid-cols-[1fr_350px] gap-8">
        <div className="space-y-10">
          {/* Prices Grid */}
          <section>
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-xl font-black">Available Fuels</h2>
              <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/10">
                 <Zap className="w-3 h-3" /> Live Prices
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {station.prices.map((fuel, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="app-panel group relative overflow-hidden rounded-2xl border border-emerald-500/5 p-5 transition-all hover:border-emerald-500/20"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Zap className="w-16 h-16 text-emerald-500" /></div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">{fuel.type}</span>
                    {fuel.change !== undefined && (
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        fuel.trend === "down" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                      }`}>
                        {fuel.trend === "down" ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                        ₱{Math.abs(fuel.change).toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-emerald-500/80">₱</span>
                    <span className="text-2xl font-bold tracking-tight text-foreground">
                      {formatPrice(fuel.price).replace("₱", "")}
                    </span>
                    <span className="ml-1 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">/ Liter</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* History Chart */}
          <section className="app-panel rounded-3xl border border-emerald-500/5 p-6 shadow-2xl">
             <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black">Price Analytics</h2>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                   <TrendingUp className="w-3 h-3" /> 30-Day Outlook
                </div>
             </div>
             <StationPriceHistoryCard stationId={id} stationName={station.name} compact />
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="app-panel relative overflow-hidden rounded-3xl border border-emerald-500/10 p-6 shadow-2xl">
            <div className="absolute top-0 right-0 p-6 opacity-5"><ShieldCheck className="w-24 h-24" /></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                 </div>
                 <div className="rounded-full bg-emerald-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Verified Spot</div>
              </div>
              <div className="text-3xl font-bold mb-1 tracking-tight">{(station.trustScore || 100)}%</div>
              <p className="mb-6 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Trust Reliability Score</p>
              
              <div className="space-y-3">
                 <button onClick={() => navigate(`/app/update-price/${id}`)} className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Update Prices
                 </button>
                 <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`, "_blank")} className="app-panel-muted w-full rounded-2xl border border-emerald-500/10 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-emerald-500/5">
                    Get Directions
                 </button>
              </div>
            </div>
          </div>

          <button onClick={() => setShowReportIssueModal(true)} className="w-full p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-center justify-center gap-3 group hover:bg-rose-500/10 transition-all">
             <Flag className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
             <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Report Incorrect Info</span>
          </button>
        </aside>
      </div>

      {/* Floating Action Button (Mobile) */}
      <div className="lg:hidden fixed bottom-28 right-6 z-50">
        <button 
          onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`, "_blank")}
          className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all border border-white/20"
        >
          <Navigation className="w-6 h-6" />
        </button>
      </div>

      {/* Report Issue Modal */}
      <AnimatePresence>
        {showReportIssueModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReportIssueModal(false)} className="absolute inset-0 bg-[#050A09]/90 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="app-panel-strong relative w-full max-w-xl overflow-hidden rounded-[3rem] border border-emerald-500/10 shadow-2xl">
              <div className="p-10">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-3">
                       <Flag className="w-3 h-3" /> Report Issue
                    </div>
                    <h3 className="text-3xl font-black tracking-tight">Help improve accuracy</h3>
                  </div>
                  <button onClick={() => setShowReportIssueModal(false)} className="app-panel-muted rounded-full p-3 text-muted-foreground transition-colors hover:text-foreground">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-muted-foreground">Issue Type</label>
                    <select value={issueType} onChange={(e) => setIssueType(e.target.value)} className="app-input w-full rounded-2xl border border-emerald-500/10 p-5 text-sm font-bold focus:border-emerald-500 outline-none transition-all">
                      <option value="">Select Category</option>
                      {stationIssueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</label>
                    <textarea value={issueDetails} onChange={(e) => setIssueDetails(e.target.value)} rows={4} placeholder="Tell us what's wrong..." className="app-input w-full resize-none rounded-2xl border border-emerald-500/10 p-5 text-sm font-bold focus:border-emerald-500 outline-none transition-all" />
                  </div>
                  <button onClick={() => {
                    if (!issueType) return toast.error("Please select an issue type");
                    toast.success("Issue reported! Thank you.");
                    setShowReportIssueModal(false);
                  }} className="w-full py-5 bg-rose-500 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:scale-[1.01] transition-all">
                    Submit Report
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={showBackModalStep === 1}
        onClose={() => { setShowBackModalStep(0); if (blocker.state === "blocked") blocker.proceed(); else navigate(-1); }}
        onConfirm={handleFinalConfirm}
        title="Confirm Prices?"
        message="Quick check: are the prices displayed at the station still accurate? Confirming helps the community!"
        confirmText="They're Correct"
        cancelText="Skip for now"
        type="info"
      />

      <ConfirmationModal
        isOpen={showBackModalStep === 3}
        onClose={() => { setShowBackModalStep(0); if (blocker.state === "blocked") blocker.proceed(); else navigate(-1); }}
        onConfirm={() => { setShowBackModalStep(0); if (blocker.state === "blocked") blocker.proceed(); else navigate(-1); }}
        title="Prices Already Confirmed"
        message="You have already confirmed the prices at this station. Thank you for keeping the information accurate!"
        confirmText="Done"
        cancelText=""
        type="info"
      />
    </motion.div>
  );
}
