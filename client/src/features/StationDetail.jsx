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
    </motion.div>
  );
}
