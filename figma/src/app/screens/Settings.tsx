import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Bell, MapPin, Fuel, Globe, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export function Settings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    priceAlerts: true,
    nearbyStations: false,
    weeklyDigest: true,
  });
  const [defaultFuelType, setDefaultFuelType] = useState("Diesel");
  const [radius, setRadius] = useState("5");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-12 pb-8 px-4 lg:px-8 relative overflow-hidden">
        {/* Enhanced radial glow background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl" />

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

      {/* Settings Sections */}
      <div className="px-4 lg:px-8 py-6 lg:py-10">
        <div className="max-w-6xl mx-auto">
          {/* Mobile Layout - Stack all sections */}
          <div className="lg:hidden space-y-6">
            {/* Notifications */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-xl flex items-center justify-center shadow-lg">
                  <Bell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-bold text-foreground tracking-tight">Notifications</h3>
              </div>
              <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl border-2 border-gray-200 dark:border-neutral-700 overflow-hidden shadow-2xl shadow-black/10">
                {[
                  {
                    key: "priceAlerts",
                    label: "Price Drop Alerts",
                    description: "Get notified when nearby prices drop",
                  },
                  {
                    key: "nearbyStations",
                    label: "New Nearby Stations",
                    description: "Alert when new stations are added near you",
                  },
                  {
                    key: "weeklyDigest",
                    label: "Weekly Summary",
                    description: "Receive weekly fuel price trends",
                  },
                ].map((item, index) => (
                  <div
                    key={item.key}
                    className={`flex items-center justify-between p-6 ${
                      index < 2 ? "border-b border-white/20 dark:border-neutral-700/30" : ""
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-bold text-foreground mb-1 text-base">
                        {item.label}
                      </div>
                      <div className="text-sm text-muted-foreground/80 font-medium">
                        {item.description}
                      </div>
                    </div>
                    <label className="relative inline-block w-14 h-7">
                      <input
                        type="checkbox"
                        checked={
                          notifications[item.key as keyof typeof notifications]
                        }
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            [item.key]: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-200 dark:bg-neutral-700 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-emerald-600 peer-checked:via-green-600 peer-checked:to-teal-600 transition-all cursor-pointer shadow-inner"></div>
                      <div className="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-7 shadow-lg"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-cyan-100 to-sky-100 dark:from-cyan-950/50 dark:to-sky-950/50 rounded-xl flex items-center justify-center shadow-lg">
                  <MapPin className="w-5 h-5 text-cyan-600 dark:text-cyan-400" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-bold text-foreground tracking-tight">Location</h3>
              </div>
              <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl border-2 border-gray-200 dark:border-neutral-700 p-6 shadow-2xl shadow-black/10">
                <label className="block mb-4">
                  <span className="font-bold text-foreground mb-2 block text-base">
                    Search Radius
                  </span>
                  <select
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-xl rounded-xl border border-white/60 dark:border-neutral-700/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 shadow-lg text-foreground font-semibold transition-all"
                  >
                    <option value="2">2 km</option>
                    <option value="5">5 km</option>
                    <option value="10">10 km</option>
                    <option value="15">15 km</option>
                    <option value="20">20 km</option>
                  </select>
                </label>
                <button className="text-sm font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                  Update Location Permissions
                </button>
              </div>
            </div>

            {/* Fuel Preferences */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/50 dark:to-orange-950/50 rounded-xl flex items-center justify-center shadow-lg">
                  <Fuel className="w-5 h-5 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-bold text-foreground tracking-tight">Fuel Preferences</h3>
              </div>
              <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl border-2 border-gray-200 dark:border-neutral-700 p-6 shadow-2xl shadow-black/10">
                <label className="block">
                  <span className="font-bold text-foreground mb-2 block text-base">
                    Default Fuel Type
                  </span>
                  <select
                    value={defaultFuelType}
                    onChange={(e) => setDefaultFuelType(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-xl rounded-xl border border-white/60 dark:border-neutral-700/60 focus:outline-none focus:ring-2 focus:ring-amber-500/40 shadow-lg text-foreground font-semibold transition-all"
                  >
                    <option value="Gasoline 91">Gasoline 91</option>
                    <option value="Gasoline 95">Gasoline 95</option>
                    <option value="Gasoline 97">Gasoline 97</option>
                    <option value="Diesel">Diesel</option>
                  </select>
                </label>
              </div>
            </div>

            {/* App Settings */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-xl flex items-center justify-center shadow-lg">
                  <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-bold text-foreground tracking-tight">App Settings</h3>
              </div>
              <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl border-2 border-gray-200 dark:border-neutral-700 overflow-hidden shadow-2xl shadow-black/10">
                <div className="flex items-center justify-between p-6 border-b border-white/20 dark:border-neutral-700/30">
                  <div className="flex items-center gap-3">
                    <Moon className="w-5 h-5 text-foreground" strokeWidth={2.5} />
                    <div className="flex-1">
                      <div className="font-bold text-foreground mb-1 text-base">
                        Dark Mode
                      </div>
                      <div className="text-sm text-muted-foreground/80 font-medium">
                        Reduce eye strain at night
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-block w-14 h-7">
                    <input
                      type="checkbox"
                      checked={theme === "dark"}
                      onChange={toggleTheme}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-gray-200 dark:bg-neutral-700 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-emerald-600 peer-checked:via-green-600 peer-checked:to-teal-600 transition-all cursor-pointer shadow-inner"></div>
                    <div className="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-7 shadow-lg"></div>
                  </label>
                </div>
                <button className="w-full text-left p-6 border-b border-white/20 dark:border-neutral-700/30 hover:bg-white/50 dark:hover:bg-neutral-800/50 transition-all">
                  <div className="font-bold text-foreground mb-1 text-base">Language</div>
                  <div className="text-sm text-muted-foreground/80 font-medium">English</div>
                </button>
                <button className="w-full text-left p-6 hover:bg-white/50 dark:hover:bg-neutral-800/50 transition-all">
                  <div className="font-bold text-foreground mb-1 text-base">
                    Distance Unit
                  </div>
                  <div className="text-sm text-muted-foreground/80 font-medium">Kilometers</div>
                </button>
              </div>
            </div>

            {/* Account */}
            <div>
              <h3 className="text-lg font-bold text-foreground mb-4 tracking-tight">Account</h3>
              <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl border-2 border-gray-200 dark:border-neutral-700 overflow-hidden shadow-2xl shadow-black/10">
                <button className="w-full text-left p-6 border-b border-white/20 dark:border-neutral-700/30 hover:bg-white/50 dark:hover:bg-neutral-800/50 transition-all">
                  <div className="font-bold text-foreground text-base">Edit Profile</div>
                </button>
                <button className="w-full text-left p-6 border-b border-white/20 dark:border-neutral-700/30 hover:bg-white/50 dark:hover:bg-neutral-800/50 transition-all">
                  <div className="font-bold text-foreground text-base">Change Password</div>
                </button>
                <button className="w-full text-left p-6 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all">
                  <div className="font-bold text-rose-600 dark:text-rose-400 text-base">Delete Account</div>
                </button>
              </div>
            </div>
          </div>

          {/* Desktop 2-Column Grid Layout */}
          <div className="hidden lg:grid lg:grid-cols-2 lg:gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Notifications */}
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-xl flex items-center justify-center shadow-lg">
                    <Bell className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground tracking-tight">Notifications</h3>
                </div>
                <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl border-2 border-gray-200 dark:border-neutral-700 overflow-hidden shadow-2xl shadow-black/10">
                  {[
                    {
                      key: "priceAlerts",
                      label: "Price Drop Alerts",
                      description: "Get notified when nearby prices drop",
                    },
                    {
                      key: "nearbyStations",
                      label: "New Nearby Stations",
                      description: "Alert when new stations are added near you",
                    },
                    {
                      key: "weeklyDigest",
                      label: "Weekly Summary",
                      description: "Receive weekly fuel price trends",
                    },
                  ].map((item, index) => (
                    <div
                      key={item.key}
                      className={`flex items-center justify-between p-7 hover:bg-white/50 dark:hover:bg-neutral-800/50 transition-colors ${
                        index < 2 ? "border-b border-white/20 dark:border-neutral-700/30" : ""
                      }`}
                    >
                      <div className="flex-1 pr-4">
                        <div className="font-bold text-foreground mb-1 text-lg">
                          {item.label}
                        </div>
                        <div className="text-base text-muted-foreground/80 font-medium">
                          {item.description}
                        </div>
                      </div>
                      <label className="relative inline-block w-14 h-7 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={
                            notifications[item.key as keyof typeof notifications]
                          }
                          onChange={(e) =>
                            setNotifications({
                              ...notifications,
                              [item.key]: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-gray-200 dark:bg-neutral-700 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-emerald-600 peer-checked:via-green-600 peer-checked:to-teal-600 transition-all cursor-pointer shadow-inner"></div>
                        <div className="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-7 shadow-lg"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fuel Preferences */}
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/50 dark:to-orange-950/50 rounded-xl flex items-center justify-center shadow-lg">
                    <Fuel className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground tracking-tight">Fuel Preferences</h3>
                </div>
                <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl border-2 border-gray-200 dark:border-neutral-700 p-7 shadow-2xl shadow-black/10">
                  <label className="block">
                    <span className="font-bold text-foreground mb-3 block text-lg">
                      Default Fuel Type
                    </span>
                    <select
                      value={defaultFuelType}
                      onChange={(e) => setDefaultFuelType(e.target.value)}
                      className="w-full px-5 py-4 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-xl rounded-xl border-2 border-white/60 dark:border-neutral-700/60 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 shadow-lg text-foreground font-semibold transition-all text-base"
                    >
                      <option value="Gasoline 91">Gasoline 91</option>
                      <option value="Gasoline 95">Gasoline 95</option>
                      <option value="Gasoline 97">Gasoline 97</option>
                      <option value="Diesel">Diesel</option>
                    </select>
                  </label>
                </div>
              </div>

              {/* Account */}
              <div>
                <h3 className="text-xl font-bold text-foreground mb-4 tracking-tight">Account</h3>
                <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl border-2 border-gray-200 dark:border-neutral-700 overflow-hidden shadow-2xl shadow-black/10">
                  <button className="w-full text-left p-7 border-b border-white/20 dark:border-neutral-700/30 hover:bg-white/50 dark:hover:bg-neutral-800/50 transition-all">
                    <div className="font-bold text-foreground text-lg">Edit Profile</div>
                  </button>
                  <button className="w-full text-left p-7 border-b border-white/20 dark:border-neutral-700/30 hover:bg-white/50 dark:hover:bg-neutral-800/50 transition-all">
                    <div className="font-bold text-foreground text-lg">Change Password</div>
                  </button>
                  <button className="w-full text-left p-7 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all">
                    <div className="font-bold text-rose-600 dark:text-rose-400 text-lg">Delete Account</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Location */}
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-100 to-sky-100 dark:from-cyan-950/50 dark:to-sky-950/50 rounded-xl flex items-center justify-center shadow-lg">
                    <MapPin className="w-6 h-6 text-cyan-600 dark:text-cyan-400" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground tracking-tight">Location</h3>
                </div>
                <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl border-2 border-gray-200 dark:border-neutral-700 p-7 shadow-2xl shadow-black/10">
                  <label className="block mb-5">
                    <span className="font-bold text-foreground mb-3 block text-lg">
                      Search Radius
                    </span>
                    <select
                      value={radius}
                      onChange={(e) => setRadius(e.target.value)}
                      className="w-full px-5 py-4 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-xl rounded-xl border-2 border-white/60 dark:border-neutral-700/60 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 shadow-lg text-foreground font-semibold transition-all text-base"
                    >
                      <option value="2">2 km</option>
                      <option value="5">5 km</option>
                      <option value="10">10 km</option>
                      <option value="15">15 km</option>
                      <option value="20">20 km</option>
                    </select>
                  </label>
                  <button className="text-base font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                    Update Location Permissions
                  </button>
                </div>
              </div>

              {/* App Settings */}
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-xl flex items-center justify-center shadow-lg">
                    <Globe className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground tracking-tight">App Settings</h3>
                </div>
                <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl border-2 border-gray-200 dark:border-neutral-700 overflow-hidden shadow-2xl shadow-black/10">
                  <div className="flex items-center justify-between p-7 border-b border-white/20 dark:border-neutral-700/30 hover:bg-white/50 dark:hover:bg-neutral-800/50 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <Moon className="w-6 h-6 text-foreground" strokeWidth={2.5} />
                      <div className="flex-1">
                        <div className="font-bold text-foreground mb-1 text-lg">
                          Dark Mode
                        </div>
                        <div className="text-base text-muted-foreground/80 font-medium">
                          Reduce eye strain at night
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-block w-14 h-7 flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={theme === "dark"}
                        onChange={toggleTheme}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-200 dark:bg-neutral-700 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-emerald-600 peer-checked:via-green-600 peer-checked:to-teal-600 transition-all cursor-pointer shadow-inner"></div>
                      <div className="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-7 shadow-lg"></div>
                    </label>
                  </div>
                  <button className="w-full text-left p-7 border-b border-white/20 dark:border-neutral-700/30 hover:bg-white/50 dark:hover:bg-neutral-800/50 transition-all">
                    <div className="font-bold text-foreground mb-1 text-lg">Language</div>
                    <div className="text-base text-muted-foreground/80 font-medium">English</div>
                  </button>
                  <button className="w-full text-left p-7 hover:bg-white/50 dark:hover:bg-neutral-800/50 transition-all">
                    <div className="font-bold text-foreground mb-1 text-lg">
                      Distance Unit
                    </div>
                    <div className="text-base text-muted-foreground/80 font-medium">Kilometers</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
