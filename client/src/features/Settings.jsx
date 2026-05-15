import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Fuel, Moon, ChevronDown, Search, Settings2 } from "lucide-react";
import { useTheme } from "@/app/providers/ThemeContext";

export function Settings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [defaultFuelType, setDefaultFuelType] = useState("UL91");
  const [radius, setRadius] = useState("5");

  const selectClass = "w-full bg-[#050A09] border border-emerald-500/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-emerald-500/50 outline-none transition-all appearance-none cursor-pointer";

  return (
    <div className="min-h-screen bg-[#050A09] text-white pb-28">
      {/* Header */}
      <div className="relative pt-14 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="flex items-center gap-6 mb-10">
            <button
              onClick={() => navigate(-1)}
              className="p-3 bg-[#0C1A17] rounded-full border border-emerald-500/10 hover:bg-emerald-500 transition-all shadow-2xl group"
            >
              <ArrowLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
            <div>
              <h1 className="text-4xl font-black tracking-tight">Settings</h1>
              <p className="text-gray-600 font-bold text-xs uppercase tracking-widest mt-1">Customize your experience</p>
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
          className="bg-[#0C1A17] rounded-[3rem] p-8 border border-emerald-500/10 shadow-2xl"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
              <Fuel className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-black">Preferences</h2>
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Fuel & location defaults</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Default Fuel Type</label>
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
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Search Radius</label>
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
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Appearance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0C1A17] rounded-[3rem] p-8 border border-emerald-500/10 shadow-2xl flex items-center justify-between group hover:border-emerald-500/20 transition-all cursor-pointer"
          onClick={toggleTheme}
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-[#050A09] rounded-2xl flex items-center justify-center border border-emerald-500/10">
              <Moon className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <div className="font-black text-base">Dark Mode</div>
              <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Adjust for night use</div>
            </div>
          </div>
          <label className="relative inline-block w-14 h-7 cursor-pointer" onClick={(e) => e.stopPropagation()}>
            <input type="checkbox" checked={theme === "dark"} onChange={toggleTheme} className="sr-only peer" />
            <div className="w-14 h-7 bg-[#050A09] border border-emerald-500/10 rounded-full peer peer-checked:bg-emerald-500 peer-checked:border-emerald-400 transition-all shadow-inner"></div>
            <div className="absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-all peer-checked:translate-x-7 shadow-md"></div>
          </label>
        </motion.div>

        {/* Info Note */}
        <p className="text-center text-[10px] font-bold text-gray-700 uppercase tracking-widest px-4">
          Settings are saved automatically
        </p>
      </div>
    </div>
  );
}
