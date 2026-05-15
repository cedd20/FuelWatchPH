import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, AlertCircle, CheckCircle2, Upload } from "lucide-react";
import { AuthPrompt } from "@/shared/components/AuthPrompt";
import { useAuth } from "@/app/providers/AuthContext";

const issueTypes = [
  "Incorrect fuel price",
  "Station closed",
  "Wrong location",
  "Duplicate station",
  "Fuel type not available",
  "Other issue",
];

const mockPrices = [
  { type: "DSL", price: 58.40, lastUpdated: "2 hours ago" },
  { type: "PDSL", price: 62.50, lastUpdated: "2 hours ago" },
  { type: "UL91", price: 64.30, lastUpdated: "1 hour ago" },
  { type: "PR95", price: 68.20, lastUpdated: "1 hour ago" },
  { type: "PR97", price: 72.80, lastUpdated: "3 hours ago" },
];

export function ReportIssue() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [issueType, setIssueType] = useState("");
  const [selectedPrices, setSelectedPrices] = useState([]);
  const [corrections, setCorrections] = useState({});
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
    }
  }, [isAuthenticated]);

  const togglePriceSelection = (fuelType) => {
    if (selectedPrices.includes(fuelType)) {
      setSelectedPrices(selectedPrices.filter((f) => f !== fuelType));
      const newCorrections = { ...corrections };
      delete newCorrections[fuelType];
      setCorrections(newCorrections);
    } else {
      setSelectedPrices([...selectedPrices, fuelType]);
    }
  };

  const handleCorrectionChange = (fuelType, value) => {
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
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-500 shadow-xl shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">Report Submitted</h2>
          <p className="text-sm text-muted-foreground font-medium">Thank you for helping keep FuelWatch PH accurate.</p>
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
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 pb-20">
        <div className="bg-emerald-600 pt-12 pb-8 px-6 relative overflow-hidden">
          <div className="relative z-10 max-w-4xl mx-auto">
            <button onClick={() => navigate(-1)} className="text-white mb-6 flex items-center gap-2 font-bold">
              <ArrowLeft className="w-5 h-5" />
              Report Issue
            </button>
            <h1 className="text-3xl font-bold text-white tracking-tight">Report Issue</h1>
            <p className="text-white/90 text-sm mt-2">Help us keep station information accurate</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-4 uppercase tracking-widest">What's the issue?</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {issueTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setIssueType(type)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    issueType === type 
                      ? "border-emerald-500 bg-emerald-50 text-emerald-600 font-bold" 
                      : "border-gray-100 bg-white dark:bg-neutral-900 text-muted-foreground"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {issueType === "Incorrect fuel price" && (
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-4 uppercase tracking-widest">Which fuel prices are incorrect?</label>
              <div className="space-y-3">
                {mockPrices.map((fuel) => (
                  <button
                    key={fuel.type}
                    onClick={() => togglePriceSelection(fuel.type)}
                    className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                      selectedPrices.includes(fuel.type) 
                        ? "border-emerald-500 bg-emerald-50" 
                        : "border-gray-100 bg-white dark:bg-neutral-900"
                    }`}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${selectedPrices.includes(fuel.type) ? "border-emerald-500 bg-emerald-500" : "border-gray-200"}`}>
                        {selectedPrices.includes(fuel.type) && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <div className="font-bold text-foreground">{fuel.type}</div>
                    </div>
                    <div className="text-right font-bold text-foreground">₱{fuel.price.toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {issueType && (
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-4 uppercase tracking-widest">Additional Details</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe the issue... (e.g., station is closed for renovation)"
                className="w-full p-5 rounded-2xl border-2 border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:border-emerald-500 outline-none transition-all shadow-sm"
                rows={4}
              />
            </div>
          )}

          {issueType && (
            <button
              onClick={handleSubmit}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-all"
            >
              Submit Report
            </button>
          )}
        </div>
      </div>
    </>
  );
}
