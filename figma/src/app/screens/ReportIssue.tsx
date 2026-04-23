import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, AlertCircle, CheckCircle2, Upload } from "lucide-react";
import { FUEL_TYPES } from "../utils/fuelTypes";
import { AuthPrompt } from "../components/AuthPrompt";
import { useAuth } from "../context/AuthContext";

interface FuelPrice {
  type: string;
  price: number;
  lastUpdated: string;
}

const issueTypes = [
  "Incorrect fuel price",
  "Station closed",
  "Wrong location",
  "Duplicate station",
  "Fuel type not available",
  "Other issue",
];

const mockPrices: FuelPrice[] = [
  { type: "Diesel", price: 58.40, lastUpdated: "2 hours ago" },
  { type: "Premium Diesel", price: 62.50, lastUpdated: "2 hours ago" },
  { type: "Unleaded 91", price: 64.30, lastUpdated: "1 hour ago" },
  { type: "Premium 95", price: 68.20, lastUpdated: "1 hour ago" },
  { type: "Premium 97", price: 72.80, lastUpdated: "3 hours ago" },
];

export function ReportIssue() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [issueType, setIssueType] = useState("");
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
    }
  }, [isAuthenticated]);

  const togglePriceSelection = (fuelType: string) => {
    if (selectedPrices.includes(fuelType)) {
      setSelectedPrices(selectedPrices.filter((f) => f !== fuelType));
      const newCorrections = { ...corrections };
      delete newCorrections[fuelType];
      setCorrections(newCorrections);
    } else {
      setSelectedPrices([...selectedPrices, fuelType]);
    }
  };

  const handleCorrectionChange = (fuelType: string, value: string) => {
    setCorrections({ ...corrections, [fuelType]: value });
  };

  const handleSubmit = () => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

    setSubmitted(true);
    setTimeout(() => {
      navigate(-1);
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Report Submitted
          </h2>
          <p className="text-sm text-muted-foreground">
            Thank you for helping keep FuelWatch PH accurate.
          </p>
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
        message="Sign in to report issues and help maintain accurate station information."
      />
      <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary-dark pt-12 pb-6 px-4">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white">Report Issue</h1>
        </div>
        <p className="text-primary-foreground/80 text-sm">
          Help us keep station information accurate
        </p>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Issue Type Selection */}
        <div>
          <label className="block font-semibold text-foreground mb-3">
            What's the issue?
          </label>
          <div className="space-y-2">
            {issueTypes.map((type) => (
              <button
                key={type}
                onClick={() => setIssueType(type)}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  issueType === type
                    ? "bg-primary/10 border-primary"
                    : "bg-card border-border hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      issueType === type
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    }`}
                  >
                    {issueType === type && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <span className="font-medium text-foreground">{type}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Incorrect Price Selection */}
        {issueType === "Incorrect fuel price" && (
          <div>
            <label className="block font-semibold text-foreground mb-3">
              Which fuel prices are incorrect?
            </label>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {mockPrices.map((fuel, index) => (
                <button
                  key={fuel.type}
                  onClick={() => togglePriceSelection(fuel.type)}
                  className={`w-full text-left p-4 transition-colors ${
                    index < mockPrices.length - 1 ? "border-b border-border" : ""
                  } ${
                    selectedPrices.includes(fuel.type)
                      ? "bg-primary/5"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedPrices.includes(fuel.type)}
                        onChange={() => {}}
                        className="w-5 h-5 rounded border-2 border-muted-foreground"
                      />
                      <div>
                        <div className="font-medium text-foreground">
                          {fuel.type}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Updated {fuel.lastUpdated}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">
                        ₱{fuel.price.toFixed(2)}/L
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Corrected Prices */}
        {issueType === "Incorrect fuel price" && selectedPrices.length > 0 && (
          <div>
            <label className="block font-semibold text-foreground mb-2">
              Corrected Prices (Optional)
            </label>
            <p className="text-sm text-muted-foreground mb-3">
              Add the correct price if you know it
            </p>
            <div className="space-y-3">
              {selectedPrices.map((fuelType) => {
                const currentPrice = mockPrices.find((p) => p.type === fuelType);
                return (
                  <div key={fuelType} className="bg-card border border-border rounded-xl p-4">
                    <div className="font-medium text-foreground mb-2">
                      {fuelType}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">
                          Current price
                        </div>
                        <div className="text-sm font-semibold text-foreground">
                          ₱{currentPrice?.price.toFixed(2)}/L
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Corrected price
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={corrections[fuelType] || ""}
                          onChange={(e) =>
                            handleCorrectionChange(fuelType, e.target.value)
                          }
                          placeholder="Optional"
                          className="w-full px-3 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        {issueType && (
          <div>
            <label className="block font-semibold text-foreground mb-2">
              Additional Details
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={4}
              className="w-full px-4 py-3 bg-input-background rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        )}

        {/* Photo Upload Placeholder */}
        {issueType && (
          <div>
            <label className="block font-semibold text-foreground mb-2">
              Photo (Optional)
            </label>
            <button className="w-full p-6 bg-card border-2 border-dashed border-border rounded-xl hover:bg-muted transition-colors">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">
                Upload a photo of the price board
              </div>
            </button>
          </div>
        )}

        {/* Note */}
        {issueType === "Incorrect fuel price" && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm text-foreground">
                Corrections may be reviewed or verified by the community before being published.
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {issueType && (
          <button
            onClick={handleSubmit}
            className="w-full py-4 bg-primary text-white rounded-full font-semibold hover:opacity-90 transition-opacity"
          >
            Submit Report
          </button>
        )}
      </div>
    </div>
    </>
  );
}
