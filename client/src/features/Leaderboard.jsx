import { useNavigate } from "react-router";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Award, Crown, MapPin, ShieldCheck, Star, Trophy, TrendingUp, Users, CheckCircle, Sparkles, Zap } from "lucide-react";
import { useAuth } from "@/app/providers/AuthContext";
import { Skeleton } from "@/shared/components/Skeleton";

import { useLeaderboard, useSummaryStats } from "@/hooks/useUsers";
import { useMyContributions } from "@/hooks/usePrices";

const RANK_COLORS = [
  "from-yellow-400 via-orange-500 to-rose-500",
  "from-slate-300 via-slate-400 to-slate-500",
  "from-amber-600 via-orange-500 to-orange-300",
  "from-emerald-500 via-green-500 to-teal-500",
  "from-cyan-500 via-blue-500 to-indigo-500",
  "from-violet-500 via-fuchsia-500 to-pink-500",
];

function RankMedal({ rank }) {
  if (rank === 1) return <Crown className="w-8 h-8 text-white drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />;
  if (rank === 2) return <Trophy className="w-7 h-7 text-white drop-shadow-[0_0_15px_rgba(148,163,184,0.5)]" />;
  if (rank === 3) return <Award className="w-7 h-7 text-white drop-shadow-[0_0_15px_rgba(217,119,6,0.5)]" />;
  return <span className="text-xl font-black text-white/50">{rank}</span>;
}

