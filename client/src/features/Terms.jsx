import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield, Scale, CheckCircle2 } from "lucide-react";

export function Terms() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("terms");

  const termsContent = [
    {
      title: "User Responsibilities",
      content: "As a contributor to FuelWatchPH, you agree to provide accurate and truthful fuel price information. Misleading or false data may lead to account suspension."
    },
    {
      title: "Community Conduct",
      content: "Users must respect others and avoid any form of harassment or spamming. The platform is designed for community benefit and transparency."
    },
    {
      title: "Data Usage",
      content: "FuelWatchPH provides fuel price information for reference purposes only. While we strive for accuracy, we cannot guarantee the real-time precision of all data points."
    }
  ];

  const privacyContent = [
    {
      title: "Data Collection",
      content: "We collect basic information such as your email and location (with permission) to provide localized fuel price data and track contributions."
    },
    {
      title: "Information Sharing",
      content: "FuelWatchPH does not sell your personal data to third parties. Your location is used only to show nearby stations and verify price updates."
    },
    {
      title: "Account Security",
      content: "We implement industry-standard security measures to protect your account. Users are responsible for maintaining the confidentiality of their credentials."
    }
  ];

  const activeContent = activeTab === "terms" ? termsContent : privacyContent;

  return (
    <div className="app-shell min-h-screen pb-28 text-foreground">
      {/* Header */}
      <div className="relative pt-14 pb-24 px-6 overflow-hidden">
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
              <h1 className="text-4xl font-black tracking-tight">Legal</h1>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Terms & Privacy Policy</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-12 space-y-6">

        {/* Tab Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="app-panel flex rounded-[2.5rem] p-2 shadow-2xl"
        >
          <button
            onClick={() => setActiveTab("terms")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === "terms"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Scale className="w-4 h-4" />
            Terms
          </button>
          <button
            onClick={() => setActiveTab("privacy")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === "privacy"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield className="w-4 h-4" />
            Privacy
          </button>
        </motion.div>

        {/* Content Sections */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {activeContent.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="app-panel group rounded-[2.5rem] p-8 transition-all hover:border-emerald-500/20 shadow-2xl"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="font-black text-base tracking-tight">{section.title}</h3>
                </div>
                <p className="pl-14 text-sm font-medium leading-relaxed text-muted-foreground">
                  {section.content}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Legal Footer */}
        <div className="rounded-[2rem] border border-emerald-500/12 bg-emerald-500/6 p-6 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Last updated: April 24, 2026 · Subject to change
          </p>
        </div>
      </div>
    </div>
  );
}
