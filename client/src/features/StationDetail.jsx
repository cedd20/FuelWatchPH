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

  const handleFinalConfirm = () => {
    const confirmationData = { stationId: id, isAnonymous: !isAuthenticated, confirmedAt: new Date().toISOString() };
    localStorage.setItem(`station_confirmed_${id}`, JSON.stringify(confirmationData));
    setHasConfirmedStation(true);
    
    if (isAuthenticated) {
      KarmaService.addContribution('Confirmed Price', { stationName: station?.name });
      toast.success("Price confirmed! Karma points added.");
    } else {
      toast.success("Price confirmed anonymously. Sign in to earn Karma!");
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

  if (isLoading) return <div className="min-h-screen bg-[#050A09]"><PageHeaderSkeleton /></div>;
  if (!station) return <div className="min-h-screen bg-[#050A09] flex items-center justify-center"><SearchX className="w-20 h-20 text-white/10" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#050A09] text-white pb-40">
      <AuthPrompt isOpen={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} message={authPromptMessage} />
      
      {/* Dynamic Header */}
      <div className="relative pt-12 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-10">
            <button onClick={() => navigate(-1)} className="p-3 bg-[#0C1A17] rounded-full border border-emerald-500/10 hover:bg-emerald-500 transition-all shadow-2xl group">
              <ArrowLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
            <div className="flex items-center gap-3">
              <button onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: station.name, text: `Check prices at ${station.name}`, url: window.location.href });
                }
              }} className="p-3 bg-[#0C1A17] rounded-full border border-emerald-500/10 hover:border-emerald-500/30 transition-all shadow-2xl">
                <Share2 className="w-5 h-5 text-gray-400" />
              </button>
              <button onClick={handleToggleSave} className="p-3 bg-[#0C1A17] rounded-full border border-emerald-500/10 hover:border-emerald-500/30 transition-all shadow-2xl">
                <Heart className={`w-5 h-5 ${isSaved ? "fill-rose-500 text-rose-500" : "text-gray-400"}`} />
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-[2rem] bg-[#0C1A17] border border-emerald-500/20 p-1 shadow-2xl flex items-center justify-center overflow-hidden shrink-0">
                <StationLogo name={station.name} size="lg" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                   <h1 className="text-4xl md:text-5xl font-black tracking-tight truncate max-w-full">{station.name}</h1>
                   {station.isVerified && <ShieldCheck className="w-8 h-8 text-emerald-400" />}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-gray-500 font-bold text-sm uppercase tracking-widest">
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-500" /> {station.address}</div>
                  <div className="flex items-center gap-2"><Navigation className="w-4 h-4 text-teal-500" /> {station.distance} km</div>
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-600" /> {station.lastUpdated}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {canEditStation && (
                <button onClick={handleEditStation} className="flex items-center gap-2 px-6 py-3 bg-[#0C1A17] rounded-2xl border border-emerald-500/10 font-black text-xs uppercase tracking-widest hover:border-emerald-500/40 transition-all">
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
                  className="bg-[#0C1A17] rounded-[2.5rem] p-8 border border-emerald-500/5 hover:border-emerald-500/20 transition-all shadow-2xl relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Zap className="w-16 h-16 text-emerald-500" /></div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-sm font-black text-gray-500 uppercase tracking-[0.2em]">{fuel.type}</span>
                    {fuel.change !== undefined && (
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        fuel.trend === "down" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                      }`}>
                        {fuel.trend === "down" ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                        ₱{Math.abs(fuel.change).toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black text-white tracking-tighter">₱{formatPrice(fuel.price)}</span>
                    <span className="text-xs font-bold text-gray-600 mb-2 uppercase">/ Liter</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* History Chart */}
          <section className="bg-[#0C1A17] rounded-[2.5rem] p-8 border border-emerald-500/5 shadow-2xl">
             <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black">Price Analytics</h2>
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                   <TrendingUp className="w-3 h-3" /> 30-Day Outlook
                </div>
             </div>
             <StationPriceHistoryCard stationId={id} stationName={station.name} compact />
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="bg-[#0C1A17] rounded-[3rem] p-8 border border-emerald-500/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5"><ShieldCheck className="w-24 h-24" /></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                 </div>
                 <div className="px-4 py-1.5 bg-emerald-500/10 rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-widest">Verified Spot</div>
              </div>
              <div className="text-4xl font-black mb-2 tracking-tight">{(station.trustScore || 100)}%</div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.15em] mb-8">Trust Reliability Score</p>
              
              <div className="space-y-3">
                 <button onClick={() => navigate(`/app/update-price/${id}`)} className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Update Prices
                 </button>
                 <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`, "_blank")} className="w-full py-5 bg-[#050A09] border border-emerald-500/10 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-500/5 transition-all">
                    Get Directions
                 </button>
              </div>
            </div>
          </div>

          <button onClick={() => setShowReportIssueModal(true)} className="w-full p-6 bg-rose-500/5 border border-rose-500/10 rounded-[2rem] flex items-center justify-center gap-3 group hover:bg-rose-500/10 transition-all">
             <Flag className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
             <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Report Incorrect Info</span>
          </button>
        </aside>
      </div>

      {/* Mobile Action Bar */}
      <div className="lg:hidden fixed inset-x-0 bottom-24 z-50 px-6">
         <div className="bg-[#0C1A17]/90 backdrop-blur-3xl border border-emerald-500/20 rounded-[2.5rem] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex gap-2">
            <button onClick={() => navigate(`/app/update-price/${id}`)} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20">
               Update Price
            </button>
            <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`, "_blank")} className="p-4 bg-[#050A09] text-white rounded-2xl border border-emerald-500/10">
               <Navigation className="w-5 h-5" />
            </button>
         </div>
      </div>

      {/* Report Issue Modal */}
      <AnimatePresence>
        {showReportIssueModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReportIssueModal(false)} className="absolute inset-0 bg-[#050A09]/90 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-xl bg-[#0C1A17] rounded-[3rem] border border-emerald-500/10 overflow-hidden shadow-2xl">
              <div className="p-10">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-3">
                       <Flag className="w-3 h-3" /> Report Issue
                    </div>
                    <h3 className="text-3xl font-black tracking-tight">Help improve accuracy</h3>
                  </div>
                  <button onClick={() => setShowReportIssueModal(false)} className="p-3 bg-[#050A09] rounded-full text-gray-500 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Issue Type</label>
                    <select value={issueType} onChange={(e) => setIssueType(e.target.value)} className="w-full bg-[#050A09] border border-emerald-500/10 rounded-2xl p-5 text-sm font-bold focus:border-emerald-500 outline-none transition-all">
                      <option value="">Select Category</option>
                      {stationIssueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Description</label>
                    <textarea value={issueDetails} onChange={(e) => setIssueDetails(e.target.value)} rows={4} placeholder="Tell us what's wrong..." className="w-full bg-[#050A09] border border-emerald-500/10 rounded-2xl p-5 text-sm font-bold focus:border-emerald-500 outline-none transition-all resize-none" />
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
        onConfirm={() => setShowBackModalStep(2)}
        title="Confirm Prices?"
        message="Quick check: are the prices displayed at the station still accurate? Confirming helps the community!"
        confirmText="They're Correct"
        cancelText="Skip for now"
        type="info"
      />
<<<<<<< HEAD
    </motion.div>
=======
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
>>>>>>> ac377a1f9bae0a8d5c8145126303cd533e839c49
  );
}
