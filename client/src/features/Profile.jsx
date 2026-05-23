import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  UserPen,
  TrendingUp,
  Award,
  Trophy,
  Bell,
  ChevronRight,
  LogOut,
  FileText,
  HelpCircle,
  Heart,
  LogIn,
  UserPlus,
  User,
  Info,
  Lock,
  Compass,
  Sparkles,
  MapPinned,
  CheckCircle,
  Shield,
  ShieldCheck,
  CreditCard,
  History,
  Zap,
  Crown
} from "lucide-react";
import { useAuth } from "@/app/providers/AuthContext";
import { Button } from "@/shared/components/Button";
import { useMyContributions } from "@/hooks/usePrices";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { ProfileSkeleton } from "@/shared/components/Skeleton";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";

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
      <div className="min-h-screen bg-[#050A09] flex flex-col items-center justify-center">
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
    <div className="min-h-screen bg-[#050A09] text-white pb-24 overflow-x-hidden">
      
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
            className="absolute top-8 right-8 z-30 p-3 bg-[#0C1A17] border border-emerald-500/20 rounded-2xl text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-xl"
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
                 <div className="w-full h-full rounded-[2.2rem] bg-[#0C1A17] flex items-center justify-center overflow-hidden border border-white/10">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-emerald-500" />
                    )}
                 </div>
              </div>
              {isAuthenticated && (
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-1.5 rounded-full border-4 border-[#050A09] shadow-xl">
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
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                {isAuthenticated ? user?.email : "Guest Session"}
              </p>

              {isAuthenticated && (hasTrustedContributorBadge || isTopContributor) && (
                <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6 pt-2 w-full max-w-sm mx-auto px-4">
                  {hasTrustedContributorBadge && (
                    <div className="relative flex-1 flex items-center gap-3 rounded-full bg-[#0C1A17] border border-emerald-500/50 px-4 py-2.5 shadow-[0_0_20px_rgba(16,185,129,0.15)] overflow-hidden group">
                      {/* Lens flare effect */}
                      <div className="absolute top-0 left-6 w-8 h-[1px] bg-emerald-400 shadow-[0_0_10px_2px_#34d399]" />
                      <div className="absolute -top-1 left-8 w-1 h-1 rounded-full bg-white shadow-[0_0_8px_2px_#34d399]" />
                      
                      <div className="flex-shrink-0">
                        <ShieldCheck className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]">Trusted Contributor</span>
                        <span className="text-[9px] text-gray-300">Verified & reliable reporter</span>
                      </div>
                    </div>
                  )}
                  
                  {isTopContributor && (
                    <div className="relative flex-1 flex items-center gap-3 rounded-full bg-[#0C1A17] border border-amber-500/50 px-4 py-2.5 shadow-[0_0_20px_rgba(245,158,11,0.15)] overflow-visible group mt-2 sm:mt-0">
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
                        <span className="text-[9px] text-gray-300">Top 5% of community</span>
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
                  className="flex-1 bg-[#0C1A17] border border-emerald-500/20 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/5 transition-all"
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
               <div key={i} className="bg-[#0C1A17] border border-emerald-500/10 rounded-[2rem] p-4 text-center shadow-xl">
                  <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
                  <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-1">{s.label}</div>
               </div>
             ))}
          </motion.div>
        )}

        {/* Bio Section */}
        {isAuthenticated && user?.bio && (
          <Card className="bg-[#0C1A17] border-emerald-500/10 rounded-[2rem]">
             <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                   <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                   <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">About Me</span>
                </div>
                <p className="text-sm font-medium text-gray-300 leading-relaxed italic">
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
             <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4">
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
                 className="w-full flex items-center gap-4 bg-[#0C1A17] border border-emerald-500/5 hover:border-emerald-500/20 rounded-[2rem] p-5 transition-all group"
               >
                  <div className="p-3 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
                     <item.icon className="w-5 h-5 text-emerald-400 group-hover:text-white" />
                  </div>
                  <div className="flex-1 text-left">
                     <div className="text-sm font-black text-white">{item.label}</div>
                     <div className="text-[10px] font-bold text-gray-500">{item.sub}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
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
          <div className="bg-[#0C1A17] rounded-[2rem] p-6 border border-emerald-500/10 text-center">
             <Info className="w-8 h-8 text-emerald-500/20 mx-auto mb-3" />
             <p className="text-[11px] text-gray-500 font-bold leading-relaxed">
               Create an account to track your submissions, earn achievements, and help the community grow.
             </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-8">
           <div className="text-[10px] font-black text-gray-800 uppercase tracking-[0.3em]">
             FuelWatchPH v1.0
           </div>
        </div>
      </div>
    </div>
  );
}
