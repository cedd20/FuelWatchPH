import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Bell, MapPin, Fuel, Globe, Moon } from "lucide-react";
import { useTheme } from "@/app/providers/ThemeContext";

export function Settings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    priceAlerts: true,
    nearbyStations: true,
    weeklyDigest: false,
  });
  const [defaultFuelType, setDefaultFuelType] = useState("Diesel");
  const [radius, setRadius] = useState("5");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-12 pb-8 px-4 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex items-center gap-3 max-w-6xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl shadow-black/20 hover:scale-110 transition-transform border-2 border-white/40"
          >
            <ArrowLeft className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
          </button>
          <h1 className="text-3xl lg:text-4xl font-bold text-white drop-shadow-2xl tracking-tight">Settings</h1>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6 lg:py-10">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 lg:gap-8">
          {/* Notifications */}
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center shadow-md">
                <Bell className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Notifications</h3>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-gray-100 dark:border-neutral-800 p-2 shadow-xl">
              {Object.entries(notifications).map(([key, value], index) => (
                <div key={key} className={`flex items-center justify-between p-6 ${index < 2 ? "border-b border-gray-50 dark:border-neutral-800" : ""}`}>
                  <div>
                    <div className="font-bold text-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                    <div className="text-sm text-muted-foreground">Receive updates for {key}</div>
                  </div>
                  <label className="relative inline-block w-12 h-6 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-gray-200 dark:bg-neutral-700 rounded-full peer peer-checked:bg-emerald-600 transition-all"></div>
                    <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all peer-checked:translate-x-6"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-6 mt-8 lg:mt-0">
             <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950/30 rounded-xl flex items-center justify-center shadow-md">
                <Fuel className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Preferences</h3>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-gray-100 dark:border-neutral-800 p-6 shadow-xl space-y-4">
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-2">DEFAULT FUEL TYPE</label>
                <select value={defaultFuelType} onChange={(e) => setDefaultFuelType(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl border-none focus:ring-2 focus:ring-emerald-500/20 text-foreground font-bold">
                  <option>Diesel</option>
                  <option>Gasoline 91</option>
                  <option>Gasoline 95</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-2">SEARCH RADIUS</label>
                <select value={radius} onChange={(e) => setRadius(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl border-none focus:ring-2 focus:ring-emerald-500/20 text-foreground font-bold">
                  <option value="5">5 km</option>
                  <option value="10">10 km</option>
                  <option value="20">20 km</option>
                </select>
              </div>
            </div>

            {/* Appearance */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-gray-100 dark:border-neutral-800 p-6 shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-foreground" />
                <div>
                  <div className="font-bold text-foreground">Dark Mode</div>
                  <div className="text-sm text-muted-foreground">Adjust display for night</div>
                </div>
              </div>
              <label className="relative inline-block w-12 h-6 cursor-pointer">
                <input type="checkbox" checked={theme === "dark"} onChange={toggleTheme} className="sr-only peer" />
                <div className="w-12 h-6 bg-gray-200 dark:bg-neutral-700 rounded-full peer peer-checked:bg-emerald-600 transition-all"></div>
                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all peer-checked:translate-x-6"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
