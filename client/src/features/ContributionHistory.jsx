import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, TrendingDown, CheckCircle, Clock, Loader2 } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { AuthPrompt } from "@/shared/components/AuthPrompt";
import { useAuth } from "@/app/providers/AuthContext";
import { StationLogo } from "@/shared/components/StationLogo";
import { useMyContributions } from "@/hooks/usePrices";
import { PageHeaderSkeleton, ContributionItemSkeleton, Skeleton } from "@/shared/components/Skeleton";
import { KarmaService } from "@/lib/karmaService";

const MOCK_CONTRIBUTIONS = [
  {
    id: "1",
    stationName: "Petron Quezon Avenue",
    fuelType: "Diesel",
    price: 55.30,
    date: "Today, 2:30 PM",
    status: "verified",
  },
  {
    id: "2",
    stationName: "Shell EDSA",
    fuelType: "Gasoline 95",
    price: 69.00,
    date: "Yesterday, 5:15 PM",
    status: "verified",
  },
  {
    id: "3",
    stationName: "Caltex Commonwealth",
    fuelType: "Gasoline 91",
    price: 62.80,
    date: "Apr 13, 10:45 AM",
    status: "pending",
  },
];

export function ContributionHistory() {
  const navigate = useNavigate();
  const { isAuthenticated, user, refreshProfile, loading } = useAuth();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: rawContributions = [], isLoading } = useMyContributions();

  useEffect(() => {
    if (isAuthenticated) {
      refreshProfile();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setShowAuthPrompt(true);
    }
  }, [isAuthenticated, loading]);

  const localContributions = KarmaService.getContributions();
  
  // Combine server and local contributions for testing
  const contributions = [
    ...localContributions.map(c => ({
      id: c.id,
      type: c.type,
      stationName: c.stationName,
      fuelType: c.fuelType,
      price: c.price,
      date: new Date(c.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
      status: c.status,
      karmaImpact: c.karmaImpact
    })),
    ...rawContributions.map(c => ({
      id: c.id,
      type: c.type || "Updated Fuel Price",
      stationName: c.stationName || "Unknown Station",
      fuelType: c.fuel_type,
      price: c.price != null ? parseFloat(c.price) : null,
      date: new Date(c.observed_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
      status: c.status || "pending",
      karmaImpact: 10 // Mock for server ones
    }))
  ];

  const filteredContributions = contributions.filter((contribution) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "verified") {
      return contribution.status === "confirmed" || contribution.status === "approved";
    }
    return contribution.status === statusFilter;
  });

  const verifiedCount = contributions.filter((c) => c.status === "confirmed" || c.status === "approved" || c.status === "verified").length;
  const pendingCount = contributions.filter((c) => c.status === "pending").length;
  const trustScore = user?.trustScore || 0;
  const totalKarma = user?.karma || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 pb-12">
        <PageHeaderSkeleton />
        <div className="max-w-6xl mx-auto px-4 lg:px-8 space-y-8 -mt-10 relative z-20">
          {/* Stats Dashboard Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border-2 border-gray-100 dark:border-neutral-800 shadow-xl space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-24" />
              </div>
            ))}
          </div>

          {/* List Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-8 w-48 mb-6" />
            {Array.from({ length: 5 }).map((_, i) => (
              <ContributionItemSkeleton key={i} />
            ))}
          </div>
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
          navigate("/app/map");
        }}
        message="Sign in to view your contribution history and track your updates."
      />

      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-950 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-12 pb-12 px-4 relative overflow-hidden">
          {/* Enhanced radial glow background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="w-10 h-10 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg border border-white/30 active:scale-90 transition-transform"
                >
                  <ArrowLeft className="w-5 h-5 text-white" strokeWidth={3} />
                </button>
                <h1 className="text-2xl font-black text-white drop-shadow-2xl tracking-tight">Contributions</h1>
              </div>
              <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/30 shadow-lg">
                <span className="text-white text-xs font-black uppercase tracking-widest">{contributions.length} Total</span>
              </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-5 border border-white/20 shadow-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Karma</span>
                </div>
                <div className="text-3xl font-black text-white tracking-tighter">{totalKarma}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-5 border border-white/20 shadow-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Trust</span>
                </div>
                <div className="text-3xl font-black text-white tracking-tighter">{trustScore}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Filter Bar */}
        <div className="px-4 -mt-6 relative z-30">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-2 shadow-xl shadow-black/10 flex items-center gap-2 overflow-x-auto no-scrollbar border border-gray-100 dark:border-neutral-800">
            <button
              onClick={() => setStatusFilter("all")}
              className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                statusFilter === "all"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                  : "text-muted-foreground hover:bg-gray-50 dark:hover:bg-neutral-800"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("verified")}
              className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                statusFilter === "verified"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                  : "text-muted-foreground hover:bg-gray-50 dark:hover:bg-neutral-800"
              }`}
            >
              Verified
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                statusFilter === "pending"
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                  : "text-muted-foreground hover:bg-gray-50 dark:hover:bg-neutral-800"
              }`}
            >
              Pending
            </button>
          </div>
        </div>

        {/* Contribution List */}
        <div className="px-4 py-6">
          {filteredContributions.length > 0 ? (
            <div className="space-y-4">
              {filteredContributions.map((contribution) => (
                <div
                  key={contribution.id}
                  className={`bg-white dark:bg-neutral-900 rounded-3xl border-2 shadow-xl shadow-black/5 overflow-hidden transition-all active:scale-[0.98] ${
                    contribution.karmaImpact > 0 
                      ? "border-emerald-100 dark:border-emerald-900/30" 
                      : "border-rose-100 dark:border-rose-900/30"
                  }`}
                >
                  {/* Card Impact Header Ribbon (Optional, but let's go with a side accent instead) */}
                  <div className="flex flex-col">
                    {/* Main Content Area */}
                    <div className="p-5">
                      <div className="flex items-start gap-4 mb-4">
                        <StationLogo name={contribution.stationName} size="md" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground text-base truncate leading-tight mb-1">
                            {contribution.stationName}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 font-semibold">
                            <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
                            <span>{contribution.date}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                            contribution.karmaImpact > 0 
                              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                              : "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                          }`}>
                            {contribution.karmaImpact > 0 ? `+${contribution.karmaImpact}` : contribution.karmaImpact} Karma
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-[1fr_auto] items-end gap-4 bg-gray-50/50 dark:bg-neutral-800/50 rounded-2xl p-4 border border-gray-100 dark:border-neutral-700/50">
                        <div>
                          <div className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest mb-1">
                            {contribution.type}
                          </div>
                          <div className="text-sm font-bold text-foreground/90 truncate max-w-[150px]">
                            {contribution.fuelType || "System Update"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-foreground tracking-tighter">
                            {contribution.price !== null ? `₱${contribution.price.toFixed(2)}` : "N/A"}
                          </div>
                          <div className="text-[10px] font-black text-muted-foreground/60 uppercase">per liter</div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Status Bar */}
                    <div className={`px-5 py-3 flex items-center justify-between border-t border-dashed ${
                      contribution.karmaImpact > 0 
                        ? "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30" 
                        : "bg-rose-50/30 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30"
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${
                           contribution.status === "pending" ? "bg-yellow-500" : "bg-emerald-500"
                        }`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</span>
                      </div>
                      
                      {contribution.status === "approved" ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="w-4 h-4" strokeWidth={2.5} />
                          <span className="font-black text-[10px] uppercase tracking-wider">Approved</span>
                        </div>
                      ) : contribution.status === "confirmed" ? (
                        <div className="flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400">
                          <CheckCircle className="w-4 h-4" strokeWidth={2.5} />
                          <span className="font-black text-[10px] uppercase tracking-wider">Confirmed</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
                          <Clock className="w-4 h-4" strokeWidth={2.5} />
                          <span className="font-black text-[10px] uppercase tracking-wider">Pending</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={TrendingDown}
              title="No contributions yet"
              description="Start updating fuel prices to help the community"
              action={{
                label: "Find Stations",
                onClick: () => navigate("/app"),
              }}
            />
          )}
        </div>
      </div>

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
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                      <span className="font-bold text-sm text-foreground">Trusted Contributor</span>
                    </div>
                    <p className="text-xs text-muted-foreground/80">
                      {trustScore}% trust score • Keep up the great work!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
