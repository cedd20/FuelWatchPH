import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Heart, Search, ArrowLeft } from "lucide-react";
import { StationCard } from "../components/StationCard";
import { EmptyState } from "../components/EmptyState";
import { AuthPrompt } from "../components/AuthPrompt";
import { useAuth } from "../context/AuthContext";

const mockSavedStations = [
  {
    id: "1",
    name: "Petron Quezon Avenue",
    address: "123 Quezon Ave, Quezon City",
    distance: 0.5,
    prices: [
      { type: "G91", price: 62.50 },
      { type: "G95", price: 68.20 },
      { type: "Diesel", price: 55.30 },
    ],
    lastUpdated: "2 mins ago",
    verified: true,
  },
  {
    id: "2",
    name: "Shell EDSA",
    address: "456 EDSA, Mandaluyong",
    distance: 1.2,
    prices: [
      { type: "G91", price: 63.10 },
      { type: "G95", price: 69.00 },
      { type: "Diesel", price: 56.10 },
    ],
    lastUpdated: "15 mins ago",
    verified: true,
  },
];

export function SavedStations() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [stations] = useState(mockSavedStations);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
    }
  }, [isAuthenticated]);

  const filteredStations = stations.filter((station) =>
    station.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <AuthPrompt
        isOpen={showAuthPrompt}
        onClose={() => {
          setShowAuthPrompt(false);
          navigate("/app/map");
        }}
        message="Sign in to save your favorite stations for quick access."
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-12 pb-8 px-4 lg:px-8 relative overflow-hidden">
        {/* Enhanced radial glow background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-5 lg:mb-6">
            <button
              onClick={() => navigate(-1)}
              className="w-12 h-12 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl shadow-black/20 hover:scale-110 transition-transform border-2 border-white/40"
            >
              <ArrowLeft className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
            </button>
            <h1 className="text-3xl lg:text-4xl font-bold text-white drop-shadow-2xl tracking-tight">Saved Stations</h1>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 lg:left-5 top-1/2 -translate-y-1/2 w-5 h-5 lg:w-6 lg:h-6 text-gray-500 z-10" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved stations"
              className="w-full pl-12 lg:pl-14 pr-4 lg:pr-6 py-3.5 lg:py-4 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full border-2 border-white/60 focus:outline-none focus:ring-2 focus:ring-white/80 shadow-2xl shadow-black/20 transition-all placeholder:text-gray-500 text-foreground font-medium text-base lg:text-lg"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 lg:px-8 py-6 lg:py-10">
        <div className="max-w-6xl mx-auto">
        {filteredStations.length > 0 ? (
          <div className="space-y-3 lg:space-y-4">
            {filteredStations.map((station) => (
              <StationCard key={station.id} {...station} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Heart}
            title="No saved stations"
            description="Save your favorite stations for quick access to prices"
            action={{
              label: "Explore Stations",
              onClick: () => {},
            }}
          />
        )}
        </div>
      </div>
    </div>
    </>
  );
}
