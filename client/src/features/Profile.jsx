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

  return (
    <div className="app-shell min-h-screen overflow-x-hidden pb-24 text-foreground">
      
      {/* Premium Header */}
      <div className="relative pt-12 pb-24 px-6 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        {/* Settings/Edit Action */}
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

        <div className="max-w-md mx-auto relative z-10 flex flex-col items-center text-center">
           <motion.div 
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="relative mb-6"
           >
              <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-teal-600 p-1 shadow-2xl shadow-emerald-500/20">
                 <div className="app-panel-strong flex h-full w-full items-center justify-center overflow-hidden rounded-[2.2rem] border border-white/10">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-emerald-500" />
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
             className="space-y-1 flex flex-col items-center"
           >
              <h1 className="text-3xl font-black tracking-tight">
                {isAuthenticated ? (user?.username || user?.name) : "Tankmate"}
              </h1>
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                {isAuthenticated ? user?.email : "Guest Session"}
              </p>

              {isAuthenticated && (hasTrustedContributorBadge || isTopContributor) && (
                <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6 pt-2 w-full max-w-sm mx-auto px-4">
                  {hasTrustedContributorBadge && (
                    <div className="app-panel relative flex flex-1 items-center gap-3 overflow-hidden rounded-full border border-emerald-500/50 px-4 py-2.5 shadow-[0_0_20px_rgba(16,185,129,0.15)] group">
                      {/* Lens flare effect */}
                      <div className="absolute top-0 left-6 w-8 h-[1px] bg-emerald-400 shadow-[0_0_10px_2px_#34d399]" />
                      <div className="absolute -top-1 left-8 w-1 h-1 rounded-full bg-white shadow-[0_0_8px_2px_#34d399]" />
                      
                      <div className="flex-shrink-0">
                        <ShieldCheck className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]">Trusted Contributor</span>
                        <span className="text-[9px] text-muted-foreground">Verified & reliable reporter</span>
                      </div>
                    </div>
                  )}
                  
                  {isTopContributor && (
                    <div className="app-panel relative mt-2 flex flex-1 items-center gap-3 overflow-visible rounded-full border border-amber-500/50 px-4 py-2.5 shadow-[0_0_20px_rgba(245,158,11,0.15)] group sm:mt-0">
                      {/* Floating Crown */}
                      <div className="absolute -top-4 right-1/4 translate-x-1/2">
                        <Crown className="w-5 h-5 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                      </div>
                      
                      {/* Lens flare effect */}
                      <div className="absolute top-0 right-1/4 w-8 h-[1px] bg-amber-400 shadow-[0_0_10px_2px_#fbbf24]" />
                      
                      <div className="flex-shrink-0">
                        <Trophy className="w-8 h-8 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-400 drop-shadow-[0_0_4px_rgba(245,158,11,0.3)]">Top Contributor</span>
                        <span className="text-[9px] text-muted-foreground">Top 5% of community</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
           </motion.div>

           {!isAuthenticated && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.4 }}
               className="mt-8 flex gap-3 w-full"
             >
                <button 
                  onClick={() => navigate("/login")}
                  className="flex-1 bg-emerald-500 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-all"
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

      <div className="max-w-md mx-auto px-6 -mt-16 space-y-6 relative z-20">
        
        {/* Stats Grid */}
        {isAuthenticated && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-3"
          >
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

        {/* Bio Section */}
        {isAuthenticated && user?.bio && (
          <Card className="app-panel rounded-[2rem] border-emerald-500/10">
             <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                   <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">About Me</span>
                </div>
                <p className="text-sm font-medium italic leading-relaxed text-[var(--app-text-soft)]">
                  "{user.bio}"
                </p>
             </CardContent>
          </Card>
        )}

        {/* Menu Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          <div className="px-2">
             <h3 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
               {isAuthenticated ? "Menu" : "Quick Access"}
             </h3>
          </div>
          
          <div className="grid gap-3">
             {filteredMenu.map((item, idx) => (
               <motion.button
                 key={idx}
                 variants={itemVariants}
                 whileHover={{ x: 4 }}
                 onClick={() => navigate(item.path)}
                 className="app-panel group flex w-full items-center gap-4 rounded-[2rem] border border-emerald-500/5 p-5 transition-all hover:border-emerald-500/20"
               >
                  <div className="p-3 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
                     <item.icon className="w-5 h-5 text-emerald-400 group-hover:text-white" />
                  </div>
                  <div className="flex-1 text-left">
                     <div className="text-sm font-black text-foreground">{item.label}</div>
                     <div className="text-[10px] font-bold text-muted-foreground">{item.sub}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-emerald-500" />
               </motion.button>
             ))}
          </div>
        </motion.div>

        {/* Account Actions */}
        {isAuthenticated ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-4"
          >
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-3 py-4 bg-rose-500/5 text-rose-500 rounded-2xl font-black text-xs uppercase tracking-widest border border-rose-500/10 hover:bg-rose-500 hover:text-white transition-all shadow-xl shadow-rose-500/5"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </motion.div>
        ) : (
          <div className="app-panel rounded-[2rem] border border-emerald-500/10 p-6 text-center">
             <Info className="w-8 h-8 text-emerald-500/20 mx-auto mb-3" />
             <p className="text-[11px] font-bold leading-relaxed text-muted-foreground">
               Create an account to track your submissions, earn achievements, and help the community grow.
             </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-8">
           <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
             FuelWatchPH v1.0
           </div>
        </div>
      </div>
    </div>
  );
}
