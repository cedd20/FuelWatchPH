import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Fuel, Moon, ChevronDown, Search, Settings2 } from "lucide-react";
import { useTheme } from "@/app/providers/ThemeContext";

export function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme, toggleTheme } = useTheme();

  const [defaultFuelType, setDefaultFuelType] = useState("UL91");
  const [radius, setRadius] = useState("5");

  const selectClass = "app-input w-full appearance-none rounded-2xl p-5 text-sm font-bold text-foreground outline-none transition-all focus:border-emerald-500/40 cursor-pointer";

  return (
    <div className="app-shell min-h-screen pb-28 text-foreground">
      {/* Header */}
      <div className="relative pt-14 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="flex items-center gap-6 mb-10">
            <button
              onClick={() => navigate(-1)}
              className="app-panel group rounded-full p-3 transition-all hover:bg-emerald-500 hover:text-white shadow-2xl"
            >
              <ArrowLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
            <div>
              <h1 className="text-4xl font-black tracking-tight">Settings</h1>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Customize your experience</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-10 space-y-6">
        {/* Preferences Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="app-panel rounded-[3rem] p-8 shadow-2xl"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
              <Fuel className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-black">Preferences</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fuel & location defaults</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-muted-foreground">Default Fuel Type</label>
              <div className="relative">
                <select
                  value={defaultFuelType}
                  onChange={(e) => setDefaultFuelType(e.target.value)}
                  className={selectClass}
                >
                  <option>UL91</option>
                  <option>PR95</option>
                  <option>PR97</option>
                  <option>DSL</option>
                  <option>PDSL</option>
                  <option>Kerosene</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div>
              <label className="mb-3 block text-[10px] font-black uppercase tracking-widest text-muted-foreground">Search Radius</label>
              <div className="relative">
                <select
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className={selectClass}
                >
                  <option value="5">5 km</option>
                  <option value="10">10 km</option>
                  <option value="20">20 km</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Appearance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="app-panel group flex cursor-pointer items-center justify-between rounded-[3rem] p-8 shadow-2xl transition-all hover:border-emerald-500/20"
          onClick={toggleTheme}
        >
          <div className="flex items-center gap-5">
            <div className="app-panel-muted flex h-12 w-12 items-center justify-center rounded-2xl border">
              <Moon className="h-6 w-6 text-emerald-500 dark:text-emerald-300" />
            </div>
            <div>
              <div className="text-base font-black">{theme === "dark" ? "Dark Mode" : "Light Mode"}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Saved across reloads and navigation</div>
            </div>
          </div>
          <label className="relative inline-block w-14 h-7 cursor-pointer" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={theme === "dark"}
              onChange={(event) => setTheme(event.target.checked ? "dark" : "light")}
              className="sr-only peer"
            />
            <div className="app-panel-muted h-7 w-14 rounded-full border shadow-inner transition-all peer-checked:border-emerald-400 peer-checked:bg-emerald-500"></div>
            <div className="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-all peer-checked:translate-x-7 shadow-md"></div>
          </label>
        </motion.div>

        {/* Info Note */}
        <p className="px-4 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Theme defaults to dark mode until you choose otherwise
        </p>
      </div>
    </div>
  );
}
