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
    ...localContributions.map((c) => ({
      id: c.id,
      type: c.type,
      stationName: c.stationName,
      fuelType: c.fuelType,
      price: c.price,
      date: new Date(c.date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }),
      status: c.status,
      karmaImpact: c.karmaImpact,
    })),
    ...rawContributions.map((c) => ({
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

  const filteredContributions = contributions.filter((c) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "verified") return c.status === "confirmed" || c.status === "approved";
    return c.status === statusFilter;
  });

  const verifiedCount = contributions.filter(
    (c) => c.status === "confirmed" || c.status === "approved" || c.status === "verified",
  ).length;
  const pendingCount = contributions.filter((c) => c.status === "pending").length;
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
        onClose={() => {
          setShowAuthPrompt(false);
          navigate("/app/map");
        }}
        message="Sign in to view your contribution history and track your updates."
      />

      <div className="min-h-screen bg-[#050A09] pb-28 text-white">
        <div className="relative overflow-hidden px-6 pb-28 pt-14">
          <div className="absolute top-0 right-0 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-[140px]" />
          <div className="relative z-10 mx-auto max-w-4xl">
            <div className="mb-12 flex items-center gap-6">
              <button
                onClick={() => navigate(-1)}
                className="group rounded-full border border-emerald-500/10 bg-[#0C1A17] p-3 shadow-2xl transition-all hover:bg-emerald-500"
              >
                <ArrowLeft className="h-6 w-6 transition-transform group-hover:scale-110" />
              </button>
              <div>
                <h1 className="text-4xl font-black tracking-tight lg:text-5xl">My Reports</h1>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-gray-600">
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
                  className="rounded-3xl border border-emerald-500/5 bg-[#0C1A17] p-6 shadow-2xl"
                >
                  <div className={`mb-1 text-3xl font-black ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="-mt-14 mx-auto max-w-4xl space-y-6 px-6">
          <div className="flex items-center gap-4 rounded-[2.5rem] border border-emerald-500/20 bg-emerald-500/10 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10">
              <Star className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="mb-0.5 text-sm font-black text-emerald-400">Your Impact This Month</div>
              <p className="text-xs font-bold text-gray-500">
                Helping {Math.max(1, contributions.length * 15)}+ drivers save on fuel. Trust Score: {trustScore}%
              </p>
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {totalKarma}
              <span className="ml-1 text-xs text-gray-600">pts</span>
            </div>
          </div>

          <div className="flex gap-2 rounded-[2.5rem] border border-emerald-500/10 bg-[#0C1A17] p-2 shadow-2xl">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`flex-1 rounded-[2rem] py-3.5 text-[10px] font-black uppercase tracking-widest transition-all ${
                  statusFilter === f.key ? `${f.color} text-white shadow-lg` : "text-gray-600 hover:text-gray-400"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-[2.5rem] border border-emerald-500/5 bg-[#0C1A17]" />
            ))
          ) : filteredContributions.length > 0 ? (
            <div className="space-y-4">
              {filteredContributions.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="overflow-hidden rounded-[2.5rem] border border-emerald-500/5 bg-[#0C1A17] shadow-2xl transition-all hover:border-emerald-500/20"
                >
                  <div className="flex items-center gap-5 p-6">
                    <StationLogo name={c.stationName} size="md" />

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-black">{c.stationName}</h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${
                            c.karmaImpact > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {c.karmaImpact > 0 ? `+${c.karmaImpact}` : c.karmaImpact} Karma
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {c.date}
                        </span>
                        {c.fuelType && <span className="text-gray-700">·</span>}
                        {c.fuelType && <span>{c.fuelType}</span>}
                      </div>
                    </div>

                    <div className="shrink-0 space-y-1.5 text-right">
                      {c.price !== null ? (
                        <div className="text-xl font-black">P{c.price.toFixed(2)}</div>
                      ) : (
                        <div className="text-xs font-black uppercase text-gray-600">N/A</div>
                      )}
                      <div
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${
                          c.status === "confirmed" || c.status === "approved"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {c.status === "confirmed" || c.status === "approved" ? (
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
