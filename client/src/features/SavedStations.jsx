import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Heart, Search, ArrowLeft } from "lucide-react";
import { StationCard } from "@/shared/components/StationCard";
import { EmptyState } from "@/shared/components/EmptyState";
import { AuthPrompt } from "@/shared/components/AuthPrompt";
import { useAuth } from "@/app/providers/AuthContext";
import { useStations } from "@/hooks/useStations";
import { getSavedStationIds } from "@/shared/utils/favorites";

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
      <div className="min-h-screen bg-[#050A09] text-white pb-28">
        {/* Header */}
        <div className="relative pt-14 pb-24 px-6 overflow-hidden">
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
                <h1 className="text-4xl font-black tracking-tight">Saved Stations</h1>
                <p className="text-gray-600 font-bold text-xs uppercase tracking-widest mt-1">Your favorites, always nearby</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" strokeWidth={2.5} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your favorites..."
                className="w-full pl-14 pr-6 py-5 bg-[#0C1A17] border border-emerald-500/10 rounded-[2rem] font-bold text-sm placeholder:text-gray-600 focus:border-emerald-500/30 focus:outline-none transition-all shadow-2xl"
              />
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-6 -mt-12 space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-[#0C1A17] rounded-[2rem] animate-pulse border border-emerald-500/5" />
            ))
          ) : filteredStations.length > 0 ? (
            filteredStations.map((station, i) => (
              <motion.div
                key={station.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <StationCard
                  {...station}
                  prices={Object.entries(station.latest_prices || {}).map(([type, details]) => ({ type, price: details.price }))}
                />
              </motion.div>
            ))
          ) : (
            <div className="pt-10">
              <EmptyState
                icon={Heart}
                title={searchQuery ? "No results found" : "No saved stations"}
                description={
                  searchQuery
                    ? `No stations match "${searchQuery}" in your favorites.`
                    : "Save your favorite stations for quick access to prices and updates."
                }
                action={{
                  label: "Explore Map",
                  onClick: () => navigate("/app/map"),
                }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
