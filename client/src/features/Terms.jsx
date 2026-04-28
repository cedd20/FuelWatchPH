import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Shield, FileText, CheckCircle2, Scale } from "lucide-react";

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
          <h1 className="text-3xl lg:text-4xl font-bold text-white drop-shadow-2xl tracking-tight">Terms & Privacy</h1>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6 lg:py-10">
        <div className="max-w-3xl mx-auto">
          {/* Tabs */}
          <div className="flex p-1.5 bg-gray-100 dark:bg-neutral-800/50 backdrop-blur-xl rounded-2xl mb-8 border-2 border-gray-200/50 dark:border-neutral-700/30">
            <button
              onClick={() => setActiveTab("terms")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === "terms"
                  ? "bg-white dark:bg-neutral-700 text-emerald-600 dark:text-emerald-400 shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Scale className="w-4 h-4" />
              Terms of Service
            </button>
            <button
              onClick={() => setActiveTab("privacy")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === "privacy"
                  ? "bg-white dark:bg-neutral-700 text-emerald-600 dark:text-emerald-400 shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Shield className="w-4 h-4" />
              Privacy Policy
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {(activeTab === "terms" ? termsContent : privacyContent).map((section, index) => (
              <div key={index} className="bg-white dark:bg-neutral-800/50 backdrop-blur-xl p-6 lg:p-8 rounded-3xl border-2 border-gray-100 dark:border-neutral-700/40 shadow-xl group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg tracking-tight">{section.title}</h3>
                </div>
                <p className="text-muted-foreground/90 font-medium text-sm lg:text-base leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>

          {/* Legal Footer */}
          <div className="mt-10 p-6 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border-2 border-emerald-100 dark:border-emerald-500/20 text-center">
            <p className="text-xs lg:text-sm text-emerald-800 dark:text-emerald-400 font-semibold italic">
              Last Updated: April 24, 2026. These terms are subject to change to improve community standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
