import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, AlertCircle, CheckCircle2, MapPinned, Store } from "lucide-react";
import { AuthPrompt } from "@/shared/components/AuthPrompt";
import { useAuth } from "@/app/providers/AuthContext";
import { getStationById, submitStationIssueReport } from "@/shared/utils/stationStorage";
import { toast } from "sonner";

const issueTypes = [
  "Incorrect station information",
  "Wrong location pin",
  "Station closed",
  "Station temporarily unavailable",
  "Duplicate station",
  "Incorrect brand/logo",
  "Other station-related concern",
];

export function ReportIssue() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [station, setStation] = useState(null);
  const [issueType, setIssueType] = useState("");
  const [notes, setNotes] = useState("");
  const [reporterReference, setReporterReference] = useState(() => user?.email || "frontend-tester");
  const [submitted, setSubmitted] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setStation(getStationById(id));
  }, [id]);

  useEffect(() => {
    if (user?.email) {
      setReporterReference(user.email);
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

    if (!issueType) {
      toast.error("Please select an issue type.");
      return;
    }

    setIsSubmitting(true);
    const result = submitStationIssueReport(id, {
      issueType,
      details: notes,
      reporterReference,
    });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.message || "Unable to submit station issue report.");
      return;
    }

    setSubmitted(true);
    setTimeout(() => {
      navigate(-1);
    }, 1600);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-500 shadow-xl shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">Report Submitted</h2>
          <p className="text-sm text-muted-foreground font-medium">The station issue report has been saved locally for frontend testing.</p>
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
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-gray-100 dark:border-neutral-800 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                <Store className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="font-semibold text-foreground">{station?.name || "Selected station"}</div>
                <div className="text-sm text-muted-foreground mt-1">{station?.address || "Station reference will be attached to this issue report."}</div>
              </div>
            </div>
          </div>

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

          {issueType && (
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-4 uppercase tracking-widest">Additional Details</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe the station issue in more detail. Example: the map pin is one block away from the actual station entrance."
                className="w-full p-5 rounded-2xl border-2 border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:border-emerald-500 outline-none transition-all shadow-sm"
                rows={4}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-500 mb-4 uppercase tracking-widest">Reporter Reference</label>
            <input
              type="text"
              value={reporterReference}
              onChange={(e) => setReporterReference(e.target.value)}
              placeholder="frontend-tester"
              className="w-full p-4 rounded-2xl border-2 border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:border-emerald-500 outline-none transition-all shadow-sm text-foreground"
            />
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-4 flex items-start gap-3">
            <MapPinned className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-semibold mb-1">Station Issues only</p>
              <p className="text-muted-foreground">Use this form for station-related problems like wrong location, duplicate listings, and closed stations. Fuel price submissions belong in Report Fuel Price.</p>
            </div>
          </div>

          {issueType && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-all"
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
