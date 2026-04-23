import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Heart, Search, ArrowLeft } from "lucide-react";
import { StationCard } from "@/shared/components/StationCard";
import { EmptyState } from "@/shared/components/EmptyState";
import { AuthPrompt } from "@/shared/components/AuthPrompt";
import { useAuth } from "@/app/providers/AuthContext";

const mockSavedStations = [
  {
    id: "1",
    name: "Petron Quezon Avenue",
    address: "123 Quezon Ave, Quezon City",
    distance: 0.5,
    prices: [
      { type: "Unleaded 91", price: 62.50 },
      { type: "Premium 95", price: 68.20 },
      { type: "Diesel", price: 55.30 },
    ],
    lastUpdated: "2 mins ago",
    verified: true,
  }
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
        <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-12 pb-8 px-4 lg:px-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-5 lg:mb-6">
              <button
                onClick={() => navigate(-1)}
                className="w-12 h-12 bg-white dark:bg-neutral-900 rounded-full flex items-center justify-center shadow-2xl border-2 border-white/40"
              >
                <ArrowLeft className="w-6 h-6 text-emerald-600" />
              </button>
              <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">Saved Stations</h1>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved stations"
                className="w-full pl-12 pr-6 py-4 bg-white dark:bg-neutral-900 rounded-full border-2 border-white/60 focus:outline-none shadow-2xl placeholder:text-gray-500 text-foreground"
              />
            </div>
          </div>
        </div>

        <div className="px-4 lg:px-8 py-6 lg:py-10">
          <div className="max-w-6xl mx-auto">
            {filteredStations.length > 0 ? (
              <div className="space-y-4">
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
                  onClick: () => navigate("/app/map"),
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
