import { useNavigate } from "react-router";
import { ArrowLeft, TrendingDown, MapPin, CheckCircle, Bell } from "lucide-react";
import { EmptyState } from "../components/EmptyState";

const mockNotifications = [
  {
    id: "1",
    type: "price_drop",
    title: "Price Drop Alert",
    message: "Diesel at Petron Quezon Avenue dropped to ₱55.30",
    time: "5 mins ago",
    read: false,
    icon: TrendingDown,
    iconBg: "from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50",
    iconColor: "text-emerald-600 dark:text-emerald-500",
  },
  {
    id: "2",
    type: "new_station",
    title: "New Station Added",
    message: "Seaoil Timog is now available near you",
    time: "2 hours ago",
    read: false,
    icon: MapPin,
    iconBg: "from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "3",
    type: "verification",
    title: "Update Verified",
    message: "Your price update for Shell EDSA has been verified",
    time: "Yesterday",
    read: true,
    icon: CheckCircle,
    iconBg: "from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50",
    iconColor: "text-emerald-600 dark:text-emerald-500",
  },
];

export function Notifications() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 pb-20">
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
                className="w-12 h-12 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl shadow-black/20 hover:scale-110 transition-transform border-2 border-white/40"
              >
                <ArrowLeft className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              </button>
              <h1 className="text-3xl lg:text-4xl font-bold text-white drop-shadow-2xl tracking-tight">Notifications</h1>
            </div>
            {mockNotifications.length > 0 && (
              <button className="px-5 py-2.5 lg:px-6 lg:py-3 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full text-sm lg:text-base font-bold text-emerald-600 dark:text-emerald-400 shadow-xl shadow-black/20 hover:scale-105 transition-transform border-2 border-emerald-400/40">
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-4 lg:px-8 py-6 lg:py-10">
        <div className="max-w-6xl mx-auto">
        {mockNotifications.length > 0 ? (
          <div className="space-y-3 lg:space-y-4">
            {mockNotifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <div
                  key={notification.id}
                  className={`relative bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl lg:rounded-3xl border-2 p-6 lg:p-7 cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all ${
                    notification.read
                      ? "border-gray-200 dark:border-neutral-700 shadow-2xl shadow-black/10 hover:border-emerald-400/40"
                      : "border-emerald-400 ring-2 ring-emerald-500/30 shadow-2xl shadow-emerald-500/20"
                  }`}
                >
                  {!notification.read && (
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-2xl lg:rounded-3xl pointer-events-none" />
                  )}

                  <div className="relative z-10 flex items-start gap-4 lg:gap-5">
                    <div
                      className={`w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br ${notification.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}
                    >
                      <Icon className={`w-6 h-6 lg:w-7 lg:h-7 ${notification.iconColor}`} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-foreground text-base lg:text-lg">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-full flex-shrink-0 mt-1.5 shadow-lg shadow-emerald-500/40" />
                        )}
                      </div>
                      <p className="text-sm lg:text-base text-muted-foreground/90 mb-2 font-medium">
                        {notification.message}
                      </p>
                      <span className="text-xs lg:text-sm text-muted-foreground/70 font-semibold">
                        {notification.time}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="We'll notify you about price drops and station updates"
          />
        )}
        </div>
      </div>
    </div>
  );
}
