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
    badge: (entry.total_points !== undefined ? entry.total_points : (entry.points || entry.reputation || 0)) > 1000 ? "Fuel Guardian" : "Trusted Contributor",
    color: RANK_COLORS[index % RANK_COLORS.length],
  })).sort((a, b) => (b.karma || 0) - (a.karma || 0)).map((entry, index) => ({ ...entry, rank: index + 1 }));

  const me = leaderboard.find((entry) => entry.id === user?.id) || {
    rank: leaderboard.length + 1,
    name: user?.username || "You",
    updates: myStats.total,
    trustScore: myStats.trustScore,
    karma: myStats.karma,
    isVerified: !!user?.is_verified,
    badge: myStats.karma > 1000 ? "Fuel Guardian" : "Contributor"
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

      <div className="max-w-6xl mx-auto px-6 -mt-10 grid lg:grid-cols-[1fr_350px] gap-8">
        
        {/* Main List */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
          <div className="flex items-center justify-between mb-6 px-4">
             <h2 className="text-xl font-black">Rankings</h2>
             <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/10">
                <Trophy className="w-3 h-3" />
                Live Standings
             </div>
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
                   <div className="text-xl font-black mb-1">{me?.name}</div>
                   <div className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest">{me?.badge}</div>
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
