import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, MapPin, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "../components/Button";
import { AuthPrompt } from "../components/AuthPrompt";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export function AddStation() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [stationName, setStationName] = useState("");
  const [address, setAddress] = useState("");
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
    }
  }, [isAuthenticated]);

  // Mock fuel prices
  const [prices, setPrices] = useState({
    diesel: "",
    premiumdiesel: "",
    unleaded91: "",
    premium95: "",
    premium97: "",
    kerosene: "",
  });

  const handleStationNameChange = (value: string) => {
    setStationName(value);
    // Mock duplicate detection
    if (value.toLowerCase().includes("petron quezon")) {
      setShowDuplicateWarning(true);
    } else {
      setShowDuplicateWarning(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

    if (showDuplicateWarning) {
      toast.error("A similar station already exists. Please check before adding.");
      return;
    }

    setShowSuccess(true);
    setTimeout(() => {
      toast.success("Station added successfully!");
      navigate("/app");
    }, 2000);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-teal-500/50">
          <CheckCircle className="w-14 h-14 text-white" strokeWidth={2.5} />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">Station Added!</h2>
        <p className="text-center text-muted-foreground font-medium">
          Thank you for contributing to the community
        </p>
      </div>
    );
  }

  return (
    <>
      <AuthPrompt
        isOpen={showAuthPrompt}
        onClose={() => {
          setShowAuthPrompt(false);
          navigate(-1);
        }}
        message="Sign in to add new stations and help the community discover fuel prices."
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 pb-20 lg:pb-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-12 pb-8 lg:pb-12 px-4 lg:px-8 relative overflow-hidden">
        {/* Enhanced radial glow background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-3 lg:mb-4">
            <button
              onClick={() => navigate(-1)}
              className="w-12 h-12 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl shadow-black/20 hover:scale-110 transition-transform border-2 border-white/40"
            >
              <ArrowLeft className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
            </button>
            <h1 className="text-3xl lg:text-4xl font-bold text-white drop-shadow-2xl tracking-tight">Add New Station</h1>
          </div>
          <p className="text-white/95 text-sm lg:text-base font-medium drop-shadow-lg pl-1 lg:pl-0">
            Help others find fuel prices nearby
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-4 lg:px-8 py-6 lg:py-10">
        <div className="max-w-6xl mx-auto">
          {/* Mobile Layout */}
          <div className="lg:hidden space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Station Name *
              </label>
              <input
                type="text"
                value={stationName}
                onChange={(e) => handleStationNameChange(e.target.value)}
                placeholder="e.g., Petron EDSA"
                className="w-full px-4 py-3.5 bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-lg text-foreground font-medium"
                required
              />
            </div>

            {showDuplicateWarning && (
              <div className="bg-yellow-50 dark:bg-yellow-950/30 border-2 border-yellow-400/50 rounded-2xl p-5 flex items-start gap-3 shadow-xl shadow-yellow-500/10">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-warning mb-1">
                    Possible Duplicate
                  </div>
                  <div className="text-sm text-warning/80 mb-3">
                    A similar station might already exist. Please verify before continuing.
                  </div>
                  <button
                    type="button"
                    className="text-sm text-warning font-medium underline"
                  >
                    View Similar Stations
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Full Address *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter complete address"
                  rows={3}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none shadow-lg text-foreground font-medium"
                  required
                />
              </div>
              <button
                type="button"
                className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 hover:underline"
              >
                <MapPin className="w-4 h-4" />
                Use current location
              </button>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">
                Initial Fuel Prices (Optional)
              </h3>
              <div className="space-y-3">
                {[
                  { key: "diesel", label: "Diesel" },
                  { key: "premiumdiesel", label: "Premium Diesel" },
                  { key: "unleaded91", label: "Unleaded 91" },
                  { key: "premium95", label: "Premium 95" },
                  { key: "premium97", label: "Premium 97" },
                  { key: "kerosene", label: "Kerosene" },
                ].map((fuel) => (
                  <div key={fuel.key}>
                    <label className="block text-sm text-muted-foreground mb-1">
                      {fuel.label}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground">
                        ₱
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={prices[fuel.key as keyof typeof prices]}
                        onChange={(e) =>
                          setPrices({ ...prices, [fuel.key]: e.target.value })
                        }
                        placeholder="0.00"
                        className="w-full pl-9 pr-4 py-3 bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-lg text-foreground font-medium"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-400/30 rounded-2xl p-5 shadow-xl shadow-emerald-500/10">
              <h4 className="font-semibold text-foreground mb-2">Guidelines</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Verify station name matches signage</li>
                <li>• Provide complete and accurate address</li>
                <li>• Add prices only if currently at the station</li>
                <li>• Check for duplicates before submitting</li>
              </ul>
            </div>

            <div className="pt-4">
              <Button type="submit" fullWidth>
                Add Station
              </Button>
            </div>
          </div>

          {/* Desktop 2-Column Layout */}
          <div className="hidden lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Left Column - Form Content (2/3) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Station Information Card */}
              <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-3xl border-2 border-gray-200 dark:border-neutral-700 p-8 shadow-2xl shadow-black/10">
                <h3 className="text-xl font-bold text-foreground mb-6 tracking-tight">Station Information</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-base font-bold text-foreground mb-3">
                      Station Name *
                    </label>
                    <input
                      type="text"
                      value={stationName}
                      onChange={(e) => handleStationNameChange(e.target.value)}
                      placeholder="e.g., Petron EDSA"
                      className="w-full px-5 py-4 bg-white dark:bg-neutral-900 rounded-2xl border-2 border-gray-200 dark:border-neutral-700 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 shadow-lg text-foreground font-medium text-base transition-all"
                      required
                    />
                  </div>

                  {showDuplicateWarning && (
                    <div className="bg-yellow-50 dark:bg-yellow-950/30 border-2 border-yellow-400/50 rounded-2xl p-6 flex items-start gap-4 shadow-xl shadow-yellow-500/10">
                      <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-warning mb-2 text-base">
                          Possible Duplicate
                        </div>
                        <div className="text-sm text-warning/80 mb-4">
                          A similar station might already exist. Please verify before continuing.
                        </div>
                        <button
                          type="button"
                          className="text-sm text-warning font-bold underline hover:no-underline"
                        >
                          View Similar Stations
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-base font-bold text-foreground mb-3">
                      Full Address *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter complete address"
                        rows={4}
                        className="w-full pl-12 pr-5 py-4 bg-white dark:bg-neutral-900 rounded-2xl border-2 border-gray-200 dark:border-neutral-700 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 resize-none shadow-lg text-foreground font-medium text-base transition-all"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      className="mt-3 text-base text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2 hover:underline"
                    >
                      <MapPin className="w-5 h-5" />
                      Use current location
                    </button>
                  </div>
                </div>
              </div>

              {/* Initial Fuel Prices Card */}
              <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-3xl border-2 border-gray-200 dark:border-neutral-700 p-8 shadow-2xl shadow-black/10">
                <h3 className="text-xl font-bold text-foreground mb-6 tracking-tight">
                  Initial Fuel Prices <span className="text-muted-foreground font-medium text-base">(Optional)</span>
                </h3>
                <div className="grid grid-cols-2 gap-5">
                  {[
                    { key: "diesel", label: "Diesel" },
                    { key: "premiumdiesel", label: "Premium Diesel" },
                    { key: "unleaded91", label: "Unleaded 91" },
                    { key: "premium95", label: "Premium 95" },
                    { key: "premium97", label: "Premium 97" },
                    { key: "kerosene", label: "Kerosene" },
                  ].map((fuel) => (
                    <div key={fuel.key}>
                      <label className="block text-sm font-bold text-muted-foreground mb-2">
                        {fuel.label}
                      </label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-base">
                          ₱
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          value={prices[fuel.key as keyof typeof prices]}
                          onChange={(e) =>
                            setPrices({ ...prices, [fuel.key]: e.target.value })
                          }
                          placeholder="0.00"
                          className="w-full pl-10 pr-5 py-4 bg-white dark:bg-neutral-900 rounded-2xl border-2 border-gray-200 dark:border-neutral-700 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 shadow-lg text-foreground font-medium text-base transition-all"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar (1/3) */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-6 space-y-6">
                {/* Guidelines Card */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 backdrop-blur-2xl border-2 border-emerald-400/30 rounded-3xl p-7 shadow-2xl shadow-emerald-500/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-200/20 dark:bg-emerald-400/10 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <h4 className="text-lg font-bold text-foreground mb-4 tracking-tight">Guidelines</h4>
                    <ul className="space-y-3 text-sm text-muted-foreground font-medium">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                        <span>Verify station name matches signage</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                        <span>Provide complete and accurate address</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                        <span>Add prices only if currently at the station</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                        <span>Check for duplicates before submitting</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Action Button */}
                <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-3xl border-2 border-gray-200 dark:border-neutral-700 p-6 shadow-2xl shadow-black/10">
                  <Button type="submit" fullWidth>
                    Add Station
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
    </>
  );
}
