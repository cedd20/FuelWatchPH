import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Share2,
  Heart,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertCircle,
  Navigation,
} from "lucide-react";

const mockStation = {
  id: "1",
  name: "Petron Quezon Avenue",
  address: "123 Quezon Avenue, Quezon City, Metro Manila",
  distance: 0.5,
  lastUpdated: "2 mins ago",
  verified: true,
  prices: [
    { type: "Diesel", price: 55.30, trend: "down", change: -0.50 },
    { type: "Premium Diesel", price: 59.50, trend: "down", change: -0.30 },
    { type: "Unleaded 91", price: 64.50, trend: "down", change: -0.30 },
    { type: "Premium 95", price: 68.20, trend: "down", change: -0.20 },
    { type: "Premium 97", price: 72.80, trend: "up", change: 0.10 },
  ],
  contributors: 142,
  accuracy: 98,
};

export function StationDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSaved, setIsSaved] = useState(false);

  const handleShare = () => {
    // Share functionality
  };

  const handleGetDirections = () => {
    // Navigation functionality
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 pb-20 lg:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-12 pb-8 px-4 lg:px-8 lg:pb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <button
              onClick={() => navigate(-1)}
              className="w-12 h-12 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl shadow-black/20 hover:scale-110 transition-transform border-2 border-white/40"
            >
              <ArrowLeft className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="w-12 h-12 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl shadow-black/20 hover:scale-110 transition-transform border-2 border-white/40"
              >
                <Share2 className="w-5 h-5 text-gray-700 dark:text-gray-200" strokeWidth={2.5} />
              </button>
              <button
                onClick={() => setIsSaved(!isSaved)}
                className="w-12 h-12 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl shadow-black/20 hover:scale-110 transition-transform border-2 border-white/40"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isSaved ? "fill-rose-500 text-rose-500" : "text-gray-700 dark:text-gray-200"
                  }`}
                  strokeWidth={2.5}
                />
              </button>
            </div>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 lg:mb-4 drop-shadow-2xl tracking-tight">{mockStation.name}</h1>
          <div className="flex items-start gap-2 text-white/95 mb-4 lg:mb-5 drop-shadow-lg">
            <MapPin className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 flex-shrink-0" />
            <span className="text-sm lg:text-base font-medium">{mockStation.address}</span>
          </div>
          <div className="flex items-center gap-4 lg:gap-6 text-sm lg:text-base text-white/95 font-medium drop-shadow-lg">
            <div className="flex items-center gap-1.5 lg:gap-2">
              <Navigation className="w-4 h-4 lg:w-5 lg:h-5" />
              <span>{mockStation.distance} km away</span>
            </div>
            <div className="flex items-center gap-1.5 lg:gap-2">
              <Clock className="w-4 h-4 lg:w-5 lg:h-5" />
              <span>Updated {mockStation.lastUpdated}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden mx-4 -mt-4 bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl p-6 border-2 border-emerald-400/30 dark:border-emerald-500/30 shadow-2xl shadow-emerald-500/10 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/5 rounded-xl flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-500" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-bold text-foreground text-base">
                {mockStation.accuracy}% Accuracy
              </div>
              <div className="text-xs text-muted-foreground/80 font-medium">
                Verified by {mockStation.contributors} contributors
              </div>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full text-xs font-bold shadow-lg shadow-teal-500/30">
            Trusted
          </div>
        </div>
      </div>

      <div className="hidden lg:block px-8 py-10 mb-10">
        <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-6 tracking-tight">Current Prices</h3>
              <div className="grid grid-cols-2 gap-4">
                {mockStation.prices.map((fuel, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-2xl shadow-black/10 hover:border-emerald-400/50 hover:scale-[1.02] transition-all"
                  >
                    <div className="mb-4">
                      <div className="font-bold text-foreground mb-2 text-lg">
                        {fuel.type}
                      </div>
                      <div className="flex items-center gap-2">
                        {fuel.trend === "down" ? (
                          <TrendingDown className="w-5 h-5 text-emerald-600 dark:text-emerald-500" strokeWidth={2.5} />
                        ) : (
                          <TrendingUp className="w-5 h-5 text-rose-600 dark:text-rose-400" strokeWidth={2.5} />
                        )}
                        <span
                          className={`text-sm font-bold ${
                            fuel.trend === "down" ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          ₱{Math.abs(fuel.change).toFixed(2)}{" "}
                          {fuel.trend === "down" ? "lower" : "higher"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-foreground tracking-tighter mb-1">
                        ₱{fuel.price.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground/70 font-semibold">per liter</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 space-y-6">
              <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl p-6 border-2 border-emerald-400/30 dark:border-emerald-500/30 shadow-2xl shadow-emerald-500/10 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/5 rounded-xl flex items-center justify-center shadow-lg">
                      <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-500" strokeWidth={2.5} />
                    </div>
                    <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full text-xs font-bold shadow-lg shadow-teal-500/30">
                      Trusted
                    </div>
                  </div>
                  <div className="font-bold text-foreground text-2xl mb-2 tracking-tight">
                    {mockStation.accuracy}% Accuracy
                  </div>
                  <div className="text-sm text-muted-foreground/80 font-medium">
                    Verified by {mockStation.contributors} contributors
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/app/update-price/${id}`)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white rounded-2xl font-bold text-base shadow-2xl shadow-emerald-500/50 transition-all border-2 border-emerald-400/30"
                >
                  Update Fuel Price
                </button>
                <button
                  onClick={handleGetDirections}
                  className="w-full px-5 py-3.5 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-2xl font-bold text-sm text-foreground shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4" strokeWidth={2.5} />
                  Get Directions
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden px-4 py-6">
        <h3 className="text-lg font-bold text-foreground mb-4 tracking-tight">Current Prices</h3>
        <div className="space-y-3">
          {mockStation.prices.map((fuel, index) => (
            <div
              key={index}
              className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-2xl shadow-black/10 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-bold text-foreground mb-2 text-base">
                    {fuel.type}
                  </div>
                  <div className="flex items-center gap-2">
                    {fuel.trend === "down" ? (
                      <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-500" strokeWidth={2.5} />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-rose-600 dark:text-rose-400" strokeWidth={2.5} />
                    )}
                    <span className="text-sm font-bold text-emerald-600">
                      ₱{Math.abs(fuel.change).toFixed(2)} {fuel.trend === "down" ? "lower" : "higher"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-foreground tracking-tighter">
                    ₱{fuel.price.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
