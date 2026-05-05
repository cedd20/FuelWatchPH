import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { Heart, Search, ArrowLeft, Loader2 } from "lucide-react";
import { StationCard } from "@/shared/components/StationCard";
import { EmptyState } from "@/shared/components/EmptyState";
import { AuthPrompt } from "@/shared/components/AuthPrompt";
import { useAuth } from "@/app/providers/AuthContext";
import { useStations } from "@/hooks/useStations";
import { getSavedStationIds } from "@/shared/utils/favorites";
import { PageHeaderSkeleton, StationCardSkeleton } from "@/shared/components/Skeleton";

export function SavedStations() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: allStations = [], isLoading } = useStations();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const savedStations = useMemo(() => {
    if (isLoading) return [];
    const savedIds = getSavedStationIds();
    return allStations.filter(s => savedIds.includes(s.id));
  }, [allStations, isLoading]);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
    }
  }, [isAuthenticated]);

  const filteredStations = useMemo(() => {
    return savedStations.filter((station) =>
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [savedStations, searchQuery]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 pb-12">
        <PageHeaderSkeleton />
        <div className="max-w-6xl mx-auto px-4 lg:px-8 space-y-6 -mt-10 relative z-20">
          <div className="bg-white dark:bg-neutral-800 h-16 rounded-2xl w-full max-w-2xl mb-8 animate-pulse shadow-xl" />
          {Array.from({ length: 3 }).map((_, i) => (
            <StationCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-950 pb-20">
        <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-12 pb-8 px-4 lg:px-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-6 lg:mb-8">
              <button
                onClick={() => navigate(-1)}
                className="w-12 h-12 bg-white dark:bg-neutral-800 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl border-2 border-white/40 dark:border-neutral-700/50 hover:scale-110 transition-transform"
              >
                <ArrowLeft className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              </button>
              <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight drop-shadow-lg">Saved Stations</h1>
            </div>
            
            <div className="relative group max-w-2xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" strokeWidth={2.5} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your favorites..."
                className="w-full pl-13 pr-6 py-4.5 lg:py-5 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-xl rounded-2xl border-2 border-transparent focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/10 shadow-2xl placeholder:text-gray-400 text-foreground font-bold transition-all"
              />
            </div>
          </div>
        </div>

        <div className="px-4 lg:px-8 py-6 lg:py-10">
          <div className="max-w-6xl mx-auto">
            {filteredStations.length > 0 ? (
              <div className="grid gap-4 lg:gap-6">
                {filteredStations.map((station) => (
                  <StationCard 
                    key={station.id} 
                    {...station} 
                    prices={Object.entries(station.latest_prices || {}).map(([type, details]) => ({ type, price: details.price }))}
                  />
                ))}
              </div>
            ) : (
              <div className="pt-10">
                <EmptyState
                  icon={Heart}
                  title={searchQuery ? "No results found" : "No saved stations"}
                  description={searchQuery ? `No stations match "${searchQuery}" in your favorites.` : "Save your favorite stations for quick access to prices and updates."}
                  action={{
                    label: "Explore Map",
                    onClick: () => navigate("/app/map"),
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
