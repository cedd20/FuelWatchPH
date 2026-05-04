import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Settings,
  TrendingUp,
  ShieldCheck,
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
} from "lucide-react";
import { useAuth } from "@/app/providers/AuthContext";
import { Button } from "@/shared/components/Button";
import { useNotifications } from "@/hooks/useUsers";
import { useMyContributions } from "@/hooks/usePrices";

export function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, refreshProfile } = useAuth();
  const { data: notifications = [] } = useNotifications({ enabled: isAuthenticated });
  const { data: rawContributions = [] } = useMyContributions();
  const unreadCount = notifications.filter(n => !n.is_read).length;

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
    // Let's use the same point logic as backend: 10 per report, 5 per confirmation
    // Note: Station creations are +20 but they aren't in the contributions list yet
    const points = (submissions * 10) + (confirmations * 5) + ((user?.total_stations || 0) * 20);
    const accuracy = total > 0 ? Math.round((verified / total) * 100) : 0;

    return { total, verified, points, accuracy };
  }, [rawContributions, isAuthenticated, user?.total_stations]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshProfile();
    }
  }, [isAuthenticated]);

  const guestMenuItems = [
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
      icon: Bell,
      label: "Notifications",
      subtitle: "Price alerts & updates",
      onClick: () => navigate("/app/notifications"),
      badge: unreadCount > 0 ? unreadCount.toString() : null,
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-14 pb-10 px-4 lg:px-8 relative overflow-hidden">
          {/* Enhanced radial glow background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl" />

          <div className="relative z-10 flex flex-col items-center text-center max-w-6xl mx-auto">
            <div className="w-24 h-24 lg:w-28 lg:h-28 bg-white/25 backdrop-blur-lg rounded-full flex items-center justify-center mb-5 shadow-2xl border border-white/30">
              <User className="w-12 h-12 lg:w-14 lg:h-14 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3 drop-shadow-2xl tracking-tight">Guest User</h2>
            <p className="text-white/95 text-sm lg:text-base font-medium mb-8 max-w-sm drop-shadow-lg">
              Sign in to contribute updates and help keep fuel prices accurate
            </p>
            <div className="flex gap-3 w-full max-w-xs lg:max-w-md">
              <Button
                onClick={() => navigate("/login")}
                variant="secondary"
                fullWidth
                icon={LogIn}
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate("/signup")}
                variant="primary"
                fullWidth
                icon={UserPlus}
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="px-4 lg:px-8 mt-8">
          <div className="max-w-3xl mx-auto bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-3xl border-2 border-gray-200 dark:border-neutral-700 overflow-hidden shadow-2xl shadow-black/10">
            {guestMenuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full flex items-center gap-4 lg:gap-5 p-5 lg:p-6 hover:bg-white/50 dark:hover:bg-neutral-800/50 transition-all border-b border-white/20 dark:border-neutral-700/30 last:border-b-0 group"
              >
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <item.icon className="w-6 h-6 lg:w-7 lg:h-7 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-foreground text-base lg:text-lg">{item.label}</div>
                  <div className="text-sm lg:text-base text-muted-foreground/80 font-medium">{item.subtitle}</div>
                </div>
                <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6 text-muted-foreground group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
              </button>
            ))}
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900">
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

          <div className="mt-8 p-5 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 max-w-2xl relative overflow-hidden group">
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
              <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2 tracking-tight">{stats.accuracy}%</div>
              <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold bg-gradient-to-br from-yellow-500 to-orange-500 bg-clip-text text-transparent mb-2 tracking-tight">{stats.points}</div>
              <div className="text-xs lg:text-sm text-muted-foreground font-semibold">Points</div>
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
