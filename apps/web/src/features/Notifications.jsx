import { useNavigate } from "react-router";
import { ArrowLeft, TrendingDown, MapPin, CheckCircle, Bell } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";

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
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 pb-20">
      <div className="bg-emerald-600 pt-12 pb-8 px-6 relative overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-white flex items-center gap-2 font-bold">
            <ArrowLeft className="w-5 h-5" />
            Notifications
          </button>
          <button className="text-white/80 text-sm font-bold hover:text-white transition-colors">
            Mark all read
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {mockNotifications.length > 0 ? (
          <div className="space-y-4">
            {mockNotifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <div
                  key={notification.id}
                  className={`p-6 rounded-3xl border-2 transition-all cursor-pointer ${
                    notification.read 
                      ? "bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800" 
                      : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900"
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${notification.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${notification.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-foreground text-lg">{notification.title}</h3>
                        {!notification.read && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />}
                      </div>
                      <p className="text-muted-foreground font-medium mb-2">{notification.message}</p>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{notification.time}</span>
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
  );
}
