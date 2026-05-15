import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Bell, MapPin, Fuel, Globe, Moon, ChevronDown } from "lucide-react";
import { useTheme } from "@/app/providers/ThemeContext";

export function Settings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    priceAlerts: true,
    nearbyStations: true,
    weeklyDigest: false,
  });
  const [defaultFuelType, setDefaultFuelType] = useState("UL91");
  const [radius, setRadius] = useState("5");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-950 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-12 pb-8 px-4 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex items-center gap-3 max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-white dark:bg-neutral-800 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl shadow-black/20 hover:scale-110 transition-transform border-2 border-white/40 dark:border-neutral-700/50"
          >
            <ArrowLeft className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
          </button>
          <h1 className="text-3xl lg:text-4xl font-bold text-white drop-shadow-2xl tracking-tight">Settings</h1>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6 lg:py-10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 lg:gap-10">
          {/* Notifications */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2 px-1">
              <div className="w-11 h-11 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center shadow-lg border border-emerald-200/50 dark:border-emerald-500/20">
                <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">Notifications</h3>
            </div>
            <div className="bg-white dark:bg-neutral-800/50 backdrop-blur-xl rounded-3xl border-2 border-gray-100 dark:border-neutral-700/40 p-2 shadow-2xl shadow-black/5">
              {Object.entries(notifications).map(([key, value], index) => (
                <div key={key} className={`flex items-center justify-between p-6 lg:p-7 ${index < 2 ? "border-b border-gray-50 dark:border-neutral-700/30" : ""}`}>
                  <div>
                    <div className="font-bold text-foreground text-base lg:text-lg capitalize tracking-tight">{key.replace(/([A-Z])/g, ' $1')}</div>
                    <div className="text-sm text-muted-foreground font-medium">Receive updates for {key}</div>
                  </div>
                  <label className="relative inline-block w-14 h-7 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-200 dark:bg-neutral-700 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-600 transition-all shadow-inner"></div>
                    <div className="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-all peer-checked:translate-x-7 shadow-md"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-8 mt-8 lg:mt-0">
             <div className="flex items-center gap-3 mb-2 px-1">
              <div className="w-11 h-11 bg-amber-100 dark:bg-amber-500/10 rounded-xl flex items-center justify-center shadow-lg border border-amber-200/50 dark:border-amber-500/20">
                <Fuel className="w-5 h-5 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">Preferences</h3>
            </div>
            
            <div className="bg-white dark:bg-neutral-800/50 backdrop-blur-xl rounded-3xl border-2 border-gray-100 dark:border-neutral-700/40 p-7 lg:p-8 shadow-2xl shadow-black/5 space-y-6">
              <div>
                <label className="block text-xs font-black text-muted-foreground mb-3 uppercase tracking-widest pl-1">Default Fuel Type</label>
                <div className="relative">
                  <select value={defaultFuelType} onChange={(e) => setDefaultFuelType(e.target.value)} className="w-full p-4 lg:p-5 bg-gray-50 dark:bg-neutral-800 rounded-2xl border-2 border-transparent focus:border-emerald-500/30 dark:focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/10 text-foreground font-bold transition-all appearance-none cursor-pointer">
                    <option>UL91</option>
                    <option>PR95</option>
                    <option>PR97</option>
                    <option>DSL</option>
                    <option>PDSL</option>
                    <option>Kerosene</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-muted-foreground mb-3 uppercase tracking-widest pl-1">Search Radius</label>
                <div className="relative">
                  <select value={radius} onChange={(e) => setRadius(e.target.value)} className="w-full p-4 lg:p-5 bg-gray-50 dark:bg-neutral-800 rounded-2xl border-2 border-transparent focus:border-emerald-500/30 dark:focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/10 text-foreground font-bold transition-all appearance-none cursor-pointer">
                    <option value="5">5 km</option>
                    <option value="10">10 km</option>
                    <option value="20">20 km</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className="bg-white dark:bg-neutral-800/50 backdrop-blur-xl rounded-3xl border-2 border-gray-100 dark:border-neutral-700/40 p-7 lg:p-8 shadow-2xl shadow-black/5 flex items-center justify-between group hover:border-emerald-400/40 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-700 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/10 transition-colors">
                  <Moon className="w-6 h-6 text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                </div>
                <div>
                  <div className="font-bold text-foreground text-base lg:text-lg tracking-tight">Dark Mode</div>
                  <div className="text-sm text-muted-foreground font-medium">Adjust display for night</div>
                </div>
              </div>
              <label className="relative inline-block w-14 h-7 cursor-pointer">
                <input type="checkbox" checked={theme === "dark"} onChange={toggleTheme} className="sr-only peer" />
                <div className="w-14 h-7 bg-gray-200 dark:bg-neutral-700 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-600 transition-all shadow-inner"></div>
                <div className="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-all peer-checked:translate-x-7 shadow-md"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
