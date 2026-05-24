import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Loader2,
  MessageSquare,
  User,
  XCircle,
} from "lucide-react";
import { api as apiClient } from "@/lib/apiClient";

function formatStatusLabel(status) {
  return (status || "pending").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusColor(status) {
  switch (status) {
    case "resolved":
      return "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 border-emerald-400/40";
    case "dismissed":
      return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-950/50 border-gray-400/40";
    case "under_review":
      return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/50 border-blue-400/40";
    default:
      return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-950/50 border-yellow-400/40";
  }
}

function formatDateTime(value) {
  if (!value) return "No timestamp";
  return new Date(value).toLocaleString();
}

const ACTIONS = [
  { value: "under_review", label: "Mark Under Review" },
  { value: "resolved", label: "Resolve Report" },
  { value: "dismissed", label: "Dismiss Report" },
];

export function StationReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("under_review");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    async function fetchReport() {
      setIsLoading(true);
      try {
        const data = await apiClient.get(`/admin/station-reports/${id}`);
        setReport(data || null);
        setSelectedStatus(data?.status === "pending" ? "under_review" : data?.status || "under_review");
        setNotes(data?.adminNotes || "");
      } catch (error) {
        console.error("Failed to fetch station report:", error);
        setReport(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReport();
  }, [id]);

  async function handleSubmitUpdate() {
    if (!report) return;
    setIsSaving(true);
    setFeedback("");
    try {
      await apiClient.post(`/admin/station-reports/${report.id}/update`, {
        status: selectedStatus,
        admin_notes: notes.trim() || null,
      });
      const refreshed = await apiClient.get(`/admin/station-reports/${report.id}`);
      setReport(refreshed || null);
      setNotes(refreshed?.adminNotes || notes);
      setSelectedStatus(refreshed?.status || selectedStatus);
      setFeedback(`Report updated to ${formatStatusLabel(selectedStatus)}.`);
    } catch (error) {
      console.error("Failed to update station report:", error);
      setFeedback(error.message || "Failed to update report.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="max-w-[1200px] mx-auto min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-4 lg:p-8">
        <div className="max-w-[1200px] mx-auto">
          <button
            onClick={() => navigate("/admin/station-reports")}
            className="mb-6 flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-700 rounded-lg font-bold text-sm text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </button>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 shadow-lg p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Report not found</h2>
            <p className="text-sm text-muted-foreground">This station report could not be loaded.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-[1200px] mx-auto">
        <button
          onClick={() => navigate("/admin/station-reports")}
          className="mb-4 lg:mb-6 flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-700 rounded-lg font-bold text-sm lg:text-base text-foreground hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reports
        </button>

        <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.9fr] gap-6">
          <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 lg:p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <div className="text-white/80 text-sm mb-2">Station report #{report.id}</div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white">{report.stationName}</h1>
                    <p className="text-white/80 text-sm mt-2">{report.stationAddress || "No address provided"}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap self-start ${getStatusColor(report.status)}`}>
                    {formatStatusLabel(report.status)}
                  </span>
                </div>
              </div>

              <div className="p-5 lg:p-6 space-y-6">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground font-bold mb-2">Report Type</div>
                  <div className="text-lg font-bold text-foreground">{report.reportType}</div>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground font-bold mb-2">Description</div>
                  <div className="rounded-xl bg-gray-50 dark:bg-neutral-800 p-4 text-sm text-foreground leading-relaxed">
                    {report.description || "No description provided."}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-200 dark:border-neutral-700 p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm font-semibold mb-2">
                      <User className="w-4 h-4" />
                      Reporter
                    </div>
                    <div className="font-bold text-foreground">{report.reportedBy || "Unknown user"}</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-neutral-700 p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm font-semibold mb-2">
                      <Clock className="w-4 h-4" />
                      Submitted
                    </div>
                    <div className="font-bold text-foreground">{formatDateTime(report.reportDate)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 shadow-lg p-5 lg:p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Admin Action</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">New Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(event) => setSelectedStatus(event.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg text-foreground focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none font-medium"
                  >
                    {ACTIONS.map((action) => (
                      <option key={action.value} value={action.value}>
                        {action.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Admin Notes</label>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Add any context for the moderation decision..."
                    rows={6}
                    className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg text-foreground focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none resize-none font-medium"
                  />
                </div>

                <button
                  onClick={handleSubmitUpdate}
                  disabled={isSaving}
                  className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-bold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Save Report Update
                </button>

                {feedback && (
                  <div className="rounded-lg bg-gray-50 dark:bg-neutral-800 p-3 text-sm text-muted-foreground">
                    {feedback}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-gray-200 dark:border-neutral-700 shadow-lg p-5 lg:p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Review Summary</h2>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground">Existing Notes</div>
                    <div className="text-muted-foreground mt-1">{report.adminNotes || "No admin notes yet."}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground">Reviewed By</div>
                    <div className="text-muted-foreground mt-1">{report.reviewedBy || "Not reviewed yet."}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground">Reviewed At</div>
                    <div className="text-muted-foreground mt-1">{formatDateTime(report.reviewedAt)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
