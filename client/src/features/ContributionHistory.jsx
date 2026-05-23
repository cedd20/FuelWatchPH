import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingDown, CheckCircle, Clock, Zap, Star, Search, Filter, SortDesc, SortAsc, LayoutList, ChevronDown, Check } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { AuthPrompt } from "@/shared/components/AuthPrompt";
import { useAuth } from "@/app/providers/AuthContext";
import { StationLogo } from "@/shared/components/StationLogo";
import { useMyContributions } from "@/hooks/usePrices";
import { KarmaService } from "@/lib/karmaService";

const getRelativeTimeGroup = (date) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffTime = today.getTime() - targetDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return "Today";
  if (diffDays > 0 && diffDays <= 7) return "This Week";
  if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) return "Earlier This Month";
  return "Older Reports";
};

function CustomSelect({ icon: Icon, value, options, onChange, prefix }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative flex-1" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="app-panel flex w-full items-center justify-between rounded-full border border-emerald-500/10 px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 shadow-md outline-none transition-all hover:bg-emerald-500/8 focus:border-emerald-500/50 dark:text-emerald-300 sm:text-xs"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          <span>{prefix}: {selectedOption?.label}</span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="app-panel-strong absolute left-0 top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-2xl border border-emerald-500/10 shadow-2xl"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`flex w-full items-center justify-between px-4 py-3.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all ${
                value === opt.value
                  ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300"
                  : "text-muted-foreground hover:bg-emerald-500/10 hover:text-foreground"
              }`}
            >
              {opt.label}
              {value === opt.value && <Check className="h-4 w-4 text-emerald-500" />}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export function ContributionHistory() {
  const navigate = useNavigate();
  const { isAuthenticated, user, refreshProfile, loading } = useAuth();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [groupBy, setGroupBy] = useState("time");
  const [visibleCount, setVisibleCount] = useState(15);
  const { data: rawContributions = [], isLoading } = useMyContributions();

  useEffect(() => {
    if (isAuthenticated) refreshProfile();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!loading && !isAuthenticated) setShowAuthPrompt(true);
  }, [isAuthenticated, loading]);

  const contributions = useMemo(() => {
    const localContributions = KarmaService.getContributions();
    
    return [
      ...localContributions.map((c) => {
        const rawDate = new Date(c.date);
        return {
          id: c.id,
          type: c.type || "Update",
          stationName: c.stationName,
          fuelType: c.fuelType,
          price: c.price,
          rawDate,
          timeStr: rawDate.toLocaleTimeString([], { timeStyle: "short" }),
          status: c.status,
          karmaImpact: c.karmaImpact,
        };
      }),
      ...rawContributions.map((c) => {
        const rawDate = new Date(c.observed_at);
        return {
          id: c.id,
          type: c.type || "Updated Fuel Price",
          stationName: c.stationName || "Unknown Station",
          fuelType: c.fuel_type,
          price: c.price != null ? parseFloat(c.price) : null,
          rawDate,
          timeStr: rawDate.toLocaleTimeString([], { timeStyle: "short" }),
          status: c.status || "pending",
          karmaImpact: 10,
        };
      }),
    ];
  }, [rawContributions]);

  const filteredContributions = useMemo(() => {
    let result = contributions.filter((c) => {
      // Status Filter
      if (statusFilter === "verified" && !["confirmed", "approved", "verified"].includes(c.status)) return false;
      if (statusFilter === "pending" && c.status !== "pending") return false;
      
      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesStation = c.stationName?.toLowerCase().includes(q);
        const matchesFuel = c.fuelType?.toLowerCase().includes(q);
        const matchesType = c.type?.toLowerCase().includes(q);
        if (!matchesStation && !matchesFuel && !matchesType) return false;
      }
      
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "newest") return b.rawDate - a.rawDate;
      if (sortBy === "oldest") return a.rawDate - b.rawDate;
      return 0;
    });

    return result;
  }, [contributions, statusFilter, searchQuery, sortBy]);

  const groupedContributions = useMemo(() => {
    const paginated = filteredContributions.slice(0, visibleCount);
    return paginated.reduce((groups, c) => {
      let groupKey = "Other";
      
      if (groupBy === "time") {
        groupKey = getRelativeTimeGroup(c.rawDate);
      } else if (groupBy === "status") {
        if (["confirmed", "approved", "verified"].includes(c.status)) groupKey = "Verified Reports";
        else if (c.status === "rejected") groupKey = "Rejected Reports";
        else groupKey = "Pending Reports";
      } else if (groupBy === "type") {
        groupKey = c.type || "Other Reports";
      }

      const group = groups[groupKey] || [];
      group.push(c);
      groups[groupKey] = group;
      return groups;
    }, {});
  }, [filteredContributions, visibleCount, groupBy]);

  const verifiedCount = contributions.filter(
    (c) => c.status === "confirmed" || c.status === "approved" || c.status === "verified",
  ).length;
  const pendingCount = contributions.filter((c) => c.status === "pending").length;
  const trustScore = user?.trustScore || 0;
  const totalKarma = user?.karma || 0;

  const filters = [
    { key: "all", label: "All" },
    { key: "verified", label: "Verified" },
    { key: "pending", label: "Pending" },
  ];

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

        <div className="app-shell min-h-screen pb-28 text-foreground">
        <div className="relative overflow-hidden px-6 pb-28 pt-14">
          <div className="absolute top-0 right-0 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-[140px]" />
          <div className="relative z-10 mx-auto max-w-4xl">
            <div className="mb-12 flex items-center gap-6">
              <button
                onClick={() => navigate(-1)}
                className="app-panel group rounded-full border p-3 shadow-2xl transition-all hover:bg-emerald-500 hover:text-white"
              >
                <ArrowLeft className="h-6 w-6 transition-transform group-hover:scale-110" />
              </button>
              <div>
                <h1 className="text-4xl font-black tracking-tight lg:text-5xl">My Reports</h1>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {contributions.length} total contributions
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
                  className="app-panel rounded-3xl border p-6 shadow-2xl"
                >
                  <div className={`mb-1 text-3xl font-black ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="-mt-14 mx-auto max-w-4xl space-y-8 px-6">
          <div className="app-panel flex items-center gap-4 rounded-[2.5rem] border p-6 shadow-2xl">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10">
              <Star className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="mb-0.5 text-sm font-black text-emerald-400">Your Impact This Month</div>
              <p className="text-xs font-bold text-muted-foreground">
                Helping {Math.max(1, contributions.length * 15)}+ drivers save on fuel. Trust Score: {trustScore}%
              </p>
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {totalKarma}
              <span className="ml-1 text-xs text-muted-foreground">pts</span>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by station, fuel, or report type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="app-panel w-full rounded-[2rem] border border-emerald-500/10 py-4 pl-12 pr-4 text-sm font-bold text-foreground shadow-2xl outline-none transition-all placeholder:text-muted-foreground focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>

            {/* Sort & Group Options */}
            <div className="flex gap-3">
              <CustomSelect
                icon={LayoutList}
                value={groupBy}
                onChange={setGroupBy}
                prefix="Group"
                options={[
                  { value: "time", label: "Time" },
                  { value: "status", label: "Status" },
                  { value: "type", label: "Type" },
                ]}
              />

              <CustomSelect
                icon={sortBy === "newest" ? SortDesc : SortAsc}
                value={sortBy}
                onChange={setSortBy}
                prefix="Sort"
                options={[
                  { value: "newest", label: "Newest" },
                  { value: "oldest", label: "Oldest" },
                ]}
              />
            </div>

            {/* Status Filters */}
            <div className="app-panel flex gap-1 rounded-full border border-emerald-500/10 p-1.5 shadow-2xl">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`flex-1 rounded-full py-3.5 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${
                    statusFilter === f.key
                      ? "bg-emerald-500/14 text-emerald-600 shadow-lg dark:text-emerald-300"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="app-panel h-28 animate-pulse rounded-[2.5rem] border border-emerald-500/10" />
            ))
          ) : filteredContributions.length > 0 ? (
            <div className="space-y-10 pt-2">
              {Object.entries(groupedContributions).map(([groupKey, items], groupIndex) => (
                <div key={groupKey} className="space-y-4">
                  <h3 className="sticky top-0 z-10 py-3 text-xs font-black uppercase tracking-widest text-emerald-500/80 backdrop-blur-md">
                    {groupKey}
                  </h3>
                  <div className="space-y-3">
                    {items.map((c, i) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (groupIndex * 0.1) + (i * 0.05) }}
                        className="app-panel overflow-hidden rounded-[1.5rem] border border-emerald-500/10 shadow-2xl transition-all hover:border-emerald-500/30"
                      >
                        <div className="flex items-center gap-4 p-5">
                          <StationLogo name={c.stationName} size="md" />

                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-sm font-black">{c.stationName}</h3>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                                  c.karmaImpact > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                                }`}
                              >
                                {c.karmaImpact > 0 ? `+${c.karmaImpact}` : c.karmaImpact} Karma
                              </span>
                            </div>
                            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {c.rawDate.toLocaleDateString([], { dateStyle: "short" })} {c.timeStr}
                              </span>
                              {c.fuelType && <span className="text-muted-foreground/60">·</span>}
                              {c.fuelType && <span>{c.fuelType}</span>}
                              {c.type && <span className="text-muted-foreground/60">·</span>}
                              {c.type && <span className="text-emerald-500">{c.type}</span>}
                            </div>
                          </div>

                          <div className="shrink-0 space-y-1.5 text-right">
                            {c.price !== null ? (
                              <div className="text-lg font-black">P{c.price.toFixed(2)}</div>
                            ) : (
                              <div className="text-xs font-black uppercase text-muted-foreground">N/A</div>
                            )}
                            <div
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                                c.status === "confirmed" || c.status === "approved" || c.status === "verified"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-amber-500/10 text-amber-400"
                              }`}
                            >
                              {c.status === "confirmed" || c.status === "approved" || c.status === "verified" ? (
                                <>
                                  <CheckCircle className="h-3 w-3" /> Verified
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3" /> Pending
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
              
              {visibleCount < filteredContributions.length && (
                <div className="pt-6 pb-12 flex justify-center">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 15)}
                    className="app-panel rounded-full border border-emerald-500/10 px-8 py-4 text-xs font-black uppercase tracking-widest text-emerald-600 shadow-xl transition-all hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
                  >
                    Load More
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="pt-8">
              <EmptyState
                icon={TrendingDown}
                title={`No reports found`}
                description={
                  searchQuery 
                    ? `We couldn't find any reports matching "${searchQuery}"`
                    : "Start updating fuel prices to help the community"
                }
                action={!searchQuery && statusFilter === "all" ? { label: "Find Stations", onClick: () => navigate("/app") } : undefined}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
