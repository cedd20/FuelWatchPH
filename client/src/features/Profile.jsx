import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Settings,
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
} from "lucide-react";
import { useAuth } from "@/app/providers/AuthContext";
import { Button } from "@/shared/components/Button";

import { useMyContributions } from "@/hooks/usePrices";
import { ProfileSkeleton } from "@/shared/components/Skeleton";

export function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, logout, refreshProfile } = useAuth();
  const { data: rawContributions = [], isLoading: contributionsLoading } = useMyContributions({
    enabled: isAuthenticated,
  });

  const stats = useMemo(() => {
    if (!isAuthenticated) return { total: 0, verified: 0, points: 0, accuracy: 0 };

    const total = rawContributions.length;
    const verified = rawContributions.filter(c =>
      c.status === "confirmed" || c.status === "approved"
    ).length;

    // Distinguish between price reports (submissions) and verifications
    const submissions = rawContributions.filter(c => !String(c.id).startsWith('conf-')).length;
    const confirmations = rawContributions.filter(c => String(c.id).startsWith('conf-')).length;

    // We don't have station count here easily, but we can use what's in user profile as a base or just stick to prices
    const karma = user?.karma || 0;
    const trustScore = user?.trustScore || 0;

    return { total, verified, karma, trustScore };
  }, [rawContributions, isAuthenticated, user?.total_stations, user?.karma, user?.trustScore]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshProfile();
    }
  }, [isAuthenticated]);

  if (loading || (isAuthenticated && contributionsLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
        <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-14 pb-10 px-4" />
        <ProfileSkeleton />
      </div>
    );
  }
  const publicMenuItems = [
    {
      icon: Compass,
      label: "Continue Browsing",
      subtitle: "Go back to the public app experience",
      onClick: () => navigate("/app/home"),
      badge: null,
    },
    {
      icon: Trophy,
      label: "Leaderboard",
      subtitle: "Top community contributors",
      onClick: () => navigate("/app/leaderboard"),
      badge: null,
    },
    {
      icon: Settings,
      label: "Settings",
      subtitle: "Preferences & app settings",
      onClick: () => navigate("/app/settings"),
      badge: null,
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      subtitle: "FAQs and contact",
      onClick: () => navigate("/app/support"),
      badge: null,
    },
    {
      icon: FileText,
      label: "Terms & Privacy",
      subtitle: "Legal information",
      onClick: () => navigate("/app/terms"),
      badge: null,
    },
  ];

  const lockedGuestFeatures = [
    {
      icon: TrendingUp,
      label: "My Contributions",
      subtitle: "Track your reports and contribution history",
    },
    {
      icon: Heart,
      label: "Saved Stations",
      subtitle: "Keep your favorite stations ready anytime",
    },

    {
      icon: Award,
      label: "Contributor Stats / Karma",
      subtitle: "See your trust score, achievements, and progress",
    },
    {
      icon: Settings,
      label: "Edit Profile",
      subtitle: "Personalize your profile and account details",
    },
  ];

  const userMenuItems = [
    {
      icon: TrendingUp,
      label: "My Contributions",
      subtitle: `${stats.total} contribution items`,
      onClick: () => navigate("/app/contributions"),
      badge: null,
    },
    {
      icon: Trophy,
      label: "Leaderboard",
      subtitle: "See top contributors",
      onClick: () => navigate("/app/leaderboard"),
      badge: null,
    },
    {
      icon: Heart,
      label: "Saved Stations",
      subtitle: "Quick access favorites",
      onClick: () => navigate("/app/saved"),
      badge: null,
    },

    {
      icon: Settings,
      label: "Settings",
      subtitle: "Preferences & account",
      onClick: () => navigate("/app/settings"),
      badge: null,
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      subtitle: "FAQs and contact",
      onClick: () => navigate("/app/support"),
      badge: null,
    },
    {
      icon: FileText,
      label: "Terms & Privacy",
      subtitle: "Legal information",
      onClick: () => navigate("/app/terms"),
      badge: null,
    },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 pb-24 lg:pb-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-12 pb-7 px-4 lg:px-8 lg:pt-14 lg:pb-9 relative overflow-hidden">
          {/* Enhanced radial glow background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl" />

          <div className="relative z-10 max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center mb-4 lg:mb-5 shadow-2xl border border-white/25">
                <User className="w-10 h-10 lg:w-12 lg:h-12 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl lg:text-4xl font-bold text-white mb-2 lg:mb-3 drop-shadow-2xl tracking-tight">Guest User</h2>
              <p className="text-white/95 text-sm lg:text-base font-medium max-w-2xl drop-shadow-lg leading-relaxed">
                Browse fuel prices, maps, compare results, and station details freely.
              </p>
              <p className="text-white/80 text-sm lg:text-base font-medium mt-2 max-w-2xl drop-shadow-lg leading-relaxed">
                Sign in when you're ready to save stations, track contributions, receive notifications, and earn Karma.
              </p>
              <div className="mt-5 lg:mt-6 flex w-full max-w-md flex-col sm:flex-row gap-2.5 lg:gap-3">
                <Button
                  onClick={() => navigate("/login")}
                  variant="secondary"
                  fullWidth
                  icon={LogIn}
                >
                  Sign In
                </Button>
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="w-full rounded-full border-2 border-white/60 bg-white/18 px-6 py-3.5 text-base font-bold text-white shadow-xl shadow-black/15 backdrop-blur-md transition-all hover:bg-white/28 hover:scale-[1.02]"
                >
                  <span className="flex items-center justify-center gap-2">
                    <UserPlus className="w-5 h-5" strokeWidth={2.5} />
                    Create Account
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 lg:px-8 -mt-5 lg:-mt-6 mb-5 lg:mb-6 relative z-10">
          <div className="max-w-6xl mx-auto bg-white/92 dark:bg-neutral-900/92 backdrop-blur-2xl rounded-[28px] shadow-2xl border border-white/40 dark:border-neutral-700/40 p-4 lg:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-100 dark:border-emerald-800/30 p-4 lg:p-5">
                <MapPinned className="w-6 h-6 lg:w-7 lg:h-7 text-emerald-600 dark:text-emerald-400 mb-2.5" strokeWidth={2.5} />
                <div className="font-bold text-foreground text-base lg:text-lg mb-1">Public Access</div>
                <div className="text-sm text-muted-foreground font-medium leading-relaxed">
                  Home, Map, Station Details, Compare Prices, Gas Price History, Search, and Filters stay available in guest mode.
                </div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-100 dark:border-amber-800/30 p-4 lg:p-5">
                <Sparkles className="w-6 h-6 lg:w-7 lg:h-7 text-amber-600 dark:text-amber-400 mb-2.5" strokeWidth={2.5} />
                <div className="font-bold text-foreground text-base lg:text-lg mb-1">Why Sign In</div>
                <div className="text-sm text-muted-foreground font-medium leading-relaxed">
                  Save favorites, follow your updates, and unlock account-based features when you want them.
                </div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/30 border border-sky-100 dark:border-sky-800/30 p-4 lg:p-5">
                <Compass className="w-6 h-6 lg:w-7 lg:h-7 text-sky-600 dark:text-sky-400 mb-2.5" strokeWidth={2.5} />
                <div className="font-bold text-foreground text-base lg:text-lg mb-1">No Forced Login</div>
                <div className="text-sm text-muted-foreground font-medium leading-relaxed">
                  Sign in only when you choose it or when you open a protected feature.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 lg:px-8 mb-6 lg:mb-8">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.02fr_0.98fr] gap-4 lg:gap-5 items-start">
            <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-3xl border-2 border-gray-200 dark:border-neutral-700 overflow-hidden shadow-2xl shadow-black/10">
              <div className="px-5 lg:px-6 pt-5 lg:pt-6 pb-3 border-b border-gray-100 dark:border-neutral-800">
                <h3 className="text-lg lg:text-2xl font-bold text-foreground tracking-tight">Browse as Guest</h3>
                <p className="text-sm lg:text-base text-muted-foreground font-medium mt-1">
                  These pages remain available without signing in.
                </p>
              </div>
              {publicMenuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 lg:gap-4 px-5 lg:px-6 py-4 lg:py-4.5 hover:bg-white/50 dark:hover:bg-neutral-800/50 transition-all border-b border-white/20 dark:border-neutral-700/30 last:border-b-0 group"
                >
                  <div className="w-10 h-10 lg:w-11 lg:h-11 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0">
                    <item.icon className="w-5 h-5 lg:w-5.5 lg:h-5.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-foreground text-sm lg:text-base">{item.label}</div>
                    <div className="text-xs lg:text-sm text-muted-foreground/80 font-medium leading-relaxed">{item.subtitle}</div>
                  </div>
                  <ChevronRight className="w-4.5 h-4.5 lg:w-5 lg:h-5 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0" strokeWidth={2.5} />
                </button>
              ))}
            </div>

            <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-3xl border-2 border-gray-200 dark:border-neutral-700 overflow-hidden shadow-2xl shadow-black/10">
              <div className="px-5 lg:px-6 pt-5 lg:pt-6 pb-3 border-b border-gray-100 dark:border-neutral-800">
                <h3 className="text-lg lg:text-2xl font-bold text-foreground tracking-tight">Protected Features</h3>
                <p className="text-sm lg:text-base text-muted-foreground font-medium mt-1">
                  These stay restricted until the user signs in.
                </p>
              </div>
              <div className="p-4 lg:p-5 space-y-2.5">
                {lockedGuestFeatures.map((feature) => (
                  <div
                    key={feature.label}
                    className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-200 dark:border-neutral-700 bg-gray-50/80 dark:bg-neutral-800/40 px-3.5 py-3.5 lg:px-4 lg:py-3.5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 flex items-center justify-center shrink-0">
                      <feature.icon className="w-4.5 h-4.5 text-muted-foreground" strokeWidth={2.3} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-foreground text-sm lg:text-base">{feature.label}</div>
                      <div className="text-xs lg:text-sm text-muted-foreground font-medium leading-relaxed">{feature.subtitle}</div>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 px-2.5 py-1 text-[11px] lg:text-xs font-bold text-muted-foreground shrink-0 self-start lg:self-center">
                      <Lock className="w-3 h-3" strokeWidth={2.5} />
                      <span className="hidden sm:inline">Sign in to access</span>
                      <span className="sm:hidden">Locked</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Version */}
        <div className="text-center text-sm text-muted-foreground/70 font-semibold pt-8 pb-6">
          Version 1.0.0
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-14 pb-10 px-4 lg:px-8 relative overflow-hidden">
        {/* Enhanced radial glow background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex items-start gap-4 lg:gap-6">
            <div className="w-24 h-24 lg:w-28 lg:h-28 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-white/30 overflow-hidden shrink-0">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl lg:text-4xl font-bold bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                  {user?.initials || "U"}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-1 drop-shadow-2xl tracking-tight">
                  {user?.username || user?.name || "User"}
                </h2>
                <button
                  onClick={() => navigate("/app/edit-profile")}
                  className="px-4 py-2 bg-white/20 backdrop-blur-xl rounded-full text-xs lg:text-sm font-bold text-white border border-white/30 hover:bg-white/30 transition-all flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Edit Profile
                </button>
              </div>
              <p className="text-white/95 text-sm lg:text-base font-medium mb-4 drop-shadow-lg">
                {user?.email || ""}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-1.5 lg:px-5 lg:py-2 bg-yellow-400/90 backdrop-blur-md rounded-full flex items-center gap-2 shadow-xl border border-yellow-300/50">
                  <Award className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-900" strokeWidth={2.5} />
                  <span className="text-xs lg:text-sm font-bold text-yellow-900">
                    Trusted Contributor
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-5 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 max-w-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors" />
            <div className="relative z-10">
              <h4 className="text-xs font-black text-white/50 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                <Info className="w-3 h-3" />
                Bio
              </h4>
              <p className={`text-sm lg:text-base font-medium leading-relaxed ${user?.bio ? "text-white/90" : "text-white/40 italic"}`}>
                {user?.bio || "No bio added yet. Click 'Edit Profile' to tell the community about yourself!"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 lg:px-8 -mt-8 mb-8">
        <div className="max-w-6xl mx-auto bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 dark:border-neutral-700/40 p-6 lg:p-8">
          <div className="grid grid-cols-3 divide-x divide-white/20 dark:divide-neutral-700/30">
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent mb-2 tracking-tight">{stats.total}</div>
              <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Updates</div>
            </div>
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2 tracking-tight">{stats.trustScore}%</div>
              <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Trust Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-br from-yellow-500 to-orange-500 bg-clip-text text-transparent mb-2 tracking-tight">{stats.karma}</div>
              <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Karma</div>
            </div>
          </div>
        </div>
      </div>
      {/* Menu Items */}
      <div className="px-4 lg:px-8 mb-8">
        <div className="max-w-6xl mx-auto bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-3xl border-2 border-gray-200 dark:border-neutral-700 overflow-hidden shadow-2xl shadow-black/10">
          <div className="lg:grid lg:grid-cols-2">
            {userMenuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className={`w-full flex items-center gap-4 lg:gap-5 p-5 lg:p-6 hover:bg-white/50 dark:hover:bg-neutral-800/50 transition-all border-b border-white/20 dark:border-neutral-700/30 ${index === userMenuItems.length - 1 || index === userMenuItems.length - 2
                  ? "last:border-b-0 lg:border-b-0"
                  : ""
                  } ${index % 2 === 0 ? "lg:border-r lg:border-white/20 lg:dark:border-neutral-700/30" : ""} group`}
              >
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <item.icon className="w-6 h-6 lg:w-7 lg:h-7 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-foreground text-base lg:text-lg">{item.label}</div>
                  <div className="text-sm lg:text-base text-muted-foreground/80 font-medium">{item.subtitle}</div>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-xs lg:text-sm font-bold text-white">
                        {item.badge}
                      </span>
                    </div>
                  )}
                  <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-muted-foreground group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 lg:px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3.5 lg:py-4 text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-2xl transition-all"
          >
            <LogOut className="w-5 h-5 lg:w-6 lg:h-6" strokeWidth={2.5} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Version */}
      <div className="text-center text-sm text-muted-foreground/70 font-semibold pb-6">
        Version 1.0.0
      </div>
    </div>
  );
}
