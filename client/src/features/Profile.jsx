import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  Settings,
  UserPen,
  Trophy,
  ChevronRight,
  LogOut,
  FileText,
  HelpCircle,
  Heart,
  User,
  Info,
  Compass,
  Sparkles,
  CheckCircle,
  Shield,
  ShieldCheck,
  History,
  Zap,
  Crown
} from "lucide-react";
import { useAuth } from "@/app/providers/AuthContext";
import { useMyContributions } from "@/hooks/usePrices";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { Card, CardContent } from "@/shared/components/ui/card";

export function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, logout, refreshProfile } = useAuth();
  const hasTrustedContributorBadge = (user?.karma || 0) > 200;
  const { data: rawContributions = [], isLoading: contributionsLoading } = useMyContributions({
    enabled: isAuthenticated,
  });
  const { data: leaderboardData = [] } = useLeaderboard();

  const isTopContributor = useMemo(() => {
    if (!isAuthenticated || !user || !leaderboardData?.length) return false;
    const sorted = [...leaderboardData].sort((a, b) => (b.karma || 0) - (a.karma || 0));
    const top10 = sorted.slice(0, 10);
    return top10.some(c => c.id === user.id);
  }, [leaderboardData, isAuthenticated, user]);

  const stats = useMemo(() => {
    if (!isAuthenticated) return { total: 0, verified: 0, karma: 0, trustScore: 0 };
    const total = rawContributions.length;
    const karma = user?.karma || 0;
    const trustScore = user?.trustScore || 0;
    return { total, karma, trustScore };
  }, [rawContributions, isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated) refreshProfile();
  }, [isAuthenticated]);

  if (loading || (isAuthenticated && contributionsLoading)) {
    return (
      <div className="app-shell min-h-screen flex flex-col items-center justify-center">
        <Zap className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-emerald-500/60 font-bold animate-pulse">Syncing profile...</p>
      </div>
    );
  }

  const menuItems = isAuthenticated ? [
    { icon: Shield, label: "Admin Panel", sub: "Platform Management", path: "/admin/dashboard", admin: true },
    { icon: History, label: "My Reports", sub: `${stats.total} submissions`, path: "/app/contributions" },
    { icon: Heart, label: "Saved Stations", sub: "Quick access favorites", path: "/app/saved" },
    { icon: Trophy, label: "Leaderboard", sub: "Top community rank", path: "/app/leaderboard" },
    { icon: Settings, label: "Settings", sub: "Account & preferences", path: "/app/settings" },
    { icon: HelpCircle, label: "Support", sub: "FAQs and contact", path: "/app/support" },
  ] : [
    { icon: Compass, label: "Explore", sub: "Public map & prices", path: "/app/home" },
    { icon: Trophy, label: "Leaderboard", sub: "Community rankings", path: "/app/leaderboard" },
    { icon: Settings, label: "Settings", sub: "Theme & preferences", path: "/app/settings" },
    { icon: HelpCircle, label: "Help Center", sub: "Guides & Support", path: "/app/support" },
    { icon: FileText, label: "Legal", sub: "Terms & Privacy", path: "/app/terms" },
  ];

  const filteredMenu = menuItems.filter(item => !item.admin || user?.role === 'admin' || user?.user_type === 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const renderAchievementBadges = ({ desktop = false } = {}) => {
    if (!isAuthenticated || (!hasTrustedContributorBadge && !isTopContributor)) return null;

    return (
      <div
        className={`mt-6 grid w-full gap-4 ${
          desktop ? "max-w-none grid-cols-1 xl:grid-cols-2 px-0" : "max-w-sm grid-cols-1 px-4 sm:grid-cols-2 mx-auto"
        }`}
      >
        {hasTrustedContributorBadge && (
          <div className="app-panel group relative flex items-center gap-3 overflow-hidden rounded-full border border-emerald-500/50 px-4 py-2.5 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <div className="absolute top-0 left-6 h-[1px] w-8 bg-emerald-400 shadow-[0_0_10px_2px_#34d399]" />
            <div className="absolute -top-1 left-8 h-1 w-1 rounded-full bg-white shadow-[0_0_8px_2px_#34d399]" />
            <div className="flex-shrink-0">
              <ShieldCheck className="h-8 w-8 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.3)] sm:text-xs">
                Trusted Contributor
              </span>
              <span className="text-[9px] text-muted-foreground">Verified & reliable reporter</span>
            </div>
          </div>
        )}

        {isTopContributor && (
          <div className={`app-panel group relative flex items-center gap-3 overflow-visible rounded-full border border-amber-500/50 px-4 py-2.5 shadow-[0_0_20px_rgba(245,158,11,0.15)] ${desktop ? "" : "mt-2 sm:mt-0"}`}>
            <div className="absolute -top-4 right-1/4 translate-x-1/2">
              <Crown className="h-5 w-5 fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            </div>
            <div className="absolute top-0 right-1/4 h-[1px] w-8 bg-amber-400 shadow-[0_0_10px_2px_#fbbf24]" />
            <div className="flex-shrink-0">
              <Trophy className="h-8 w-8 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 drop-shadow-[0_0_4px_rgba(245,158,11,0.3)] sm:text-xs">
                Top Contributor
              </span>
              <span className="text-[9px] text-muted-foreground">Top 5% of community</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMenuButton = (item, idx, desktop = false) => (
    <motion.button
      key={idx}
      variants={itemVariants}
      whileHover={{ x: 4 }}
      onClick={() => navigate(item.path)}
      className={`app-panel group flex w-full items-center gap-4 rounded-[2rem] border border-emerald-500/5 p-5 transition-all hover:border-emerald-500/20 ${
        desktop ? "min-h-[104px] rounded-[2.1rem] px-6 py-5" : ""
      }`}
    >
      <div className="rounded-2xl bg-emerald-500/10 p-3 transition-all group-hover:bg-emerald-500 group-hover:text-white">
        <item.icon className="h-5 w-5 text-emerald-400 group-hover:text-white" />
      </div>
      <div className="flex-1 text-left">
        <div className={`${desktop ? "text-base" : "text-sm"} font-black text-foreground`}>{item.label}</div>
        <div className={`${desktop ? "text-[11px]" : "text-[10px]"} font-bold text-muted-foreground`}>{item.sub}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-emerald-500" />
    </motion.button>
  );

  return (
    <div className="app-shell min-h-screen overflow-x-hidden pb-24 text-foreground">
      <div className="lg:hidden">
        <div className="relative overflow-hidden px-6 pb-24 pt-12">
          <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl translate-y-1/2 -translate-x-1/2" />

          {isAuthenticated && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => navigate("/app/edit-profile")}
              className="app-panel absolute right-8 top-8 z-30 rounded-2xl border border-emerald-500/20 p-3 text-emerald-400 shadow-xl transition-all hover:bg-emerald-500 hover:text-white"
            >
              <UserPen className="w-5 h-5" />
            </motion.button>
          )}

          <div className="relative z-10 mx-auto flex max-w-md flex-col items-center text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative mb-6">
              <div className="h-28 w-28 rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-teal-600 p-1 shadow-2xl shadow-emerald-500/20">
                <div className="app-panel-strong flex h-full w-full items-center justify-center overflow-hidden rounded-[2.2rem] border border-white/10">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-emerald-500" />
                  )}
                </div>
              </div>
              {isAuthenticated && (
                <div className="absolute -bottom-2 -right-2 rounded-full border-4 border-[var(--app-shell)] bg-emerald-500 p-1.5 shadow-xl">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center space-y-1"
            >
              <h1 className="text-3xl font-black tracking-tight">
                {isAuthenticated ? (user?.username || user?.name) : "Tankmate"}
              </h1>
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                {isAuthenticated ? user?.email : "Guest Session"}
              </p>
              {renderAchievementBadges()}
            </motion.div>

            {!isAuthenticated && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8 flex w-full gap-3"
              >
                <button
                  onClick={() => navigate("/login")}
                  className="flex-1 rounded-2xl bg-emerald-500 py-3.5 text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="app-panel flex-1 rounded-2xl border border-emerald-500/20 py-3.5 text-xs font-black uppercase tracking-widest text-emerald-400 transition-all hover:bg-emerald-500/5"
                >
                  Join Us
                </button>
              </motion.div>
            )}
          </div>
        </div>

        <div className="relative z-20 mx-auto -mt-16 max-w-md space-y-6 px-6">
          {isAuthenticated && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3">
              {[
                { label: "Reports", val: stats.total, color: "text-emerald-400" },
                { label: "Trust", val: `${stats.trustScore}%`, color: "text-emerald-400" },
                { label: "Karma", val: stats.karma, color: "text-amber-400" }
              ].map((s, i) => (
                <div key={i} className="app-panel rounded-[2rem] border border-emerald-500/10 p-4 text-center shadow-xl">
                  <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
                  <div className="mt-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </motion.div>
          )}

          {isAuthenticated && user?.bio && (
            <Card className="app-panel rounded-[2rem] border-emerald-500/10">
              <CardContent className="p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">About Me</span>
                </div>
                <p className="text-sm font-medium italic leading-relaxed text-[var(--app-text-soft)]">
                  "{user.bio}"
                </p>
              </CardContent>
            </Card>
          )}

          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
            <div className="px-2">
              <h3 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                {isAuthenticated ? "Menu" : "Quick Access"}
              </h3>
            </div>
            <div className="grid gap-3">
              {filteredMenu.map((item, idx) => renderMenuButton(item, idx))}
            </div>
          </motion.div>

          {isAuthenticated ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4">
              <button
                onClick={logout}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-rose-500/10 bg-rose-500/5 py-4 text-xs font-black uppercase tracking-widest text-rose-500 shadow-xl shadow-rose-500/5 transition-all hover:bg-rose-500 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </motion.div>
          ) : (
            <div className="app-panel rounded-[2rem] border border-emerald-500/10 p-6 text-center">
              <Info className="mx-auto mb-3 h-8 w-8 text-emerald-500/20" />
              <p className="text-[11px] font-bold leading-relaxed text-muted-foreground">
                Create an account to track your submissions, earn achievements, and help the community grow.
              </p>
            </div>
          )}

          <div className="pt-8 text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              FuelWatchPH v1.0
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="relative overflow-hidden px-8 pb-16 pt-10 xl:px-10">
          <div className="absolute top-0 right-0 h-[30rem] w-[30rem] rounded-full bg-emerald-500/5 blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 h-[24rem] w-[24rem] rounded-full bg-emerald-500/10 blur-3xl translate-y-1/2 -translate-x-1/3" />

          <div className="relative z-10 mx-auto max-w-[1560px]">
            <div className="space-y-7">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="app-panel relative overflow-hidden rounded-[2.7rem] border border-emerald-500/10 px-8 py-8 shadow-2xl xl:px-12 xl:py-10"
                >
                  {isAuthenticated && (
                    <motion.button
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => navigate("/app/edit-profile")}
                      className="app-panel absolute right-8 top-8 z-30 rounded-2xl border border-emerald-500/20 p-3 text-emerald-400 shadow-xl transition-all hover:bg-emerald-500 hover:text-white"
                    >
                      <UserPen className="h-5 w-5" />
                    </motion.button>
                  )}

                  <div className="flex items-start gap-8 xl:gap-12">
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative shrink-0">
                      <div className="h-36 w-36 rounded-[2.7rem] bg-gradient-to-br from-emerald-500 to-teal-600 p-1 shadow-2xl shadow-emerald-500/20 xl:h-40 xl:w-40">
                        <div className="app-panel-strong flex h-full w-full items-center justify-center overflow-hidden rounded-[2.35rem] border border-white/10">
                          {user?.avatar_url ? (
                            <img src={user.avatar_url} className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-14 w-14 text-emerald-500" />
                          )}
                        </div>
                      </div>
                      {isAuthenticated && (
                        <div className="absolute -bottom-2 -right-2 rounded-full border-4 border-[var(--app-shell)] bg-emerald-500 p-2 shadow-xl">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </motion.div>

                    <div className="flex min-w-0 flex-1 flex-col justify-center space-y-4 pt-2">
                      <div className="space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-400">
                          {isAuthenticated ? "Profile Overview" : "Guest Session"}
                        </p>
                        <h1 className="text-5xl font-black tracking-tight xl:text-6xl">
                          {isAuthenticated ? (user?.username || user?.name) : "Tankmate"}
                        </h1>
                        <p className="text-sm font-bold uppercase tracking-[0.24em] text-muted-foreground">
                          {isAuthenticated ? user?.email : "Explore FuelWatchPH features"}
                        </p>
                      </div>

                      {renderAchievementBadges({ desktop: true })}

                      {!isAuthenticated && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="flex max-w-md gap-3 pt-3"
                        >
                          <button
                            onClick={() => navigate("/login")}
                            className="flex-1 rounded-2xl bg-emerald-500 px-5 py-4 text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                          >
                            Sign In
                          </button>
                          <button
                            onClick={() => navigate("/signup")}
                            className="app-panel flex-1 rounded-2xl border border-emerald-500/20 px-5 py-4 text-xs font-black uppercase tracking-widest text-emerald-400 transition-all hover:bg-emerald-500/5"
                          >
                            Join Us
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>

                <div className="grid gap-5 xl:grid-cols-3 2xl:gap-6">
                  {isAuthenticated ? (
                    [
                      { label: "Reports", val: stats.total, color: "text-emerald-400" },
                      { label: "Trust", val: `${stats.trustScore}%`, color: "text-emerald-400" },
                      { label: "Karma", val: stats.karma, color: "text-amber-400" }
                    ].map((s, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="app-panel rounded-[2.25rem] border border-emerald-500/10 p-6 text-center shadow-xl"
                      >
                        <div className={`text-3xl font-black ${s.color}`}>{s.val}</div>
                        <div className="mt-2 text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">{s.label}</div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="app-panel col-span-full rounded-[2.25rem] border border-emerald-500/10 p-6 text-left shadow-xl">
                      <div className="flex items-start gap-4">
                        <div className="rounded-2xl bg-emerald-500/10 p-3">
                          <Info className="h-5 w-5 text-emerald-400" />
                        </div>
                        <p className="text-sm font-bold leading-relaxed text-muted-foreground">
                          Create an account to track your submissions, earn achievements, and help the community grow.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {isAuthenticated && user?.bio && (
                  <Card className="app-panel rounded-[2.3rem] border-emerald-500/10 shadow-xl">
                    <CardContent className="p-6 xl:p-7">
                      <div className="mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">About Me</span>
                      </div>
                      <p className="text-base font-medium italic leading-relaxed text-[var(--app-text-soft)]">
                        "{user.bio}"
                      </p>
                    </CardContent>
                  </Card>
                )}

                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
                  <div className="px-2">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                      {isAuthenticated ? "Menu" : "Quick Access"}
                    </h3>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3 2xl:gap-5">
                    {filteredMenu.map((item, idx) => renderMenuButton(item, idx, true))}
                  </div>
                </motion.div>

                <div className="grid gap-4 pt-2 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
                  <div className="app-panel rounded-[2.35rem] border border-emerald-500/10 p-6 shadow-xl">
                    <div className="mb-4 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-400" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                        FuelWatchPH
                      </h3>
                    </div>
                    <p className="text-sm font-bold leading-relaxed text-muted-foreground">
                      Manage your reporting profile, revisit saved stations, and keep an eye on your contribution standing from one desktop-friendly control area.
                    </p>
                    <div className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                      FuelWatchPH v1.0
                    </div>
                  </div>

                  {isAuthenticated && (
                    <button
                      onClick={logout}
                      className="flex w-full items-center justify-center gap-3 rounded-2xl border border-rose-500/10 bg-rose-500/5 py-4 text-xs font-black uppercase tracking-widest text-rose-500 shadow-xl shadow-rose-500/5 transition-all hover:bg-rose-500 hover:text-white xl:min-h-[88px]"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  )}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
