import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, CheckCircle, MapPin, AlertTriangle } from "lucide-react";
import { Button } from "@/shared/components/Button";
import { AuthPrompt } from "@/shared/components/AuthPrompt";
import { useAuth } from "@/app/providers/AuthContext";
import { toast } from "sonner";

const fuelTypes = [
  { id: "diesel", label: "Diesel", currentPrice: 55.30 },
  { id: "premiumdiesel", label: "Premium Diesel", currentPrice: 59.50 },
  { id: "unleaded91", label: "Unleaded 91", currentPrice: 64.50 },
  { id: "premium95", label: "Premium 95", currentPrice: 68.20 },
  { id: "premium97", label: "Premium 97", currentPrice: 72.80 },
  { id: "kerosene", label: "Kerosene", currentPrice: 52.40 },
];

export function UpdatePrice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [selectedFuel, setSelectedFuel] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [isNearStation] = useState(true); // Mock location check
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
    }
  }, [isAuthenticated]);

  const selectedFuelData = fuelTypes.find((f) => f.id === selectedFuel);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

    if (!isNearStation) {
      toast.error("You must be near the station to update prices");
      return;
    }

    if (!selectedFuel || !newPrice) {
      toast.error("Please select a fuel type and enter a price");
      return;
    }

    // Show success state
    setShowSuccess(true);

    // Navigate back after delay
    setTimeout(() => {
      toast.success("Price updated successfully!");
      navigate(`/app/station/${id}`);
    }, 2000);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-teal-500/50">
          <CheckCircle className="w-14 h-14 text-white" strokeWidth={2.5} />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-3 tracking-tight">Success!</h2>
        <p className="text-center text-muted-foreground mb-6 font-medium">
          Your price update has been submitted
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-semibold">
          <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full animate-pulse shadow-lg shadow-teal-500/50" />
          <span>Verifying update...</span>
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
          navigate(-1);
        }}
        message="Sign in to contribute updates and help keep fuel prices accurate."
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-12 pb-8 px-4 relative overflow-hidden">
        {/* Enhanced radial glow background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate(-1)}
              className="w-12 h-12 bg-white dark:bg-neutral-900 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl shadow-black/20 hover:scale-110 transition-transform border-2 border-white/40"
            >
              <ArrowLeft className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
            </button>
            <h1 className="text-3xl font-bold text-white drop-shadow-2xl tracking-tight">Update Fuel Price</h1>
          </div>
          <p className="text-white/95 text-sm font-medium drop-shadow-lg pl-1">
            Petron Quezon Avenue
          </p>
        </div>
      </div>

      {/* Location Status */}
      <div className="px-4 py-4">
        {isNearStation ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-400/50 rounded-2xl p-5 flex items-start gap-3 shadow-xl shadow-emerald-500/10">
            <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-emerald-600 mb-1">
                Location Verified
              </div>
              <div className="text-sm text-emerald-600/80">
                You are within range to update prices for this station
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-950/30 border-2 border-yellow-400/50 rounded-2xl p-5 flex items-start gap-3 shadow-xl shadow-yellow-500/10">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-yellow-600 mb-1">
                Too Far from Station
              </div>
              <div className="text-sm text-yellow-600/80">
                Please move closer to the station to update prices
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Select Fuel Type
          </label>
          <div className="space-y-2">
            {fuelTypes.map((fuel) => (
              <button
                key={fuel.id}
                type="button"
                onClick={() => setSelectedFuel(fuel.id)}
                className={`w-full p-5 rounded-2xl border-2 transition-all text-left shadow-lg hover:shadow-xl hover:scale-[1.02] ${
                  selectedFuel === fuel.id
                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 shadow-emerald-500/20"
                    : "border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-emerald-400/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">
                      {fuel.label}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Current: ₱{fuel.currentPrice.toFixed(2)}
                    </div>
                  </div>
                  {selectedFuel === fuel.id && (
                    <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedFuel && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              New Price per Liter
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                ₱
              </span>
              <input
                type="number"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-4 text-2xl font-bold bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent shadow-xl text-foreground"
                required
              />
            </div>
            {selectedFuelData && newPrice && (
              <div className="mt-3 p-4 bg-gray-100 dark:bg-neutral-800 rounded-xl border-2 border-gray-200 dark:border-neutral-700 shadow-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Price Change:</span>
                  <span
                    className={`font-semibold ${
                      parseFloat(newPrice) < selectedFuelData.currentPrice
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {parseFloat(newPrice) < selectedFuelData.currentPrice ? "↓" : "↑"}{" "}
                    ₱
                    {Math.abs(
                      parseFloat(newPrice) - selectedFuelData.currentPrice
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-400/30 rounded-2xl p-5 shadow-xl shadow-emerald-500/10">
          <h4 className="font-semibold text-foreground mb-2">
            Price Update Guidelines
          </h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Verify the price from the station display</li>
            <li>• Update only if you're currently at the station</li>
            <li>• Double-check your entered price for accuracy</li>
            <li>• Report any issues or concerns separately</li>
          </ul>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            fullWidth
            disabled={!selectedFuel || !newPrice || !isNearStation}
          >
            Submit Price Update
          </Button>
        </div>
      </form>
    </div>
    </>
  );
}
