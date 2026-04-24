import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, TrendingDown, MapPin, CheckCircle, Bell, Loader2 } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";

const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    type: "price_drop",
    title: "Price Drop Alert",
    message: "Diesel at Petron Quezon Avenue dropped to ₱55.30",
    time: "5 mins ago",
    read: false,
    icon: TrendingDown,
    iconBg: "from-emerald-500/10 to-teal-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "2",
    type: "new_station",
    title: "New Station Added",
    message: "Seaoil Timog is now available near you",
    time: "2 hours ago",
    read: false,
    icon: MapPin,
    iconBg: "from-blue-500/10 to-indigo-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "3",
    type: "verification",
    title: "Update Verified",
    message: "Your price update for Shell EDSA has been verified",
    time: "Yesterday",
    read: true,
    icon: CheckCircle,
    iconBg: "from-amber-500/10 to-orange-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
];

export function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API Fetch: GET /api/user/notifications
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
        setNotifications(MOCK_NOTIFICATIONS);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Checking for updates...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-950 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-12 pb-8 px-4 lg:px-8 relative overflow-hidden">
        {/* Enhanced radial glow background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4 lg:mb-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="w-11 h-11 lg:w-12 lg:h-12 bg-white dark:bg-neutral-800 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl shadow-black/20 hover:scale-110 transition-transform border-2 border-white/40 dark:border-neutral-700/50"
              >
                <ArrowLeft className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              </button>
              <h1 className="text-2xl lg:text-4xl font-bold text-white drop-shadow-2xl tracking-tight">Notifications</h1>
            </div>
            {notifications.some(n => !n.read) && (
              <button 
                onClick={markAllRead}
                className="px-5 py-2.5 lg:px-6 lg:py-3 bg-white dark:bg-neutral-800 backdrop-blur-xl rounded-full text-xs lg:text-base font-bold text-emerald-600 dark:text-emerald-400 shadow-xl shadow-black/20 hover:scale-105 transition-transform border-2 border-white/40 dark:border-neutral-700/50"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-4 lg:px-8 py-6 lg:py-10">
        <div className="max-w-6xl mx-auto">
        {notifications.length > 0 ? (
          <div className="space-y-4 lg:space-y-6">
            {notifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`relative bg-white dark:bg-neutral-800/40 backdrop-blur-3xl rounded-3xl border-2 p-6 lg:p-8 cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all group ${
                    notification.read
                      ? "border-gray-100 dark:border-neutral-800/50 shadow-xl shadow-black/5"
                      : "border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-950/5 shadow-2xl shadow-emerald-500/10 ring-1 ring-emerald-500/10"
                  }`}
                >
                  <div className="relative z-10 flex items-start gap-5 lg:gap-7">
                    <div
                      className={`w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br ${notification.iconBg} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}
                    >
                      <Icon className={`w-6 h-6 lg:w-8 lg:h-8 ${notification.iconColor}`} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className={`font-bold text-base lg:text-xl tracking-tight transition-colors ${
                          notification.read ? "text-foreground" : "text-emerald-600 dark:text-emerald-400"
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div className="w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-full flex-shrink-0 mt-1.5 shadow-lg shadow-emerald-500/40 ring-2 ring-white dark:ring-neutral-800" />
                        )}
                      </div>
                      <p className="text-sm lg:text-lg text-muted-foreground/90 mb-3 font-medium leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-muted-foreground/50">
                          {notification.time}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="pt-20">
            <EmptyState
              icon={Bell}
              title="No notifications yet"
              description="Stay tuned! We'll notify you about price drops, new stations, and when your updates are verified."
            />
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
