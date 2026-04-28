import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/shared/components/Button";
import { AuthPrompt } from "@/shared/components/AuthPrompt";
import { useAuth } from "@/app/providers/AuthContext";
import { toast } from "sonner";

const reportReasons = [
  "Price is incorrect",
  "Station is closed",
  "Wrong fuel type",
  "Outdated information",
  "Duplicate station",
  "Other issue",
];

export function ReportPrice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [selectedReason, setSelectedReason] = useState("");
  const [details, setDetails] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
    }
  }, [isAuthenticated]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

    if (!selectedReason) {
      toast.error("Please select a reason for reporting");
      return;
    }

    setShowSuccess(true);
    setTimeout(() => {
      toast.success("Report submitted successfully!");
      navigate(`/app/station/${id}`);
    }, 2000);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Report Submitted</h2>
        <p className="text-center text-muted-foreground">Thank you for helping keep our data accurate</p>
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
        message="Sign in to report issues and help maintain accurate fuel price data."
      />
      <div className="min-h-screen bg-background pb-20">
        <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 pt-12 pb-6 px-4">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">Report Issue</h1>
          </div>
          <p className="text-white/80 text-sm">Petron Quezon Avenue</p>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">What's the issue?</label>
            <div className="space-y-2">
              {reportReasons.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    selectedReason === reason ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : "border-border bg-white dark:bg-neutral-900 hover:border-emerald-500/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{reason}</span>
                    {selectedReason === reason && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Additional Details (Optional)</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide more information about the issue"
              rows={4}
              className="w-full px-4 py-3 bg-white dark:bg-neutral-900 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none text-foreground"
            />
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-semibold mb-1">Your report helps everyone</p>
              <p className="text-muted-foreground">We'll review this report and take appropriate action to maintain data accuracy.</p>
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" fullWidth disabled={!selectedReason} variant="primary">Submit Report</Button>
          </div>
        </form>
      </div>
    </>
  );
}
