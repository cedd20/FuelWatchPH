import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  MapPin,
  MessageSquareQuote,
  ShieldCheck,
  Sparkles,
  UserRound,
  XCircle,
} from "lucide-react";

import { api as apiClient } from "@/lib/apiClient";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { cn } from "@/shared/components/ui/utils";

function formatStatusLabel(status) {
  return (status || "pending").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusColor(status) {
  switch (status) {
    case "resolved":
      return "border-emerald-500/30 bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-300";
    case "dismissed":
      return "border-rose-500/30 bg-rose-500/[0.12] text-rose-700 dark:text-rose-300";
    case "under_review":
      return "border-sky-500/30 bg-sky-500/[0.12] text-sky-700 dark:text-sky-300";
    default:
      return "border-amber-500/30 bg-amber-500/[0.12] text-amber-700 dark:text-amber-300";
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

const statusIcons = {
  pending: Clock3,
  under_review: AlertCircle,
  resolved: CheckCircle2,
  dismissed: XCircle,
};

function StatusBadge({ status }) {
  const Icon = statusIcons[status] || Clock3;

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        getStatusColor(status),
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.15} />
      {formatStatusLabel(status)}
    </Badge>
  );
}

function DetailBlock({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[20px] border border-[rgba(25,56,52,0.12)] bg-white/[0.72] p-4 shadow-[0_14px_35px_rgba(16,33,30,0.05)] dark:border-white/[0.07] dark:bg-white/[0.03]">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
        <Icon className="h-3.5 w-3.5" strokeWidth={2.1} />
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold leading-6 text-[var(--foreground)] dark:text-white">
        {value || "Not available"}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="relative overflow-hidden px-4 py-5 lg:px-8 lg:py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(42,107,88,0.1),transparent_30%),linear-gradient(180deg,rgba(244,247,245,0.85),rgba(237,243,239,0.8))] dark:bg-[radial-gradient(circle_at_top_left,rgba(42,107,88,0.28),transparent_30%),linear-gradient(180deg,rgba(5,10,9,0.96),rgba(8,17,15,0.98))]" />
      <div className="relative mx-auto max-w-[1500px] space-y-4 sm:space-y-6 lg:space-y-8">
        <Card className="rounded-[32px] border-[rgba(25,56,52,0.12)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(233,239,235,0.94))] dark:border-white/[0.08] dark:bg-[linear-gradient(135deg,rgba(25,56,52,0.98),rgba(8,17,15,0.98))]">
          <CardContent className="space-y-4 p-5 sm:p-7 lg:p-8">
            <div className="h-10 w-40 animate-pulse rounded-full bg-[rgba(25,56,52,0.08)] dark:bg-white/[0.06]" />
            <div className="h-8 w-72 animate-pulse rounded-full bg-[rgba(25,56,52,0.08)] dark:bg-white/[0.06]" />
            <div className="h-4 w-full max-w-2xl animate-pulse rounded-full bg-[rgba(25,56,52,0.06)] dark:bg-white/[0.04]" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_380px] xl:gap-6">
          <Card className="rounded-[28px] border-[rgba(25,56,52,0.12)] dark:border-white/[0.08]">
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="h-28 animate-pulse rounded-[22px] bg-[rgba(25,56,52,0.06)] dark:bg-white/[0.04]" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="h-24 animate-pulse rounded-[20px] bg-[rgba(25,56,52,0.06)] dark:bg-white/[0.04]" />
                <div className="h-24 animate-pulse rounded-[20px] bg-[rgba(25,56,52,0.06)] dark:bg-white/[0.04]" />
              </div>
              <div className="h-40 animate-pulse rounded-[22px] bg-[rgba(25,56,52,0.06)] dark:bg-white/[0.04]" />
            </CardContent>
          </Card>
          <Card className="rounded-[28px] border-[rgba(25,56,52,0.12)] dark:border-white/[0.08]">
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="h-24 animate-pulse rounded-[20px] bg-[rgba(25,56,52,0.06)] dark:bg-white/[0.04]" />
              <div className="h-40 animate-pulse rounded-[22px] bg-[rgba(25,56,52,0.06)] dark:bg-white/[0.04]" />
              <div className="h-12 animate-pulse rounded-full bg-[rgba(25,56,52,0.06)] dark:bg-white/[0.04]" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

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
    return <LoadingState />;
  }

  if (!report) {
    return (
      <div className="relative overflow-hidden px-4 py-5 lg:px-8 lg:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(42,107,88,0.1),transparent_30%),linear-gradient(180deg,rgba(244,247,245,0.85),rgba(237,243,239,0.8))] dark:bg-[radial-gradient(circle_at_top_left,rgba(42,107,88,0.28),transparent_30%),linear-gradient(180deg,rgba(5,10,9,0.96),rgba(8,17,15,0.98))]" />
        <div className="relative mx-auto max-w-[1500px]">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/station-reports")}
            className="mb-4 rounded-full border-[rgba(25,56,52,0.14)] bg-white/[0.86] px-4 dark:border-white/[0.08] dark:bg-white/[0.04]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Button>
          <Card className="rounded-[28px] border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(238,244,240,0.96))] shadow-[0_24px_70px_rgba(16,33,30,0.08)] dark:border-white/[0.08] dark:bg-[linear-gradient(180deg,rgba(25,56,52,0.94),rgba(8,18,16,0.98))] dark:shadow-[0_30px_80px_rgba(0,0,0,0.36)]">
            <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/[0.12] text-amber-700 dark:text-amber-300">
                <AlertCircle className="h-7 w-7" strokeWidth={2.1} />
              </div>
              <div className="mt-4 text-xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
                Report not found
              </div>
              <div className="mt-2 max-w-md text-sm leading-6 text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                This station report could not be loaded. It may have been removed or is no longer available.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden px-4 py-5 lg:px-8 lg:py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(42,107,88,0.1),transparent_30%),radial-gradient(circle_at_85%_0%,rgba(52,211,153,0.08),transparent_22%),linear-gradient(180deg,rgba(244,247,245,0.85),rgba(237,243,239,0.8))] dark:bg-[radial-gradient(circle_at_top_left,rgba(42,107,88,0.28),transparent_30%),radial-gradient(circle_at_85%_0%,rgba(52,211,153,0.12),transparent_22%),linear-gradient(180deg,rgba(5,10,9,0.96),rgba(8,17,15,0.98))]" />
      <div className="absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(25,56,52,0.04),transparent)] dark:bg-[linear-gradient(180deg,rgba(25,56,52,0.22),transparent)]" />

      <div className="relative mx-auto max-w-[1500px] space-y-4 sm:space-y-6 lg:space-y-8">
        <Card className="overflow-hidden rounded-[32px] border-[rgba(25,56,52,0.12)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(233,239,235,0.94))] shadow-[0_28px_90px_rgba(16,33,30,0.08)] dark:border-white/[0.08] dark:bg-[linear-gradient(135deg,rgba(25,56,52,0.98),rgba(8,17,15,0.98))] dark:shadow-[0_35px_100px_rgba(0,0,0,0.42)]">
          <CardContent className="relative p-5 sm:p-7 lg:p-8">
            <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.12),transparent_62%)] dark:block" />
            <div className="relative space-y-4 sm:space-y-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/station-reports")}
                className="rounded-full border-[rgba(25,56,52,0.14)] bg-white/[0.86] px-4 dark:border-white/[0.08] dark:bg-white/[0.04]"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Reports
              </Button>

              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/[0.15] bg-emerald-500/[0.08] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-800 dark:text-emerald-200">
                    <Sparkles className="h-3.5 w-3.5" />
                    Station Report Details
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white lg:text-4xl">
                      {report.stationName || "Station issue review"}
                    </h1>
                    <p className="text-sm leading-7 text-[var(--app-text-soft)] dark:text-[var(--app-text-soft)] sm:text-base">
                      Review the submitted issue, confirm moderation notes, and update the station report workflow without leaving the admin review surface.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3 xl:items-end">
                  <StatusBadge status={report.status} />
                  <div className="rounded-[22px] border border-emerald-500/[0.16] bg-white/[0.72] px-4 py-3 text-sm shadow-[0_14px_35px_rgba(16,33,30,0.06)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.04]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                      Report Reference
                    </div>
                    <div className="mt-1 font-semibold text-[var(--foreground)] dark:text-white">
                      Station report #{report.id}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_380px] xl:gap-6">
          <div className="space-y-4 sm:space-y-5">
            <Card className="overflow-hidden rounded-[28px] border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(238,244,240,0.96))] shadow-[0_24px_70px_rgba(16,33,30,0.08)] dark:border-white/[0.08] dark:bg-[linear-gradient(180deg,rgba(25,56,52,0.94),rgba(8,18,16,0.98))] dark:shadow-[0_30px_80px_rgba(0,0,0,0.36)]">
              <CardHeader className="gap-2 border-b border-[rgba(25,56,52,0.08)] px-5 pb-3 pt-5 dark:border-white/[0.06] sm:px-6 sm:pb-4 sm:pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/[0.12] dark:text-emerald-300">
                    <MapPin className="h-4.5 w-4.5" strokeWidth={2.2} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold tracking-tight text-[var(--foreground)] dark:text-white sm:text-xl">
                      Application Information
                    </CardTitle>
                    <div className="mt-1 text-sm text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                      Station details and submitted report metadata
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-5 py-4 sm:px-6 sm:py-5">
                <div className="rounded-[22px] border border-[rgba(25,56,52,0.12)] bg-white/[0.75] p-4 shadow-[0_14px_35px_rgba(16,33,30,0.05)] dark:border-white/[0.07] dark:bg-white/[0.03]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                    Station
                  </div>
                  <div className="mt-2 text-lg font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
                    {report.stationName || "Unknown station"}
                  </div>
                  <div className="mt-2 flex items-start gap-2 text-sm leading-6 text-[var(--app-text-soft)] dark:text-[var(--app-text-soft)]">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{report.stationAddress || "No address provided."}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailBlock
                    icon={FileText}
                    label="Report Type"
                    value={report.reportTypeLabel || report.reportType}
                  />
                  <DetailBlock
                    icon={Clock3}
                    label="Submitted"
                    value={formatDateTime(report.reportDate)}
                  />
                  <DetailBlock
                    icon={UserRound}
                    label="Reported By"
                    value={report.reportedBy || "Unknown user"}
                  />
                  <DetailBlock
                    icon={MessageSquareQuote}
                    label="Reporter Email"
                    value={report.reporterEmail || "No email provided"}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[28px] border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(238,244,240,0.96))] shadow-[0_24px_70px_rgba(16,33,30,0.08)] dark:border-white/[0.08] dark:bg-[linear-gradient(180deg,rgba(25,56,52,0.94),rgba(8,18,16,0.98))] dark:shadow-[0_30px_80px_rgba(0,0,0,0.36)]">
              <CardHeader className="gap-2 border-b border-[rgba(25,56,52,0.08)] px-5 pb-3 pt-5 dark:border-white/[0.06] sm:px-6 sm:pb-4 sm:pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/[0.12] dark:text-emerald-300">
                    <FileText className="h-4.5 w-4.5" strokeWidth={2.2} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold tracking-tight text-[var(--foreground)] dark:text-white sm:text-xl">
                      Issue Details
                    </CardTitle>
                    <div className="mt-1 text-sm text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                      Description shared by the reporter
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-5 py-4 sm:px-6 sm:py-5">
                <div className="rounded-[22px] border border-[rgba(25,56,52,0.12)] bg-white/[0.72] p-4 text-sm leading-7 text-[var(--app-text-soft)] shadow-[0_14px_35px_rgba(16,33,30,0.05)] dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-[var(--app-text-soft)] sm:p-5">
                  {report.description || "No description provided."}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 sm:space-y-5">
            <Card className="overflow-hidden rounded-[28px] border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(238,244,240,0.96))] shadow-[0_24px_70px_rgba(16,33,30,0.08)] dark:border-white/[0.08] dark:bg-[linear-gradient(180deg,rgba(25,56,52,0.94),rgba(8,18,16,0.98))] dark:shadow-[0_30px_80px_rgba(0,0,0,0.36)]">
              <CardHeader className="gap-2 border-b border-[rgba(25,56,52,0.08)] px-5 pb-3 pt-5 dark:border-white/[0.06] sm:px-6 sm:pb-4 sm:pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/[0.12] dark:text-emerald-300">
                    <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2.2} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold tracking-tight text-[var(--foreground)] dark:text-white sm:text-xl">
                      Review Panel
                    </CardTitle>
                    <div className="mt-1 text-sm text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                      Update moderation status and notes
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-5 py-4 sm:px-6 sm:py-5">
                <div className="rounded-[22px] border border-[rgba(25,56,52,0.12)] bg-white/[0.72] p-4 dark:border-white/[0.07] dark:bg-white/[0.03]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                    Current Status
                  </div>
                  <div className="mt-3">
                    <StatusBadge status={report.status} />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--foreground)] dark:text-white">
                    New Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(event) => setSelectedStatus(event.target.value)}
                    className="w-full rounded-[18px] border border-[rgba(25,56,52,0.14)] bg-white/[0.86] px-4 py-3 text-sm font-medium text-[var(--foreground)] outline-none transition-all focus:border-emerald-500/[0.3] focus:ring-4 focus:ring-emerald-500/[0.12] dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                  >
                    {ACTIONS.map((action) => (
                      <option key={action.value} value={action.value}>
                        {action.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[var(--foreground)] dark:text-white">
                    Admin Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Add context for the review decision, follow-up steps, or station verification notes..."
                    rows={7}
                    className="w-full rounded-[18px] border border-[rgba(25,56,52,0.14)] bg-white/[0.86] px-4 py-3 text-sm leading-6 text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--app-text-muted)] focus:border-emerald-500/[0.3] focus:ring-4 focus:ring-emerald-500/[0.12] dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white resize-none"
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleSubmitUpdate}
                  disabled={isSaving}
                  className="w-full rounded-full bg-[linear-gradient(135deg,#1f6a55,#193834)] py-6 text-white hover:opacity-95 disabled:opacity-70"
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Save Report Update
                </Button>

                {feedback ? (
                  <div className="rounded-[18px] border border-[rgba(25,56,52,0.12)] bg-white/[0.72] p-4 text-sm leading-6 text-[var(--app-text-soft)] dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-[var(--app-text-soft)]">
                    {feedback}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[28px] border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(238,244,240,0.96))] shadow-[0_24px_70px_rgba(16,33,30,0.08)] dark:border-white/[0.08] dark:bg-[linear-gradient(180deg,rgba(25,56,52,0.94),rgba(8,18,16,0.98))] dark:shadow-[0_30px_80px_rgba(0,0,0,0.36)]">
              <CardHeader className="gap-2 border-b border-[rgba(25,56,52,0.08)] px-5 pb-3 pt-5 dark:border-white/[0.06] sm:px-6 sm:pb-4 sm:pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/[0.12] dark:text-emerald-300">
                    <MessageSquareQuote className="h-4.5 w-4.5" strokeWidth={2.2} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold tracking-tight text-[var(--foreground)] dark:text-white sm:text-xl">
                      Review Summary
                    </CardTitle>
                    <div className="mt-1 text-sm text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                      Existing moderation notes and audit details
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 px-5 py-4 sm:px-6 sm:py-5">
                <DetailBlock
                  icon={MessageSquareQuote}
                  label="Existing Notes"
                  value={report.adminNotes || "No admin notes yet."}
                />
                <DetailBlock
                  icon={UserRound}
                  label="Reviewed By"
                  value={report.reviewedBy || "Not reviewed yet"}
                />
                <DetailBlock
                  icon={Clock3}
                  label="Reviewed At"
                  value={report.reviewedAt ? formatDateTime(report.reviewedAt) : "Not reviewed yet"}
                />
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(238,244,240,0.96))] shadow-[0_24px_70px_rgba(16,33,30,0.08)] dark:border-white/[0.08] dark:bg-[linear-gradient(180deg,rgba(25,56,52,0.94),rgba(8,18,16,0.98))] dark:shadow-[0_30px_80px_rgba(0,0,0,0.36)]">
              <CardContent className="space-y-3 p-5 sm:p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)] dark:text-white">
                  <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                  Moderation Guidance
                </div>
                <div className="space-y-2 text-sm leading-6 text-[var(--app-text-soft)] dark:text-[var(--app-text-soft)]">
                  <div className="rounded-[18px] border border-[rgba(25,56,52,0.12)] bg-white/[0.7] px-4 py-3 dark:border-white/[0.07] dark:bg-white/[0.03]">
                    Use <span className="font-semibold text-[var(--foreground)] dark:text-white">Under Review</span> while confirming station changes or checking supporting details.
                  </div>
                  <div className="rounded-[18px] border border-[rgba(25,56,52,0.12)] bg-white/[0.7] px-4 py-3 dark:border-white/[0.07] dark:bg-white/[0.03]">
                    Mark as <span className="font-semibold text-[var(--foreground)] dark:text-white">Resolved</span> once the station information has been verified or corrected.
                  </div>
                  <div className="rounded-[18px] border border-[rgba(25,56,52,0.12)] bg-white/[0.7] px-4 py-3 dark:border-white/[0.07] dark:bg-white/[0.03]">
                    Use <span className="font-semibold text-[var(--foreground)] dark:text-white">Dismissed</span> for invalid, duplicate, or unsubstantiated reports.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
