import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock3,
  FileBadge2,
  FileText,
  ImageOff,
  Loader2,
  Mail,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
  XCircle,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";

import {
  useApproveVerificationRequest,
  useRejectVerificationRequest,
  useRequestVerificationCorrection,
  useUpdateVerificationRequestNotes,
  useVerificationRequest,
} from "@/hooks/admin/useVerificationRequests";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { cn } from "@/shared/components/ui/utils";

const statusStyles = {
  pending: "border-amber-500/30 bg-amber-500/[0.12] text-amber-700 dark:text-amber-300",
  approved: "border-emerald-500/30 bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-300",
  rejected: "border-rose-500/30 bg-rose-500/[0.12] text-rose-700 dark:text-rose-300",
  needs_correction: "border-orange-500/30 bg-orange-500/[0.12] text-orange-700 dark:text-orange-300",
  under_review: "border-sky-500/30 bg-sky-500/[0.12] text-sky-700 dark:text-sky-300",
};

const statusIcons = {
  pending: Clock3,
  approved: CheckCircle2,
  rejected: XCircle,
  needs_correction: AlertCircle,
  under_review: AlertCircle,
};

const actionConfig = {
  approve: {
    title: "Approve Verification",
    description: "Confirm that the submitted documents are valid and the applicant can be approved.",
    label: "Admin Note (Optional)",
    placeholder: "Add any context for this approval...",
    confirmLabel: "Approve Request",
    panel: "border-emerald-500/[0.18] bg-[linear-gradient(180deg,rgba(236,253,245,0.95),rgba(221,247,237,0.88))] dark:bg-[linear-gradient(180deg,rgba(15,68,52,0.45),rgba(9,25,20,0.98))]",
    button: "bg-[linear-gradient(135deg,#059669,#0f766e)] text-white hover:opacity-95",
  },
  reject: {
    title: "Reject Verification",
    description: "Reject this submission and provide a clear reason the applicant can understand.",
    label: "Reason for Rejection (Required)",
    placeholder: "Please provide the rejection reason...",
    confirmLabel: "Reject Request",
    panel: "border-rose-500/[0.18] bg-[linear-gradient(180deg,rgba(255,241,242,0.96),rgba(255,228,230,0.92))] dark:bg-[linear-gradient(180deg,rgba(84,20,35,0.45),rgba(24,10,14,0.98))]",
    button: "bg-[linear-gradient(135deg,#e11d48,#be123c)] text-white hover:opacity-95",
  },
  correction: {
    title: "Request Correction",
    description: "Ask the applicant to resubmit updated documents and explain what needs correction.",
    label: "Correction Details (Required)",
    placeholder: "Specify what needs to be corrected...",
    confirmLabel: "Send Correction Request",
    panel: "border-orange-500/[0.18] bg-[linear-gradient(180deg,rgba(255,247,237,0.96),rgba(255,237,213,0.92))] dark:bg-[linear-gradient(180deg,rgba(91,46,9,0.45),rgba(28,16,8,0.98))]",
    button: "bg-[linear-gradient(135deg,#f59e0b,#d97706)] text-white hover:opacity-95",
  },
};

const formatStatusLabel = (status) => {
  if (!status) return "Pending";
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDateTime = (value) => {
  if (!value) return "No timestamp";
  return new Date(value).toLocaleString();
};

const formatDate = (value) => {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString();
};

function AdminStatusBadge({ status, className }) {
  const Icon = statusIcons[status] || Clock3;

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        statusStyles[status] || statusStyles.pending,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      {formatStatusLabel(status)}
    </Badge>
  );
}

