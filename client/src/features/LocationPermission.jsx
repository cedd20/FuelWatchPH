import { useNavigate } from "react-router";
import { MapPin, ShieldCheck, TrendingDown } from "lucide-react";
import { Button } from "@/shared/components/Button";

export function LocationPermission() {
  const navigate = useNavigate();

  const handleAllow = () => {
    // In a real app, this would request location permission
    navigate("/app");
  };

  const handleSkip = () => {
    navigate("/app");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900">
      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen bg-white dark:bg-neutral-900 flex flex-col p-6">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-32 h-32 bg-primary rounded-3xl flex items-center justify-center mb-8 shadow-lg">
            <MapPin className="w-16 h-16 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-foreground text-center mb-4">
            Enable Location Access
          </h2>
          <p className="text-center text-muted-foreground mb-8 max-w-sm">
            To show you nearby fuel stations and the most accurate prices, we need access to your location.
          </p>

          <div className="space-y-4 mb-12 w-full max-w-sm">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-success" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Find nearby stations</h4>
                <p className="text-sm text-muted-foreground">
                  Discover fuel stations within your area
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-5 h-5 text-success" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Accurate distances</h4>
                <p className="text-sm text-muted-foreground">
                  See exact distances to each station
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-success" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Verify updates</h4>
                <p className="text-sm text-muted-foreground">
                  Confirm you're at the station when updating prices
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button onClick={handleAllow} fullWidth>
            Allow Location Access
          </Button>
          <button
            onClick={handleSkip}
            className="w-full text-center text-muted-foreground font-medium py-3"
          >
            Skip for now
          </button>
        </div>
      </div>

      {/* Desktop Split Layout */}
      <div className="hidden lg:flex lg:min-h-screen">
        {/* Left Side - Visual/Branding Panel */}
        <div className="lg:w-1/2 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 relative overflow-hidden flex items-center justify-center p-12">
          {/* Enhanced radial glow background */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-teal-400/10 rounded-full blur-2xl" />

          {/* Abstract decorative elements */}
          <div className="absolute top-20 right-20 w-32 h-32 border-4 border-white/20 rounded-3xl rotate-12" />
          <div className="absolute bottom-32 left-16 w-24 h-24 border-4 border-white/15 rounded-2xl -rotate-12" />

          <div className="relative z-10 max-w-lg text-center">
            {/* Large Location Icon */}
            <div className="w-48 h-48 bg-white/20 backdrop-blur-md rounded-[3rem] flex items-center justify-center mb-10 mx-auto shadow-2xl border-4 border-white/30">
              <MapPin className="w-24 h-24 text-white" strokeWidth={2} />
            </div>

            <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-2xl tracking-tight leading-tight">
              Find Fuel Stations Near You
            </h1>
            <p className="text-xl text-white/95 font-medium drop-shadow-lg leading-relaxed">
              Get real-time fuel prices and discover the best deals in your area with location-based recommendations.
            </p>
          </div>
        </div>

        {/* Right Side - Content Panel */}
        <div className="lg:w-1/2 flex items-center justify-center p-12 bg-white dark:bg-neutral-900">
          <div className="w-full max-w-lg">
            <div className="mb-10">
              <h2 className="text-4xl font-bold text-foreground mb-4 tracking-tight">
                Enable Location Access
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                To show you nearby fuel stations and the most accurate prices, we need access to your location.
              </p>
            </div>

            {/* Benefits List */}
            <div className="space-y-6 mb-12">
              <div className="flex gap-4 items-start">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <MapPin className="w-7 h-7 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-foreground mb-2">Find nearby stations</h4>
                  <p className="text-base text-muted-foreground">
                    Discover fuel stations within your area and never run out of fuel
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <TrendingDown className="w-7 h-7 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-foreground mb-2">Accurate distances</h4>
                  <p className="text-base text-muted-foreground">
                    See exact distances to each station and plan your route efficiently
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-foreground mb-2">Verify updates</h4>
                  <p className="text-base text-muted-foreground">
                    Confirm you're at the station when updating prices for accuracy
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <Button onClick={handleAllow} fullWidth size="lg">
                Allow Location Access
              </Button>
              <button
                onClick={handleSkip}
                className="w-full text-center text-muted-foreground font-bold py-4 hover:text-foreground transition-colors text-base"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
