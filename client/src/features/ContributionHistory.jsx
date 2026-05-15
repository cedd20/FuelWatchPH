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
  const hasTrustedContributorBadge = totalKarma > 200;

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
<<<<<<< HEAD
=======

      {/* Desktop Layout */}
      <div className="hidden lg:block min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-950 pb-10">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-12 pb-8 px-8 relative overflow-hidden">
          {/* Enhanced radial glow background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl" />

          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <button
                onClick={() => navigate(-1)}
                className="w-12 h-12 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl shadow-black/20 hover:scale-110 transition-transform border-2 border-white/40"
              >
                <ArrowLeft className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              </button>
              <h1 className="text-4xl font-bold text-white drop-shadow-2xl tracking-tight">My Contributions</h1>
            </div>

            {/* Stats - Desktop 4 Column */}
            <div className="grid grid-cols-4 gap-5">
              <div className="bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-2xl p-6 shadow-2xl shadow-black/20 border-2 border-gray-200 dark:border-neutral-700">
                <div className="text-4xl font-bold bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent mb-2 tracking-tight">{contributions.length}</div>
                <div className="text-base text-muted-foreground font-semibold">Total Contributions</div>
              </div>
              <div className="bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-2xl p-6 shadow-2xl shadow-black/20 border-2 border-gray-200 dark:border-neutral-700">
                <div className="text-4xl font-bold bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2 tracking-tight">{trustScore}%</div>
                <div className="text-base text-muted-foreground font-semibold">Trust Score</div>
              </div>
              <div className="bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-2xl p-6 shadow-2xl shadow-black/20 border-2 border-gray-200 dark:border-neutral-700">
                <div className="text-4xl font-bold bg-gradient-to-br from-yellow-500 to-orange-500 bg-clip-text text-transparent mb-2 tracking-tight">{totalKarma}</div>
                <div className="text-base text-muted-foreground font-semibold">Community Karma</div>
              </div>
              <div className="bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-2xl p-6 shadow-2xl shadow-black/20 border-2 border-gray-200 dark:border-neutral-700">
                <div className="text-4xl font-bold bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2 tracking-tight">{verifiedCount}</div>
                <div className="text-base text-muted-foreground font-semibold">Verified Actions</div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop 2-Column Layout */}
        <div className="px-8 py-10">
          <div className="max-w-7xl mx-auto grid grid-cols-3 gap-8">
            {/* Left Column - Main Content - Takes 2/3 */}
            <div className="col-span-2">
              {/* Filter Bar */}
              <div className="mb-6 flex items-center gap-3">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    statusFilter === "all"
                      ? "bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white shadow-lg shadow-emerald-500/40"
                      : "bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 text-foreground hover:border-emerald-400/50"
                  }`}
                >
                  All Updates
                </button>
                <button
                  onClick={() => setStatusFilter("verified")}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    statusFilter === "verified"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/40"
                      : "bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 text-foreground hover:border-emerald-400/50"
                  }`}
                >
                  Verified
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    statusFilter === "pending"
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/40"
                      : "bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 text-foreground hover:border-emerald-400/50"
                  }`}
                >
                  Pending
                </button>
              </div>

              {/* Contribution List */}
              <h3 className="text-2xl font-bold text-foreground mb-5 tracking-tight">Contribution History</h3>
              {filteredContributions.length > 0 ? (
                <div className="space-y-4">
                  {filteredContributions.map((contribution) => (
                    <div
                      key={contribution.id}
                      className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl border-2 border-gray-200 dark:border-neutral-700 p-7 shadow-2xl shadow-black/10 hover:shadow-2xl hover:border-emerald-400/50 hover:scale-[1.01] transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-4 lg:gap-5 mb-4">
                            <StationLogo name={contribution.stationName} size="md" />
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-bold text-foreground text-lg">
                                  {contribution.stationName}
                                </h4>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border-2 ${
                                  contribution.karmaImpact > 0 
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                                    : "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800"
                                }`}>
                                  {contribution.karmaImpact > 0 ? `+${contribution.karmaImpact}` : contribution.karmaImpact} Karma
                                </span>
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md border-2 bg-gray-50 text-gray-600 border-gray-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">
                                  {contribution.type}
                                </span>
                              </div>
                              <div className="text-base text-muted-foreground/80 font-medium">
                                {contribution.fuelType}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold text-foreground tracking-tighter mb-1">
                                {contribution.price !== null ? `₱${contribution.price.toFixed(2)}` : "N/A"}
                              </div>
                              <div className="text-sm text-muted-foreground/70 font-semibold">
                                {contribution.price !== null ? "per liter" : "station added"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground/80">
                              <Clock className="w-5 h-5" strokeWidth={2.5} />
                              <span className="font-semibold text-base">{contribution.date}</span>
                            </div>
                            {contribution.status === "approved" ? (
                              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-full shadow-lg shadow-emerald-500/30">
                                <CheckCircle className="w-5 h-5" strokeWidth={2.5} />
                                <span className="font-bold text-sm">Approved</span>
                              </div>
                            ) : contribution.status === "confirmed" ? (
                              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-400 to-emerald-600 text-white rounded-full shadow-lg shadow-emerald-400/30">
                                <CheckCircle className="w-5 h-5" strokeWidth={2.5} />
                                <span className="font-bold text-sm">Confirmed</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full shadow-lg shadow-yellow-500/30">
                                <Clock className="w-5 h-5" strokeWidth={2.5} />
                                <span className="font-bold text-sm">Pending Review</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={TrendingDown}
                  title={`No ${statusFilter === "all" ? "" : statusFilter} contributions`}
                  description={statusFilter === "all" ? "Start updating fuel prices to help the community" : `You don't have any ${statusFilter} contributions yet`}
                  action={statusFilter === "all" ? {
                    label: "Find Stations",
                    onClick: () => navigate("/app"),
                  } : undefined}
                />
              )}
            </div>

            {/* Right Column - Sidebar - Takes 1/3 */}
            <div className="col-span-1">
              <div className="sticky top-6 space-y-6">
                {/* Status Summary Card */}
                <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-2xl shadow-black/10">
                  <h3 className="text-xl font-bold text-foreground mb-5 tracking-tight">Status Summary</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full" />
                        <span className="font-semibold text-foreground">Verified</span>
                      </div>
                      <span className="font-bold text-lg text-foreground">{verifiedCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full" />
                        <span className="font-semibold text-foreground">Pending</span>
                      </div>
                      <span className="font-bold text-lg text-foreground">{pendingCount}</span>
                    </div>
                    <div className="pt-4 border-t-2 border-gray-200 dark:border-neutral-700">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">Total</span>
                        <span className="font-bold text-xl bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent">{contributions.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Card */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/30 dark:to-teal-950/30 backdrop-blur-2xl rounded-2xl p-6 border-2 border-emerald-400/30 dark:border-emerald-500/30 shadow-2xl shadow-emerald-500/10">
                  <h3 className="text-xl font-bold text-foreground mb-4 tracking-tight">Your Impact</h3>
                  <p className="text-sm text-muted-foreground/90 leading-relaxed mb-5">
                    Your contributions help {contributions.length * 15}+ drivers save money on fuel every week.
                  </p>
                  <div className="bg-white/50 dark:bg-neutral-800/50 rounded-xl p-4 backdrop-blur-sm">
                    {hasTrustedContributorBadge ? (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                          <span className="font-bold text-sm text-foreground">Trusted Contributor</span>
                        </div>
                        <p className="text-xs text-muted-foreground/80">
                          {trustScore}% trust score • Keep up the great work!
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground/80">
                        Earn more karma to unlock the Trusted Contributor badge.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
>>>>>>> ac377a1f9bae0a8d5c8145126303cd533e839c49
    </>
  );
}