function SectionCard({ icon: Icon, title, action, children, contentClassName }) {
  return (
    <Card className="overflow-hidden rounded-[28px] border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(238,244,240,0.96))] shadow-[0_24px_70px_rgba(16,33,30,0.08)] dark:border-white/[0.08] dark:bg-[linear-gradient(180deg,rgba(25,56,52,0.94),rgba(8,18,16,0.98))] dark:shadow-[0_30px_80px_rgba(0,0,0,0.36)]">
      <CardHeader className="gap-2 border-b border-[rgba(25,56,52,0.08)] px-4 pb-3 pt-3 dark:border-white/[0.06] sm:gap-3 sm:px-6 sm:pb-5 sm:pt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] dark:bg-emerald-500/[0.12] dark:text-emerald-300 sm:h-11 sm:w-11">
              <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={2.25} />
            </div>
            <CardTitle className="truncate text-base font-semibold tracking-tight text-[var(--foreground)] dark:text-white sm:text-xl">
              {title}
            </CardTitle>
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className={cn("px-4 pt-3 sm:px-6 sm:pt-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

function DetailItem({ icon: Icon, label, value, tone = "default" }) {
  const toneStyles =
    tone === "accent"
      ? "bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-300"
      : tone === "info"
        ? "bg-sky-500/[0.08] text-sky-700 dark:text-sky-300"
        : "bg-[rgba(25,56,52,0.08)] text-[var(--primary)] dark:text-emerald-300";

  return (
    <div className="rounded-[20px] border border-[rgba(25,56,52,0.12)] bg-white/[0.72] p-3.5 shadow-[0_12px_30px_rgba(16,33,30,0.04)] dark:border-white/[0.07] dark:bg-white/[0.03] sm:p-4">
      <div className="flex items-start gap-3">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", toneStyles)}>
          <Icon className="h-4.5 w-4.5" strokeWidth={2.15} />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
            {label}
          </div>
          <div className="mt-1.5 break-words text-sm font-semibold text-[var(--foreground)] dark:text-white sm:text-base">
            {value || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentPreview({ title, imageUrl, onOpen }) {
  if (!imageUrl) {
    return (
      <div className="rounded-[22px] border border-dashed border-[rgba(25,56,52,0.18)] bg-[rgba(230,240,236,0.52)] px-5 py-8 text-center dark:border-white/[0.08] dark:bg-white/[0.025]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-500/[0.1] text-emerald-700 dark:text-emerald-300">
          <ImageOff className="h-6 w-6" strokeWidth={2.1} />
        </div>
        <div className="mt-4 text-base font-semibold text-[var(--foreground)] dark:text-white">
          {title}
        </div>
        <div className="mt-2 text-sm text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
          No document image is available for this side yet.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-[rgba(25,56,52,0.12)] bg-white/[0.72] p-3 shadow-[0_14px_35px_rgba(16,33,30,0.05)] dark:border-white/[0.07] dark:bg-white/[0.03] sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-[var(--foreground)] dark:text-white sm:text-base">
          {title}
        </div>
        <button
          type="button"
          onClick={() => onOpen(imageUrl)}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-500/[0.18] bg-emerald-500/[0.08] px-3 py-1.5 text-xs font-semibold text-emerald-800 transition-all hover:bg-emerald-500/[0.12] dark:text-emerald-200 dark:hover:bg-emerald-500/[0.16]"
        >
          <ZoomIn className="h-3.5 w-3.5" strokeWidth={2.1} />
          View Full Image
        </button>
      </div>
      <button
        type="button"
        onClick={() => onOpen(imageUrl)}
        className="group block w-full overflow-hidden rounded-[20px] border border-[rgba(25,56,52,0.12)] bg-[rgba(230,240,236,0.7)] dark:border-white/[0.07] dark:bg-black/20"
      >
        <img
          src={imageUrl}
          alt={title}
          className="h-auto min-h-[180px] w-full object-cover transition-transform duration-200 group-hover:scale-[1.01]"
        />
      </button>
    </div>
  );
}

function ActionDialog({
  open,
  type,
  request,
  value,
  onChange,
  onClose,
  onConfirm,
  isProcessing,
}) {
  if (!open || !type) return null;

  const config = actionConfig[type];
  const isDisabled =
    isProcessing ||
    ((type === "reject" || type === "correction") && value.trim() === "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div
        className={cn(
          "w-full max-w-lg overflow-hidden rounded-[28px] border shadow-[0_35px_100px_rgba(0,0,0,0.35)] dark:border-white/[0.08]",
          config.panel,
        )}
      >
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4 dark:border-white/[0.06] sm:px-6">
          <div>
            <div className="text-lg font-semibold tracking-tight text-[var(--foreground)] dark:text-white sm:text-xl">
              {config.title}
            </div>
            <div className="mt-1 text-sm text-[var(--app-text-soft)] dark:text-[var(--app-text-soft)]">
              {request?.full_name || "Unknown applicant"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.04] text-[var(--app-text-muted)] transition-colors hover:bg-black/[0.08] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
          >
            <X className="h-4.5 w-4.5" strokeWidth={2.2} />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <p className="text-sm leading-6 text-[var(--app-text-soft)] dark:text-[var(--app-text-soft)]">
            {config.description}
          </p>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--foreground)] dark:text-white">
              {config.label}
            </label>
            <textarea
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder={config.placeholder}
              rows={4}
              className="w-full rounded-[18px] border border-[rgba(25,56,52,0.12)] bg-white/[0.84] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--app-text-muted)] focus:border-emerald-500/[0.3] focus:ring-4 focus:ring-emerald-500/[0.12] dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
            />
          </div>
          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-full border-[rgba(25,56,52,0.14)] bg-white/[0.8] text-[var(--foreground)] dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isDisabled}
              className={cn("rounded-full px-5", config.button)}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                config.confirmLabel
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="relative overflow-hidden px-4 py-5 lg:px-8 lg:py-8">
      <div className="relative mx-auto max-w-[1600px] space-y-4 sm:space-y-6 lg:space-y-8">
        <Card className="rounded-[32px] border-[rgba(25,56,52,0.12)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(233,239,235,0.94))] dark:border-white/[0.08] dark:bg-[linear-gradient(135deg,rgba(25,56,52,0.98),rgba(8,17,15,0.98))]">
          <CardContent className="space-y-4 p-5 sm:p-7">
            <div className="h-8 w-52 animate-pulse rounded-full bg-[rgba(25,56,52,0.08)] dark:bg-white/[0.06]" />
            <div className="h-4 w-72 animate-pulse rounded-full bg-[rgba(25,56,52,0.06)] dark:bg-white/[0.04]" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.92fr)] xl:gap-8">
          <div className="space-y-4 sm:space-y-6">
            {Array.from({ length: 2 }).map((_, index) => (
              <Card
                key={index}
                className="rounded-[28px] border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(238,244,240,0.96))] dark:border-white/[0.08] dark:bg-[linear-gradient(180deg,rgba(25,56,52,0.94),rgba(8,18,16,0.98))]"
              >
                <CardContent className="space-y-4 p-5 sm:p-6">
                  <div className="h-6 w-44 animate-pulse rounded-full bg-[rgba(25,56,52,0.08)] dark:bg-white/[0.06]" />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((__, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="h-24 animate-pulse rounded-[20px] bg-[rgba(25,56,52,0.06)] dark:bg-white/[0.04]"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-4 sm:space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card
                key={index}
                className="rounded-[28px] border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(238,244,240,0.96))] dark:border-white/[0.08] dark:bg-[linear-gradient(180deg,rgba(25,56,52,0.94),rgba(8,18,16,0.98))]"
              >
                <CardContent className="space-y-4 p-5 sm:p-6">
                  <div className="h-6 w-40 animate-pulse rounded-full bg-[rgba(25,56,52,0.08)] dark:bg-white/[0.06]" />
                  <div className="h-28 animate-pulse rounded-[20px] bg-[rgba(25,56,52,0.06)] dark:bg-white/[0.04]" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ onBack }) {
  return (
    <div className="relative overflow-hidden px-4 py-5 lg:px-8 lg:py-8">
      <div className="relative mx-auto max-w-[920px]">
        <Card className="rounded-[32px] border-[rgba(25,56,52,0.12)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(233,239,235,0.94))] shadow-[0_28px_90px_rgba(16,33,30,0.08)] dark:border-white/[0.08] dark:bg-[linear-gradient(135deg,rgba(25,56,52,0.98),rgba(8,17,15,0.98))] dark:shadow-[0_35px_100px_rgba(0,0,0,0.42)]">
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[28px] bg-rose-500/[0.12] text-rose-700 dark:text-rose-300">
              <AlertCircle className="h-8 w-8" strokeWidth={2.1} />
            </div>
            <div className="mt-5 text-2xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
              Unable to load verification details
            </div>
            <div className="mt-3 max-w-lg text-sm leading-7 text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
              The request may no longer exist or there may have been a temporary issue while loading the applicant’s details.
            </div>
            <Button
              onClick={onBack}
              className="mt-6 rounded-full bg-[linear-gradient(135deg,#1f6a55,#193834)] px-5 text-white hover:opacity-95"
            >
              Back to Verification Queue
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function VerificationDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeModal, setActiveModal] = useState(null);
  const [actionNote, setActionNote] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [adminNotesText, setAdminNotesText] = useState("");
  const {
    data: request,
    isLoading,
    isError,
  } = useVerificationRequest(id);
  const approveMutation = useApproveVerificationRequest();
  const rejectMutation = useRejectVerificationRequest();
  const correctionMutation = useRequestVerificationCorrection();
  const saveNotesMutation = useUpdateVerificationRequestNotes();
  const isProcessing =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    correctionMutation.isPending ||
    saveNotesMutation.isPending;

  useEffect(() => {
    setAdminNotesText(request?.admin_notes || "");
  }, [request?.admin_notes]);

  const isResolved = useMemo(
    () =>
      request
        ? ["approved", "rejected", "needs_correction"].includes(request.status)
        : false,
    [request],
  );

  const displayName =
    request?.user_profiles?.username || request?.full_name || "Unknown applicant";
  const email = request?.user_profiles?.email || "No email available";

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({
        requestId: id,
        adminNotes: actionNote,
      });
      toast.success("Verification request approved!");
      navigate("/admin/verification-queue");
    } catch (error) {
      toast.error(error.message || "Failed to approve verification");
    } finally {
      setActiveModal(null);
      setActionNote("");
    }
  };

  const handleReject = async () => {
    if (!actionNote.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    try {
      await rejectMutation.mutateAsync({
        requestId: id,
        adminNotes: actionNote,
      });
      toast.success("Verification request rejected");
      navigate("/admin/verification-queue");
    } catch (error) {
      toast.error(error.message || "Failed to reject verification");
    } finally {
      setActiveModal(null);
      setActionNote("");
    }
  };

  const handleRequestCorrection = async () => {
    if (!actionNote.trim()) {
      toast.error("Please provide correction details");
      return;
    }
    try {
      await correctionMutation.mutateAsync({
        requestId: id,
        adminNotes: actionNote,
      });
      toast.success("Correction requested");
      navigate("/admin/verification-queue");
    } catch (error) {
      toast.error(error.message || "Failed to request correction");
    } finally {
      setActiveModal(null);
      setActionNote("");
    }
  };

  const handleSaveNotes = async () => {
    try {
      await saveNotesMutation.mutateAsync({
        requestId: id,
        adminNotes: adminNotesText,
      });
      toast.success("Notes saved");
    } catch (error) {
      toast.error(error.message || "Failed to save notes");
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setActiveModal("image");
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError || !request) {
    return <ErrorState onBack={() => navigate("/admin/verification-queue")} />;
  }

  return (
    <>
      <div className="relative overflow-hidden px-4 py-5 lg:px-8 lg:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(42,107,88,0.1),transparent_30%),radial-gradient(circle_at_85%_0%,rgba(52,211,153,0.08),transparent_22%),linear-gradient(180deg,rgba(244,247,245,0.85),rgba(237,243,239,0.8))] dark:bg-[radial-gradient(circle_at_top_left,rgba(42,107,88,0.28),transparent_30%),radial-gradient(circle_at_85%_0%,rgba(52,211,153,0.12),transparent_22%),linear-gradient(180deg,rgba(5,10,9,0.96),rgba(8,17,15,0.98))]" />
        <div className="absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(25,56,52,0.04),transparent)] dark:bg-[linear-gradient(180deg,rgba(25,56,52,0.22),transparent)]" />

        <div className="relative mx-auto max-w-[1600px] space-y-4 sm:space-y-6 lg:space-y-8">
          <Card className="overflow-hidden rounded-[32px] border-[rgba(25,56,52,0.12)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(233,239,235,0.94))] shadow-[0_28px_90px_rgba(16,33,30,0.08)] dark:border-white/[0.08] dark:bg-[linear-gradient(135deg,rgba(25,56,52,0.98),rgba(8,17,15,0.98))] dark:shadow-[0_35px_100px_rgba(0,0,0,0.42)]">
            <CardContent className="relative p-5 sm:p-7 lg:p-8">
              <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.12),transparent_62%)] dark:block" />
              <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl space-y-3">
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/admin/verification-queue")}
                    className="h-10 rounded-full border border-emerald-500/[0.15] bg-emerald-500/[0.08] px-4 text-sm font-semibold text-emerald-800 hover:bg-emerald-500/[0.12] dark:text-emerald-200 dark:hover:bg-emerald-500/[0.14]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Queue
                  </Button>
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/[0.15] bg-emerald-500/[0.08] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-800 dark:text-emerald-200">
                      <Sparkles className="h-3.5 w-3.5" />
                      Verification Details
                    </div>
                  <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white lg:text-4xl">
                      {displayName}
                  </h1>
                    <div className="flex flex-col gap-2 text-sm text-[var(--app-text-soft)] dark:text-[var(--app-text-soft)] sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                      <span>Request ID: #{id}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <AdminStatusBadge
                    status={request.status}
                    className="self-start text-[11px] sm:self-center"
                  />
                  <div className="rounded-[22px] border border-emerald-500/[0.16] bg-white/[0.72] px-4 py-3 shadow-[0_14px_35px_rgba(16,33,30,0.06)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.04]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/70">
                      Current Review State
                    </div>
                    <div className="mt-1 text-sm font-medium text-[var(--app-text-soft)] dark:text-[var(--app-text-soft)]">
                      {isResolved
                        ? "This request has already been resolved."
                        : "Ready for admin review and action."}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.92fr)] xl:gap-8">
            <div className="space-y-4 sm:space-y-6">
              <SectionCard icon={UserRound} title="Applicant Information">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailItem icon={UserRound} label="Full Name" value={request.full_name} tone="accent" />
                  <DetailItem icon={Mail} label="Email / Username" value={email !== "No email available" ? email : displayName} />
                  <DetailItem icon={FileText} label="Document Type" value={request.id_type} />
                  <DetailItem icon={FileBadge2} label="ID Number" value={request.id_number} />
                  <DetailItem icon={Calendar} label="Submitted" value={formatDateTime(request.created_at)} />
                  <DetailItem
                    icon={ShieldCheck}
                    label="Account Created"
                    value={formatDate(request.user_profiles?.created_at)}
                    tone="info"
                  />
                </div>

                {request.userNotes ? (
                  <div className="mt-3 rounded-[22px] border border-sky-500/[0.18] bg-[linear-gradient(180deg,rgba(239,246,255,0.94),rgba(224,242,254,0.88))] p-4 text-sm text-[var(--foreground)] shadow-[0_14px_35px_rgba(3,105,161,0.08)] dark:bg-[linear-gradient(180deg,rgba(16,58,74,0.42),rgba(8,18,24,0.94))] dark:text-white">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
                      User Notes
                    </div>
                    <p className="mt-2 leading-6 text-[var(--app-text-soft)] dark:text-[var(--app-text-soft)]">
                      {request.userNotes}
                    </p>
                  </div>
                ) : null}
              </SectionCard>

              <SectionCard
                icon={FileBadge2}
                title="Submitted Documents"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <DocumentPreview
                    title="Front Side"
                    imageUrl={request.id_front_url}
                    onOpen={handleImageClick}
                  />
                  <DocumentPreview
                    title="Back Side"
                    imageUrl={request.id_back_url}
                    onOpen={handleImageClick}
                  />
                </div>
              </SectionCard>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <SectionCard icon={ShieldCheck} title="Review Panel">
                <div className="space-y-3">
                  <div className="rounded-[22px] border border-[rgba(25,56,52,0.12)] bg-white/[0.72] p-4 dark:border-white/[0.07] dark:bg-white/[0.03]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                      Verification Status
                    </div>
                    <div className="mt-3">
                      <AdminStatusBadge status={request.status} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveModal("approve")}
                      disabled={isProcessing || isResolved}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#059669,#0f766e)] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(5,150,105,0.22)] transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4.5 w-4.5" strokeWidth={2.15} />
                      Approve Request
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModal("reject")}
                      disabled={isProcessing || isResolved}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#e11d48,#be123c)] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(190,24,93,0.22)] transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <XCircle className="h-4.5 w-4.5" strokeWidth={2.15} />
                      Reject Request
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModal("correction")}
                      disabled={isProcessing || isResolved}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] border border-orange-500/[0.18] bg-orange-500/[0.1] px-4 py-3 text-sm font-semibold text-orange-800 transition-all hover:bg-orange-500/[0.14] dark:text-orange-200 dark:hover:bg-orange-500/[0.16] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <AlertCircle className="h-4.5 w-4.5" strokeWidth={2.15} />
                      Request Correction
                    </button>
                  </div>
                </div>
              </SectionCard>

              <SectionCard icon={FileText} title="Admin Notes">
                <div className="space-y-3">
                  <textarea
                    value={adminNotesText}
                    onChange={(event) => setAdminNotesText(event.target.value)}
                    placeholder="Add internal notes about this verification request..."
                    rows={6}
                    className="w-full rounded-[20px] border border-[rgba(25,56,52,0.12)] bg-white/[0.84] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--app-text-muted)] focus:border-emerald-500/[0.3] focus:ring-4 focus:ring-emerald-500/[0.12] dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                  />
                  <Button
                    onClick={handleSaveNotes}
                    disabled={isProcessing}
                    className="w-full rounded-full bg-[linear-gradient(135deg,#1f6a55,#193834)] text-white hover:opacity-95"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Notes
                      </>
                    )}
                  </Button>
                </div>
              </SectionCard>

              <SectionCard icon={Clock3} title="Request Timeline">
                <div className="space-y-3">
                  <div className="rounded-[22px] border border-[rgba(25,56,52,0.12)] bg-white/[0.72] p-4 dark:border-white/[0.07] dark:bg-white/[0.03]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[var(--foreground)] dark:text-white">
                          Submitted verification request
                        </div>
                        <div className="mt-1 text-xs text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                          {formatDateTime(request.created_at)}
                        </div>
                      </div>
                      <AdminStatusBadge status="pending" />
                    </div>
                  </div>
                  {request.updated_at && request.updated_at !== request.created_at ? (
                    <div className="rounded-[22px] border border-[rgba(25,56,52,0.12)] bg-white/[0.72] p-4 dark:border-white/[0.07] dark:bg-white/[0.03]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-[var(--foreground)] dark:text-white">
                            Request status last updated
                          </div>
                          <div className="mt-1 text-xs text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                            {formatDateTime(request.updated_at)}
                          </div>
                        </div>
                        <AdminStatusBadge status={request.status} />
                      </div>
                    </div>
                  ) : null}
                </div>
              </SectionCard>

              <SectionCard icon={CheckCircle2} title="Review Guidelines">
                <div className="space-y-2.5 text-sm text-[var(--app-text-soft)] dark:text-[var(--app-text-soft)]">
                  {[
                    "ID must be clear and readable.",
                    "Photo and personal details should match the document.",
                    "Document must be valid and not expired.",
                    "All critical information should remain visible.",
                    "Reject any signs of editing, tampering, or mismatch.",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-2.5 rounded-[18px] border border-[rgba(25,56,52,0.1)] bg-white/[0.68] px-3.5 py-3 dark:border-white/[0.06] dark:bg-white/[0.03]"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" strokeWidth={2.2} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          </section>
        </div>
      </div>

      {activeModal === "image" ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setActiveModal(null)}
        >
          <button
            type="button"
            onClick={() => setActiveModal(null)}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.12] text-white transition-colors hover:bg-white/[0.2]"
          >
            <X className="h-5 w-5" strokeWidth={2.2} />
          </button>
          <img
            src={selectedImage}
            alt="Zoomed document"
            className="max-h-[90vh] max-w-full rounded-[24px]"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}

      <ActionDialog
        open={activeModal === "approve"}
        type="approve"
        request={request}
        value={actionNote}
        onChange={setActionNote}
        onClose={() => {
          setActiveModal(null);
          setActionNote("");
        }}
        onConfirm={handleApprove}
        isProcessing={isProcessing}
      />
      <ActionDialog
        open={activeModal === "reject"}
        type="reject"
        request={request}
        value={actionNote}
        onChange={setActionNote}
        onClose={() => {
          setActiveModal(null);
          setActionNote("");
        }}
        onConfirm={handleReject}
        isProcessing={isProcessing}
      />
      <ActionDialog
        open={activeModal === "correction"}
        type="correction"
        request={request}
        value={actionNote}
        onChange={setActionNote}
        onClose={() => {
          setActiveModal(null);
          setActionNote("");
        }}
        onConfirm={handleRequestCorrection}
        isProcessing={isProcessing}
      />
    </>
  );
}
