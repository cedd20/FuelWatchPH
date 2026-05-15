import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingDown, CheckCircle, Clock, Zap, Star } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { AuthPrompt } from "@/shared/components/AuthPrompt";
import { useAuth } from "@/app/providers/AuthContext";
import { StationLogo } from "@/shared/components/StationLogo";
import { useMyContributions } from "@/hooks/usePrices";
import { KarmaService } from "@/lib/karmaService";

export function ContributionHistory() {
  const navigate = useNavigate();
  const { isAuthenticated, user, refreshProfile, loading } = useAuth();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: rawContributions = [], isLoading } = useMyContributions();

  useEffect(() => {
    if (isAuthenticated) refreshProfile();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!loading && !isAuthenticated) setShowAuthPrompt(true);
  }, [isAuthenticated, loading]);

  const localContributions = KarmaService.getContributions();

  const contributions = [
    ...localContributions.map(c => ({
      id: c.id,
      type: c.type,
      stationName: c.stationName,
      fuelType: c.fuelType,
      price: c.price,
      date: new Date(c.date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }),
      status: c.status,
      karmaImpact: c.karmaImpact,
    })),
    ...rawContributions.map(c => ({
      id: c.id,
      type: c.type || "Updated Fuel Price",
      stationName: c.stationName || "Unknown Station",
      fuelType: c.fuel_type,
      price: c.price != null ? parseFloat(c.price) : null,
      date: new Date(c.observed_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }),
      status: c.status || "pending",
      karmaImpact: 10,
    })),
  ];

  const filteredContributions = contributions.filter(c => {
    if (statusFilter === "all") return true;
    if (statusFilter === "verified") return c.status === "confirmed" || c.status === "approved";
    return c.status === statusFilter;
  });

  const verifiedCount = contributions.filter(c =>
    c.status === "confirmed" || c.status === "approved" || c.status === "verified"
  ).length;
  const pendingCount = contributions.filter(c => c.status === "pending").length;
  const trustScore = user?.trustScore || 0;
  const totalKarma = user?.karma || 0;

  const filters = [
    { key: "all", label: "All", color: "bg-emerald-500" },
    { key: "verified", label: "Verified", color: "bg-emerald-500" },
    { key: "pending", label: "Pending", color: "bg-amber-500" },
  ];

  return (
    <>
      <AuthPrompt
        isOpen={showAuthPrompt}
        onClose={() => { setShowAuthPrompt(false); navigate("/app/map"); }}
        message="Sign in to view your contribution history and track your updates."
      />

      <div className="min-h-screen bg-[#050A09] text-white pb-28">
        {/* Header */}
        <div className="relative pt-14 pb-28 px-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/3" />
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="flex items-center gap-6 mb-12">
              <button
                onClick={() => navigate(-1)}
                className="p-3 bg-[#0C1A17] rounded-full border border-emerald-500/10 hover:bg-emerald-500 transition-all shadow-2xl group"
              >
                <ArrowLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </button>
              <div>
                <h1 className="text-4xl lg:text-5xl font-black tracking-tight">My Reports</h1>
                <p className="text-gray-600 font-bold text-xs uppercase tracking-widest mt-1">{contributions.length} total contributions</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total", value: contributions.length, color: "text-emerald-400" },
                { label: "Verified", value: verifiedCount, color: "text-emerald-400" },
                { label: "Pending", value: pendingCount, color: "text-amber-400" },
                { label: "Karma", value: totalKarma, color: "text-amber-400" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-[#0C1A17] rounded-3xl p-6 border border-emerald-500/5 shadow-2xl"
                >
                  <div className={`text-3xl font-black mb-1 ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 -mt-14 space-y-6">
          {/* Trust Impact Banner */}
          <div className="bg-emerald-500/10 rounded-[2.5rem] p-6 border border-emerald-500/20 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0">
              <Star className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="font-black text-sm text-emerald-400 mb-0.5">Your Impact This Month</div>
              <p className="text-xs font-bold text-gray-500">
                Helping {Math.max(1, contributions.length * 15)}+ drivers save on fuel. Trust Score: {trustScore}%
              </p>
            </div>
            <div className="text-2xl font-black text-emerald-400">{totalKarma}<span className="text-xs text-gray-600 ml-1">pts</span></div>
          </div>

          {/* Filter Bar */}
          <div className="bg-[#0C1A17] p-2 rounded-[2.5rem] flex gap-2 border border-emerald-500/10 shadow-2xl">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`flex-1 py-3.5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all ${
                  statusFilter === f.key
                    ? `${f.color} text-white shadow-lg`
                    : "text-gray-600 hover:text-gray-400"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Contribution List */}
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-[#0C1A17] rounded-[2.5rem] animate-pulse border border-emerald-500/5" />
            ))
          ) : filteredContributions.length > 0 ? (
            <div className="space-y-4">
              {filteredContributions.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-[#0C1A17] rounded-[2.5rem] border border-emerald-500/5 hover:border-emerald-500/20 transition-all shadow-2xl overflow-hidden"
                >
                  <div className="p-6 flex items-center gap-5">
                    <StationLogo name={c.stationName} size="md" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-black text-sm truncate">{c.stationName}</h3>
                        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
                          c.karmaImpact > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                        }`}>
                          {c.karmaImpact > 0 ? `+${c.karmaImpact}` : c.karmaImpact} Karma
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.date}</span>
                        {c.fuelType && <span className="text-gray-700">·</span>}
                        {c.fuelType && <span>{c.fuelType}</span>}
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1.5">
                      {c.price !== null ? (
                        <div className="text-xl font-black">₱{c.price.toFixed(2)}</div>
                      ) : (
                        <div className="text-xs font-black text-gray-600 uppercase">N/A</div>
                      )}
                      <div className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                        c.status === "confirmed" || c.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {c.status === "confirmed" || c.status === "approved"
                          ? <><CheckCircle className="w-3 h-3" /> Verified</>
                          : <><Clock className="w-3 h-3" /> Pending</>
                        }
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="pt-6">
              <EmptyState
                icon={TrendingDown}
                title={`No ${statusFilter === "all" ? "" : statusFilter} contributions`}
                description={
                  statusFilter === "all"
                    ? "Start updating fuel prices to help the community"
                    : `You don't have any ${statusFilter} contributions yet`
                }
                action={statusFilter === "all" ? { label: "Find Stations", onClick: () => navigate("/app") } : undefined}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