export function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: rawLeaderboard = [], isLoading } = useLeaderboard();
  const { data: rawContributions = [] } = useMyContributions();
  const { data: stats } = useSummaryStats();

  const myStats = useMemo(() => {
    if (!user) return { total: 0, verified: 0, karma: 0, trustScore: 0 };
    const total = rawContributions.length;
    const karma = user?.karma || 0;
    const trustScore = user?.trustScore || 0;
    return { total, karma, trustScore };
  }, [rawContributions, user]);

  const leaderboard = rawLeaderboard.map((entry, index) => ({
    rank: index + 1,
    name: entry.username || "Anonymous",
    id: entry.id,
    city: "Philippines",
    updates: entry.total_updates,
    trustScore: entry.accuracy || 0,
    karma: entry.total_points !== undefined ? entry.total_points : (entry.points || entry.reputation || 0),
    isVerified: !!entry.is_verified,
    badge: (() => {
      const karma = entry.total_points !== undefined ? entry.total_points : (entry.points || entry.reputation || 0);
      if (karma > 1000) return "Fuel Guardian";
      if (karma > 200) return "Trusted Contributor";
      return null;
    })(),
    color: RANK_COLORS[index % RANK_COLORS.length],
  })).sort((a, b) => (b.karma || 0) - (a.karma || 0)).map((entry, index) => ({ ...entry, rank: index + 1 }));

  const me = leaderboard.find((entry) => entry.id === user?.id) || {
    rank: leaderboard.length + 1,
    name: user?.username || "You",
    updates: myStats.total,
    trustScore: myStats.trustScore,
    karma: myStats.karma,
    isVerified: !!user?.is_verified,
<<<<<<< HEAD
    badge: myStats.karma > 1000 ? "Fuel Guardian" : "Contributor"
=======
    badge: myStats.karma > 1000 ? "Fuel Guardian" : myStats.karma > 200 ? "Trusted Contributor" : null
>>>>>>> ac377a1f9bae0a8d5c8145126303cd533e839c49
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#050A09] text-white pb-32">
      {/* Header section */}
      <div className="relative pt-16 pb-24 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center gap-6 mb-12">
            <button onClick={() => navigate(-1)} className="p-3 bg-[#0C1A17] rounded-full border border-emerald-500/10 hover:bg-emerald-500 hover:text-white transition-all shadow-2xl">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-5xl font-black tracking-tight mb-2">Hall of Fame</h1>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Community contributors of the month</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Active Users", value: stats?.active_users || 0, icon: Users },
              { label: "Daily Updates", value: stats?.updates_today || 0, icon: TrendingUp },
              { label: "Verified Rate", value: `${stats?.verified_rate || 98}%`, icon: ShieldCheck },
              { label: "Total Karma", value: stats?.total_updates ? `${((stats.total_updates * 10) / 1000).toFixed(1)}k` : "0k", icon: Star }
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-[#0C1A17] rounded-3xl p-6 border border-emerald-500/5 shadow-2xl">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                       <stat.icon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</span>
                 </div>
                 <div className="text-3xl font-black">{stat.value}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

<<<<<<< HEAD
      <div className="max-w-6xl mx-auto px-6 -mt-10 grid lg:grid-cols-[1fr_350px] gap-8">
        
        {/* Main List */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
          <div className="flex items-center justify-between mb-6 px-4">
             <h2 className="text-xl font-black">Rankings</h2>
             <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/10">
                <Trophy className="w-3 h-3" />
                Live Standings
             </div>
=======
      <div className="px-4 lg:px-8 -mt-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.4fr_0.6fr] gap-6 lg:gap-8">
          <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-3xl border-2 border-gray-200 dark:border-neutral-700 shadow-2xl shadow-black/10 overflow-hidden">
            <div className="px-5 lg:px-6 pt-6 pb-4 border-b border-gray-200 dark:border-neutral-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">Community Rankings</h2>
                <p className="text-sm text-muted-foreground font-medium">Ranked by karma, trust score, and verified updates</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <Trophy className="w-4 h-4" />
                Weekly snapshot
              </div>
            </div>

            <div className="p-4 lg:p-6 space-y-3">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-5 p-5 rounded-3xl border-2 border-gray-100 dark:border-neutral-800 shadow-sm">
                      <Skeleton className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl flex-shrink-0" />
                      <div className="flex-1 space-y-2.5">
                        <Skeleton className="h-6 w-1/3 rounded-lg" />
                        <Skeleton className="h-4 w-1/2 rounded-md" />
                      </div>
                      <div className="text-right space-y-2">
                        <Skeleton className="h-8 w-16 ml-auto rounded-lg" />
                        <Skeleton className="h-3 w-12 ml-auto rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`rounded-3xl border-2 p-4 lg:p-6 transition-all ${
                    entry.id === user?.id
                      ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/10"
                      : "bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800 hover:border-emerald-400/30 hover:shadow-lg"
                  }`}
                >
                  <div className="flex items-center gap-4 lg:gap-5">
                    <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br ${entry.color} flex items-center justify-center shadow-xl text-white`}>
                      <RankMedal rank={entry.rank} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-foreground text-base lg:text-lg tracking-tight flex items-center gap-1.5">
                          {entry.name}
                          {entry.isVerified && (
                            <div className="inline-flex items-center justify-center w-4 h-4 bg-blue-500 rounded-full">
                              <CheckCircle className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />
                            </div>
                          )}
                        </h3>
                        {entry.badge && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-neutral-800 px-2.5 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{entry.badge}</span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          {entry.city}
                        </span>
                        <span>{entry.updates} updates</span>
                        <span>{entry.trustScore}% trust score</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl lg:text-3xl font-bold text-foreground tracking-tighter">{entry.karma}</div>
                      <div className="text-xs lg:text-sm text-muted-foreground font-semibold uppercase tracking-widest">karma</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
>>>>>>> ac377a1f9bae0a8d5c8145126303cd533e839c49
          </div>

          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-[#0C1A17] rounded-3xl animate-pulse border border-emerald-500/5" />
            ))
          ) : leaderboard.map((entry) => (
            <motion.div
              key={entry.rank}
              variants={itemVariants}
              whileHover={{ scale: 1.01, x: 5 }}
              className={`group flex items-center gap-6 p-6 rounded-[2.5rem] border transition-all ${
                entry.id === user?.id 
                  ? "bg-[#1A2E2A] border-emerald-500/30 shadow-2xl shadow-emerald-500/10" 
                  : "bg-[#0C1A17] border-emerald-500/5 hover:border-emerald-500/20"
              }`}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${entry.color} flex items-center justify-center shadow-2xl shrink-0 group-hover:rotate-6 transition-transform`}>
                <RankMedal rank={entry.rank} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                   <h3 className="text-lg font-black truncate">{entry.name}</h3>
                   {entry.isVerified && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                   <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest bg-[#050A09] px-2 py-1 rounded-md border border-emerald-500/5">{entry.badge}</span>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                   <div className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-emerald-500" /> {entry.updates} Updates</div>
                   <div className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-emerald-400" /> {entry.trustScore}% Trust</div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-2xl font-black text-emerald-400">{entry.karma.toLocaleString()}</div>
                <div className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">Karma</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* My Rank Card */}
          <div className="bg-[#0C1A17] rounded-[2.5rem] p-8 border border-emerald-500/10 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Crown className="w-20 h-20" /></div>
             <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6">Your Standing</h3>
             <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                   <span className="text-2xl font-black">{me?.rank}</span>
                </div>
                <div>
<<<<<<< HEAD
                   <div className="text-xl font-black mb-1">{me?.name}</div>
                   <div className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest">{me?.badge}</div>
=======
                  <div className="text-lg font-bold text-foreground tracking-tight flex items-center gap-1.5">
                    {me?.name}
                    {me?.isVerified && (
                      <div className="inline-flex items-center justify-center w-4 h-4 bg-blue-500 rounded-full">
                        <CheckCircle className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />
                      </div>
                    )}
                  </div>
                  {me?.badge && <div className="text-sm text-muted-foreground font-medium">{me.badge}</div>}
>>>>>>> ac377a1f9bae0a8d5c8145126303cd533e839c49
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#050A09] p-4 rounded-2xl border border-emerald-500/5 text-center">
                   <div className="text-lg font-black">{me?.karma.toLocaleString()}</div>
                   <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Points</div>
                </div>
                <div className="bg-[#050A09] p-4 rounded-2xl border border-emerald-500/5 text-center">
                   <div className="text-lg font-black">{me?.trustScore}%</div>
                   <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Accuracy</div>
                </div>
             </div>
          </div>

          {/* Rules Card */}
          <div className="bg-emerald-500/5 rounded-[2.5rem] p-8 border border-emerald-500/10 shadow-2xl">
             <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-4">Elite Perks</h3>
             <ul className="space-y-4">
                {[
                  "Verified Badge for top 10 contributors",
                  "Priority reporting verification",
                  "Early access to new features",
                  "Exclusive profile customization"
                ].map((perk, i) => (
                  <li key={i} className="flex gap-3 text-xs font-bold text-gray-500 leading-relaxed">
                     <div className="mt-1 w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                     {perk}
                  </li>
                ))}
             </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
