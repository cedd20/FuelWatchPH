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
  if (rank === 1) return <Crown className="w-6 h-6 text-white drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]" />;
  if (rank === 2) return <Trophy className="w-5 h-5 text-white drop-shadow-[0_0_10px_rgba(148,163,184,0.4)]" />;
  if (rank === 3) return <Award className="w-5 h-5 text-white drop-shadow-[0_0_10px_rgba(217,119,6,0.4)]" />;
  return <span className="text-lg font-bold text-white/50">{rank}</span>;
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

  const leaderboard = useMemo(() => {
    return rawLeaderboard
      .map((entry) => {
        const karma = entry.total_points !== undefined 
          ? entry.total_points 
          : (entry.points || entry.reputation || 0);
        return {
          name: entry.username || "Anonymous",
          id: entry.id,
          city: "Philippines",
          updates: entry.total_updates || 0,
          trustScore: entry.accuracy || 0,
          karma: typeof karma === "number" ? karma : parseInt(karma, 10) || 0,
          isVerified: !!entry.is_verified,
          badge: (() => {
            if (karma > 1000) return "Fuel Guardian";
            if (karma > 200) return "Trusted Contributor";
            return null;
          })(),
        };
      })
      .filter((entry) => entry.karma >= 300)
      .sort((a, b) => b.karma - a.karma)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
        color: RANK_COLORS[index % RANK_COLORS.length] || "from-emerald-500 to-teal-500",
      }));
  }, [rawLeaderboard]);

  const me = useMemo(() => {
    const found = leaderboard.find((entry) => entry.id === user?.id);
    if (found) return found;
    return {
      rank: "—",
      name: user?.username || "You",
      updates: myStats.total,
      trustScore: myStats.trustScore,
      karma: myStats.karma,
      isVerified: !!user?.is_verified,
      badge: myStats.karma > 1000 ? "Fuel Guardian" : myStats.karma > 200 ? "Trusted Contributor" : "Contributor"
    };
  }, [leaderboard, user, myStats]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="app-shell min-h-screen pb-32 text-foreground">
      {/* Header section */}
      <div className="relative pt-16 pb-24 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center gap-6 mb-12">
            <button onClick={() => navigate(-1)} className="app-panel rounded-full border border-emerald-500/10 p-3 shadow-2xl transition-all hover:bg-emerald-500 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Hall of Fame</h1>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Community contributors of the month</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Active Users", value: stats?.active_users || 0, icon: Users },
              { label: "Daily Updates", value: stats?.updates_today || 0, icon: TrendingUp },
              { label: "Verified Rate", value: `${stats?.verified_rate || 98}%`, icon: ShieldCheck },
              { label: "Total Karma", value: stats?.total_updates ? `${((stats.total_updates * 10) / 1000).toFixed(1)}k` : "0k", icon: Star }
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="app-panel rounded-2xl border border-emerald-500/5 p-5 shadow-2xl">
                 <div className="flex items-center gap-3 mb-3">
                    <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                       <stat.icon className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                 </div>
                 <div className="text-2xl font-bold">{stat.value}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-10 grid lg:grid-cols-[1fr_350px] gap-8">
        
        {/* Main List */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
          <div className="flex items-center justify-between mb-6 px-4">
             <h2 className="text-lg font-bold">Rankings</h2>
             <div className="flex items-center gap-2 text-[9px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/10">
                <Trophy className="w-3 h-3" />
                Live Standings
             </div>
          </div>

          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="app-panel h-24 animate-pulse rounded-3xl border border-emerald-500/5" />
            ))
          ) : leaderboard.length === 0 ? (
            <div className="app-panel flex flex-col items-center justify-center rounded-[2.5rem] border border-emerald-500/10 p-12 text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
                <Trophy className="w-8 h-8 text-emerald-500/60" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-foreground">No eligible contributors yet</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Users need at least 300 Karma to appear in the Hall of Fame. Keep verifying and updating prices to reach the leaderboard!
              </p>
            </div>
          ) : (
            leaderboard.map((entry) => {
              const isTop1 = entry.rank === 1;
              const isTop2 = entry.rank === 2;
              const isTop3 = entry.rank === 3;

              let cardClass = "";
              let paddingClass = "";
              let avatarSizeClass = "";
              let iconSizeClass = "";
              let nameClass = "";
              let karmaClass = "";
              let badgeClass = "";

              if (isTop1) {
                cardClass = "border-emerald-400/30 bg-gradient-to-br from-emerald-50 via-teal-50 to-white text-foreground shadow-[0_0_35px_rgba(16,185,129,0.08)] hover:border-emerald-400/50 ring-1 ring-emerald-400/10 dark:from-[#193834] dark:via-[#112926] dark:to-[#0a1e1b] dark:text-white dark:shadow-[0_0_35px_rgba(16,185,129,0.2)]";
                paddingClass = "p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem]";
                avatarSizeClass = "w-14 h-14 md:w-18 md:h-18";
                iconSizeClass = "w-7 h-7 md:w-9 md:h-9";
                nameClass = "text-lg md:text-2xl font-black";
                karmaClass = "text-2xl md:text-4xl font-black text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.25)]";
                badgeClass = "border border-emerald-500/20 bg-white/80 text-emerald-700 dark:bg-[#050A09]/80 dark:text-emerald-400";
              } else if (isTop2) {
                cardClass = "border-emerald-400/20 bg-gradient-to-br from-slate-50 via-white to-emerald-50 text-foreground shadow-[0_0_20px_rgba(16,185,129,0.06)] hover:border-emerald-500/30 dark:border-emerald-500/18 dark:from-[#132f2b] dark:via-[#0f2622] dark:to-[#091816] dark:text-white dark:shadow-[0_0_20px_rgba(16,185,129,0.12)]";
                paddingClass = "p-5 md:p-7 rounded-[1.75rem] md:rounded-[2.25rem]";
                avatarSizeClass = "w-12 h-12 md:w-15 md:h-15";
                iconSizeClass = "w-6 h-6 md:w-7 md:h-7";
                nameClass = "text-base md:text-xl font-black";
                karmaClass = "text-xl md:text-3xl font-black text-slate-600 drop-shadow-[0_0_8px_rgba(203,213,225,0.15)] dark:text-slate-300";
                badgeClass = "border border-emerald-500/10 bg-white/72 text-slate-600 dark:bg-[#050A09]/60 dark:text-slate-300";
              } else if (isTop3) {
                cardClass = "border-amber-400/20 bg-gradient-to-br from-amber-50 via-white to-orange-50 text-foreground shadow-[0_0_15px_rgba(16,185,129,0.04)] hover:border-amber-500/30 dark:border-amber-500/18 dark:from-[#122824] dark:via-[#0d1d1a] dark:to-[#071210] dark:text-white dark:shadow-[0_0_15px_rgba(16,185,129,0.08)]";
                paddingClass = "p-4.5 md:p-6 rounded-[1.5rem] md:rounded-[2rem]";
                avatarSizeClass = "w-11 h-11 md:w-13 md:h-13";
                iconSizeClass = "w-5.5 h-5.5 md:w-6 md:h-6";
                nameClass = "text-sm md:text-lg font-black";
                karmaClass = "text-lg md:text-2xl font-black text-amber-600 drop-shadow-[0_0_6px_rgba(217,119,6,0.1)] dark:text-amber-300";
                badgeClass = "border border-amber-400/20 bg-white/70 text-amber-700 dark:bg-[#050A09]/50 dark:text-amber-300";
              } else {
                cardClass = entry.id === user?.id 
                  ? "app-panel border-emerald-500/30 shadow-2xl shadow-emerald-500/10 hover:border-emerald-500/40"
                  : "app-panel border-emerald-500/5 hover:border-emerald-500/25";
                paddingClass = "p-3.5 md:p-4.5 rounded-[1.25rem] md:rounded-[1.75rem]";
                avatarSizeClass = "w-9 h-9 md:w-11 md:h-11";
                iconSizeClass = "w-4.5 h-4.5 md:w-5 md:h-5";
                nameClass = "text-xs md:text-base font-bold";
                karmaClass = "text-base md:text-xl font-bold text-emerald-400/90";
                badgeClass = "bg-emerald-500/8 border border-emerald-500/10 text-muted-foreground";
              }

              return (
                <motion.div
                  key={entry.id || entry.rank}
                  variants={itemVariants}
                  whileHover={{ scale: 1.005, x: 4 }}
                  className={`group flex items-center gap-4 md:gap-6 border transition-all ${cardClass} ${paddingClass}`}
                >
                  <div className={`rounded-xl bg-gradient-to-br ${entry.color} flex items-center justify-center shadow-2xl shrink-0 group-hover:rotate-3 transition-transform ${avatarSizeClass}`}>
                    {entry.rank === 1 ? (
                      <Crown className={`text-white drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] ${iconSizeClass}`} />
                    ) : entry.rank === 2 ? (
                      <Trophy className={`text-white drop-shadow-[0_0_8px_rgba(148,163,184,0.5)] ${iconSizeClass}`} />
                    ) : entry.rank === 3 ? (
                      <Award className={`text-white drop-shadow-[0_0_8px_rgba(217,119,6,0.5)] ${iconSizeClass}`} />
                    ) : (
                      <span className={`font-black text-white/50 ${entry.rank > 9 ? "text-xs md:text-sm" : "text-sm md:text-base"}`}>{entry.rank}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 md:gap-2.5 mb-1">
                      <h3 className={`${nameClass} truncate font-black ${isTop1 || isTop2 || isTop3 ? "text-foreground dark:text-white" : "text-foreground"}`}>{entry.name}</h3>
                      {entry.isVerified && <CheckCircle className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 text-emerald-400 shrink-0" />}
                      
                      {isTop1 ? (
                        <span className="text-[8px] md:text-[9.5px] font-black text-amber-400 uppercase tracking-widest bg-amber-400/10 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full border border-amber-400/25 flex items-center gap-1 shrink-0">
                          <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3" /> Top Contributor
                        </span>
                      ) : isTop2 ? (
                        <span className="text-[7.5px] md:text-[8.5px] font-black uppercase tracking-widest bg-slate-500/10 px-1.5 md:px-2 py-0.5 rounded-full border border-slate-400/20 text-slate-600 dark:bg-slate-200/10 dark:text-slate-200 shrink-0">
                          Rank 2
                        </span>
                      ) : isTop3 ? (
                        <span className="text-[7.5px] md:text-[8.5px] font-black uppercase tracking-widest bg-amber-500/10 px-1.5 md:px-2 py-0.5 rounded-full border border-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                          Rank 3
                        </span>
                      ) : null}

                      {entry.badge && (
                        <span className={`text-[7.5px] md:text-[8.5px] font-black uppercase tracking-widest px-1.5 md:px-2 py-0.5 rounded-md shrink-0 ${badgeClass}`}>
                          {entry.badge}
                        </span>
                      )}
                    </div>
                    <div className={`flex items-center gap-3.5 text-[8.5px] md:text-[10px] font-bold uppercase tracking-widest ${isTop1 || isTop2 || isTop3 ? "text-muted-foreground dark:text-white/65" : "text-muted-foreground"}`}>
                      <div className="flex items-center gap-1"><Zap className="w-2.5 h-2.5 md:w-3 md:h-3 text-emerald-500" /> {entry.updates} Updates</div>
                      <div className="flex items-center gap-1"><Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 text-emerald-400" /> {entry.trustScore}% Trust</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={karmaClass}>{entry.karma.toLocaleString()}</div>
                    <div className={`mt-0.5 text-[7.5px] md:text-[9px] font-black uppercase tracking-[0.2em] ${isTop1 || isTop2 || isTop3 ? "text-muted-foreground dark:text-white/45" : "text-muted-foreground"}`}>Karma</div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* My Rank Card */}
          <div className="app-panel relative overflow-hidden rounded-[2.5rem] border border-emerald-500/10 p-8 shadow-2xl">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Crown className="w-20 h-20" /></div>
             <h3 className="mb-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Your Standing</h3>
             <div className="flex items-center gap-4 mb-8">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl ${
                  me?.rank === "—" 
                    ? "border border-gray-300/60 bg-gray-100 text-muted-foreground dark:border-gray-700/30 dark:bg-gray-800/40" 
                    : "bg-emerald-500 text-white shadow-emerald-500/20"
                }`}>
                   <span className="text-2xl font-black">{me?.rank}</span>
                </div>
                <div>
                   <div className="text-xl font-black mb-1">{me?.name}</div>
                   <div className="text-[10px] font-black uppercase tracking-widest">
                     {me?.rank === "—" ? (
                       <span className="text-rose-500/80">Unranked (&lt; 300 Karma)</span>
                     ) : (
                       <span className="text-emerald-500/70">{me?.badge}</span>
                     )}
                   </div>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="app-elevated rounded-2xl border border-emerald-500/5 p-4 text-center">
                   <div className="text-lg font-black">{me?.karma.toLocaleString()}</div>
                   <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Points</div>
                </div>
                <div className="app-elevated rounded-2xl border border-emerald-500/5 p-4 text-center">
                   <div className="text-lg font-black">{me?.trustScore}%</div>
                   <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Accuracy</div>
                </div>
             </div>
          </div>

          {/* Rules Card */}
          <div className="rounded-[2.5rem] border border-emerald-500/10 bg-emerald-500/5 p-8 shadow-2xl">
             <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-4">Elite Perks</h3>
             <ul className="space-y-4">
                {[
                  "Verified Badge for top 10 contributors",
                  "Priority reporting verification",
                  "Early access to new features",
                  "Exclusive profile customization"
                ].map((perk, i) => (
                  <li key={i} className="flex gap-3 text-xs font-bold leading-relaxed text-muted-foreground">
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
