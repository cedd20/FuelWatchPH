import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, TrendingDown, CheckCircle, Clock, Loader2 } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { AuthPrompt } from "@/shared/components/AuthPrompt";
import { useAuth } from "@/app/providers/AuthContext";
import { StationLogo } from "@/shared/components/StationLogo";

const MOCK_CONTRIBUTIONS = [
  {
    id: "1",
    stationName: "Petron Quezon Avenue",
    fuelType: "Diesel",
    price: 55.30,
    date: "Today, 2:30 PM",
    status: "verified",
  },
  {
    id: "2",
    stationName: "Shell EDSA",
    fuelType: "Gasoline 95",
    price: 69.00,
    date: "Yesterday, 5:15 PM",
    status: "verified",
  },
  {
    id: "3",
    stationName: "Caltex Commonwealth",
    fuelType: "Gasoline 91",
    price: 62.80,
    date: "Apr 13, 10:45 AM",
    status: "pending",
  },
];

export function ContributionHistory() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [contributions, setContributions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      setIsLoading(false);
      return;
    }

    // Simulate API Fetch: GET /api/user/contributions
    const fetchContributions = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
        setContributions(MOCK_CONTRIBUTIONS);
      } catch (err) {
        console.error("Failed to fetch contributions:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContributions();
  }, [isAuthenticated]);

  const filteredContributions = contributions.filter((contribution) => {
    if (statusFilter === "all") return true;
    return contribution.status === statusFilter;
  });

  const verifiedCount = contributions.filter((c) => c.status === "verified").length;
  const pendingCount = contributions.filter((c) => c.status === "pending").length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-8">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading your contributions...</p>
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
        message="Sign in to view your contribution history and track your updates."
      />

      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-950 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-12 pb-8 px-4 relative overflow-hidden">
          {/* Enhanced radial glow background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => navigate(-1)}
                className="w-12 h-12 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl shadow-black/20 hover:scale-110 transition-transform border-2 border-white/40"
              >
                <ArrowLeft className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              </button>
              <h1 className="text-3xl font-bold text-white drop-shadow-2xl tracking-tight">My Contributions</h1>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-2xl p-4 shadow-2xl shadow-black/20 border-2 border-gray-200 dark:border-neutral-700">
                <div className="text-3xl font-bold bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent mb-1 tracking-tight">24</div>
                <div className="text-sm text-muted-foreground font-semibold">Total Updates</div>
              </div>
              <div className="bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-2xl p-4 shadow-2xl shadow-black/20 border-2 border-gray-200 dark:border-neutral-700">
                <div className="text-3xl font-bold bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-1 tracking-tight">95%</div>
                <div className="text-sm text-muted-foreground font-semibold">Accuracy Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Contribution List */}
        <div className="px-4 py-6">
          {contributions.length > 0 ? (
            <div className="space-y-3">
              {contributions.map((contribution) => (
                <div
                  key={contribution.id}
                  className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl border-2 border-gray-200 dark:border-neutral-700 p-6 shadow-2xl shadow-black/10"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground mb-2 text-base">
                        {contribution.stationName}
                      </h3>
                      <div className="text-sm text-muted-foreground/80 font-medium">
                        {contribution.fuelType}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground tracking-tighter">
                        ₱{contribution.price.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground/80">
                      <Clock className="w-4 h-4" strokeWidth={2.5} />
                      <span className="font-semibold">{contribution.date}</span>
                    </div>
                    {contribution.status === "verified" ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full shadow-lg shadow-teal-500/30">
                        <CheckCircle className="w-4 h-4" strokeWidth={2.5} />
                        <span className="font-bold text-xs">Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full shadow-lg shadow-yellow-500/30">
                        <Clock className="w-4 h-4" strokeWidth={2.5} />
                        <span className="font-bold text-xs">Pending</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={TrendingDown}
              title="No contributions yet"
              description="Start updating fuel prices to help the community"
              action={{
                label: "Find Stations",
                onClick: () => navigate("/app"),
              }}
            />
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-950 pb-10">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-12 pb-8 px-8 relative overflow-hidden">
          {/* Enhanced radial glow background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl" />

          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <button
                onClick={() => navigate(-1)}
                className="w-12 h-12 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl shadow-black/20 hover:scale-110 transition-transform border-2 border-white/40"
              >
                <ArrowLeft className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
              </button>
              <h1 className="text-4xl font-bold text-white drop-shadow-2xl tracking-tight">My Contributions</h1>
            </div>

            {/* Stats - Desktop 4 Column */}
            <div className="grid grid-cols-4 gap-5">
              <div className="bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-2xl p-6 shadow-2xl shadow-black/20 border-2 border-gray-200 dark:border-neutral-700">
                <div className="text-4xl font-bold bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent mb-2 tracking-tight">{contributions.length}</div>
                <div className="text-base text-muted-foreground font-semibold">Total Updates</div>
              </div>
              <div className="bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-2xl p-6 shadow-2xl shadow-black/20 border-2 border-gray-200 dark:border-neutral-700">
                <div className="text-4xl font-bold bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2 tracking-tight">95%</div>
                <div className="text-base text-muted-foreground font-semibold">Accuracy Rate</div>
              </div>
              <div className="bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-2xl p-6 shadow-2xl shadow-black/20 border-2 border-gray-200 dark:border-neutral-700">
                <div className="text-4xl font-bold bg-gradient-to-br from-yellow-500 to-orange-500 bg-clip-text text-transparent mb-2 tracking-tight">{contributions.length * 5}</div>
                <div className="text-base text-muted-foreground font-semibold">Points Earned</div>
              </div>
              <div className="bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-2xl p-6 shadow-2xl shadow-black/20 border-2 border-gray-200 dark:border-neutral-700">
                <div className="text-4xl font-bold bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2 tracking-tight">{verifiedCount}</div>
                <div className="text-base text-muted-foreground font-semibold">Verified</div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop 2-Column Layout */}
        <div className="px-8 py-10">
          <div className="max-w-7xl mx-auto grid grid-cols-3 gap-8">
            {/* Left Column - Main Content - Takes 2/3 */}
            <div className="col-span-2">
              {/* Filter Bar */}
              <div className="mb-6 flex items-center gap-3">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    statusFilter === "all"
                      ? "bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white shadow-lg shadow-emerald-500/40"
                      : "bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 text-foreground hover:border-emerald-400/50"
                  }`}
                >
                  All Updates
                </button>
                <button
                  onClick={() => setStatusFilter("verified")}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    statusFilter === "verified"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/40"
                      : "bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 text-foreground hover:border-emerald-400/50"
                  }`}
                >
                  Verified
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    statusFilter === "pending"
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/40"
                      : "bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 text-foreground hover:border-emerald-400/50"
                  }`}
                >
                  Pending
                </button>
              </div>

              {/* Contribution List */}
              <h3 className="text-2xl font-bold text-foreground mb-5 tracking-tight">Contribution History</h3>
              {filteredContributions.length > 0 ? (
                <div className="space-y-4">
                  {filteredContributions.map((contribution) => (
                    <div
                      key={contribution.id}
                      className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl border-2 border-gray-200 dark:border-neutral-700 p-7 shadow-2xl shadow-black/10 hover:shadow-2xl hover:border-emerald-400/50 hover:scale-[1.01] transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-4 lg:gap-5 mb-4">
                            <StationLogo name={contribution.stationName} size="md" />
                            <div className="flex-1">
                              <h4 className="font-bold text-foreground mb-1 text-lg">
                                {contribution.stationName}
                              </h4>
                              <div className="text-base text-muted-foreground/80 font-medium">
                                {contribution.fuelType}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold text-foreground tracking-tighter mb-1">
                                ₱{contribution.price.toFixed(2)}
                              </div>
                              <div className="text-sm text-muted-foreground/70 font-semibold">per liter</div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground/80">
                              <Clock className="w-5 h-5" strokeWidth={2.5} />
                              <span className="font-semibold text-base">{contribution.date}</span>
                            </div>
                            {contribution.status === "verified" ? (
                              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full shadow-lg shadow-teal-500/30">
                                <CheckCircle className="w-5 h-5" strokeWidth={2.5} />
                                <span className="font-bold text-sm">Verified</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full shadow-lg shadow-yellow-500/30">
                                <Clock className="w-5 h-5" strokeWidth={2.5} />
                                <span className="font-bold text-sm">Pending Review</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={TrendingDown}
                  title={`No ${statusFilter === "all" ? "" : statusFilter} contributions`}
                  description={statusFilter === "all" ? "Start updating fuel prices to help the community" : `You don't have any ${statusFilter} contributions yet`}
                  action={statusFilter === "all" ? {
                    label: "Find Stations",
                    onClick: () => navigate("/app"),
                  } : undefined}
                />
              )}
            </div>

            {/* Right Column - Sidebar - Takes 1/3 */}
            <div className="col-span-1">
              <div className="sticky top-6 space-y-6">
                {/* Status Summary Card */}
                <div className="bg-white dark:bg-neutral-900 backdrop-blur-2xl rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-700 shadow-2xl shadow-black/10">
                  <h3 className="text-xl font-bold text-foreground mb-5 tracking-tight">Status Summary</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full" />
                        <span className="font-semibold text-foreground">Verified</span>
                      </div>
                      <span className="font-bold text-lg text-foreground">{verifiedCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full" />
                        <span className="font-semibold text-foreground">Pending</span>
                      </div>
                      <span className="font-bold text-lg text-foreground">{pendingCount}</span>
                    </div>
                    <div className="pt-4 border-t-2 border-gray-200 dark:border-neutral-700">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">Total</span>
                        <span className="font-bold text-xl bg-gradient-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent">{contributions.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Card */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/30 dark:to-teal-950/30 backdrop-blur-2xl rounded-2xl p-6 border-2 border-emerald-400/30 dark:border-emerald-500/30 shadow-2xl shadow-emerald-500/10">
                  <h3 className="text-xl font-bold text-foreground mb-4 tracking-tight">Your Impact</h3>
                  <p className="text-sm text-muted-foreground/90 leading-relaxed mb-5">
                    Your contributions help {contributions.length * 15}+ drivers save money on fuel every week.
                  </p>
                  <div className="bg-white/50 dark:bg-neutral-800/50 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                      <span className="font-bold text-sm text-foreground">Trusted Contributor</span>
                    </div>
                    <p className="text-xs text-muted-foreground/80">
                      95% accuracy rate • Keep up the great work!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
