import { useNavigate } from "react-router";
import { ArrowLeft, Award, Crown, MapPin, ShieldCheck, Star, Trophy, TrendingUp, Users, Loader2 } from "lucide-react";
import { useAuth } from "@/app/providers/AuthContext";

import { useLeaderboard, useSummaryStats } from "@/hooks/useUsers";

const RANK_COLORS = [
  "from-yellow-400 via-orange-500 to-rose-500",
  "from-slate-300 via-slate-400 to-slate-500",
  "from-amber-600 via-orange-500 to-orange-300",
  "from-emerald-500 via-green-500 to-teal-500",
  "from-cyan-500 via-blue-500 to-indigo-500",
  "from-violet-500 via-fuchsia-500 to-pink-500",
];

function RankMedal({ rank }) {
  if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
  if (rank === 2) return <Trophy className="w-6 h-6 text-slate-400" />;
  if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
  return <span className="text-lg font-black text-muted-foreground">{rank}</span>;
}

export function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: rawLeaderboard = [], isLoading } = useLeaderboard();
  const { data: stats } = useSummaryStats();

  const leaderboard = rawLeaderboard.map((entry, index) => ({
    rank: index + 1,
    name: entry.username || "Anonymous Contributor",
    id: entry.id,
    city: "Philippines",
    updates: entry.total_updates,
    accuracy: entry.accuracy || 0,
    points: entry.reputation,
    badge: entry.reputation > 1000 ? "Fuel Guardian" : "Trusted Contributor",
    color: RANK_COLORS[index % RANK_COLORS.length],
  }));

  const me = leaderboard.find((entry) => entry.id === user?.id) || {
    rank: "-",
    name: user?.user_metadata?.full_name || "You",
    updates: 0,
    accuracy: 0,
    points: 0,
    badge: "New Contributor"
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 pb-16">
      <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-14 pb-10 px-4 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="w-12 h-12 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl shadow-black/20 hover:scale-110 transition-transform border-2 border-white/40"
            >
              <ArrowLeft className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
            </button>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white drop-shadow-2xl tracking-tight">Leaderboard</h1>
              <p className="text-white/90 text-sm lg:text-base font-medium drop-shadow-lg">Top community contributors by accuracy and volume</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            <div className="bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-2xl p-4 lg:p-5 shadow-2xl shadow-black/20 border-2 border-gray-200 dark:border-neutral-700">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span className="text-xs lg:text-sm font-bold text-muted-foreground uppercase tracking-widest">Active Users</span>
              </div>
              <div className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                {stats?.active_users > 999 ? `${(stats.active_users / 1000).toFixed(1)}k` : stats?.active_users || 0}
              </div>
            </div>
            <div className="bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-2xl p-4 lg:p-5 shadow-2xl shadow-black/20 border-2 border-gray-200 dark:border-neutral-700">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span className="text-xs lg:text-sm font-bold text-muted-foreground uppercase tracking-widest">Updates Today</span>
              </div>
              <div className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">{stats?.updates_today || 0}</div>
            </div>
            <div className="bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-2xl p-4 lg:p-5 shadow-2xl shadow-black/20 border-2 border-gray-200 dark:border-neutral-700">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="text-xs lg:text-sm font-bold text-muted-foreground uppercase tracking-widest">Verified</span>
              </div>
              <div className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">{stats?.verified_rate || 98}%</div>
            </div>
            <div className="bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-2xl p-4 lg:p-5 shadow-2xl shadow-black/20 border-2 border-gray-200 dark:border-neutral-700">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-emerald-600" />
                <span className="text-xs lg:text-sm font-bold text-muted-foreground uppercase tracking-widest">Points Earned</span>
              </div>
              <div className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                {stats?.total_updates ? `${((stats.total_updates * 10) / 1000).toFixed(1)}k` : "0k"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8 -mt-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.4fr_0.6fr] gap-6 lg:gap-8">
          <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-3xl border-2 border-gray-200 dark:border-neutral-700 shadow-2xl shadow-black/10 overflow-hidden">
            <div className="px-5 lg:px-6 pt-6 pb-4 border-b border-gray-200 dark:border-neutral-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">Community Rankings</h2>
                <p className="text-sm text-muted-foreground font-medium">Ranked by points, accuracy, and verified updates</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <Trophy className="w-4 h-4" />
                Weekly snapshot
              </div>
            </div>

            <div className="p-4 lg:p-6 space-y-3">
              {isLoading ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                </div>
              ) : leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`rounded-2xl border-2 p-4 lg:p-5 transition-all ${
                    entry.rank === 4
                      ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-400/40 shadow-lg shadow-emerald-500/10"
                      : "bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700 hover:border-emerald-400/40"
                  }`}
                >
                  <div className="flex items-center gap-4 lg:gap-5">
                    <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br ${entry.color} flex items-center justify-center shadow-xl text-white`}>
                      <RankMedal rank={entry.rank} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-foreground text-base lg:text-lg tracking-tight">{entry.name}</h3>
                        <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-neutral-800 px-2.5 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{entry.badge}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          {entry.city}
                        </span>
                        <span>{entry.updates} updates</span>
                        <span>{entry.accuracy}% accuracy</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl lg:text-3xl font-bold text-foreground tracking-tighter">{entry.points}</div>
                      <div className="text-xs lg:text-sm text-muted-foreground font-semibold uppercase tracking-widest">points</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-3xl border-2 border-gray-200 dark:border-neutral-700 p-6 shadow-2xl shadow-black/10">
              <h2 className="text-xl font-bold text-foreground mb-4 tracking-tight">Your Rank</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/20 text-white">
                  <span className="text-xl font-black">{me?.rank}</span>
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground tracking-tight">{me?.name}</div>
                  <div className="text-sm text-muted-foreground font-medium">{me?.badge}</div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-gray-50 dark:bg-neutral-800 p-3 text-center">
                  <div className="text-xl font-bold text-foreground">{me?.updates}</div>
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Updates</div>
                </div>
                <div className="rounded-2xl bg-gray-50 dark:bg-neutral-800 p-3 text-center">
                  <div className="text-xl font-bold text-foreground">{me?.accuracy}%</div>
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Accuracy</div>
                </div>
                <div className="rounded-2xl bg-gray-50 dark:bg-neutral-800 p-3 text-center">
                  <div className="text-xl font-bold text-foreground">{me?.points}</div>
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">Points</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-3xl border-2 border-gray-200 dark:border-neutral-700 p-6 shadow-2xl shadow-black/10">
              <h2 className="text-xl font-bold text-foreground mb-4 tracking-tight">How it works</h2>
              <div className="space-y-4 text-sm text-muted-foreground font-medium leading-relaxed">
                <p>Earn points by submitting price updates, confirming nearby station data, and keeping entries accurate.</p>
                <p>Higher accuracy keeps your rank moving up faster than raw volume alone.</p>
                <p>Leaderboard snapshots refresh as new verified updates are processed.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
