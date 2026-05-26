import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  XCircle,
} from "lucide-react";

import { api as apiClient } from "@/lib/apiClient";
import { TablePagination } from "@/shared/components/admin/TablePagination";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/components/ui/utils";

const ACTION_FILTERS = [
  { value: "all", label: "All actions" },
  { value: "verification_approved", label: "Verification Approved" },
  { value: "verification_rejected", label: "Verification Rejected" },
  { value: "correction_requested", label: "Correction Requested" },
  { value: "user_banned", label: "User Banned" },
  { value: "user_unbanned", label: "User Unbanned" },
  { value: "report_resolved", label: "Report Resolved" },
  { value: "report_dismissed", label: "Report Dismissed" },
  { value: "report_under_review", label: "Report Under Review" },
];

const adminSurfaceClass =
  "rounded-[28px] border border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(238,244,240,0.96))] shadow-[0_24px_70px_rgba(16,33,30,0.08)] dark:border-white/[0.08] dark:bg-[linear-gradient(180deg,rgba(25,56,52,0.94),rgba(8,18,16,0.98))] dark:shadow-[0_30px_80px_rgba(0,0,0,0.36)]";

const innerSurfaceClass =
  "rounded-[22px] border border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(244,247,245,0.92),rgba(255,255,255,0.98))] shadow-[0_14px_35px_rgba(16,33,30,0.05)] dark:border-white/[0.07] dark:bg-[linear-gradient(180deg,rgba(16,33,30,0.94),rgba(12,26,23,0.98))] dark:shadow-[0_18px_45px_rgba(0,0,0,0.24)]";

const inputClassName =
  "h-12 rounded-2xl border-[rgba(25,56,52,0.12)] bg-white/[0.84] px-4 text-sm text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] focus-visible:border-emerald-500/40 focus-visible:ring-emerald-500/20 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white";

const selectTriggerClassName =
  "h-12 rounded-2xl border-[rgba(25,56,52,0.12)] bg-white/[0.84] px-4 text-sm text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] focus-visible:border-emerald-500/40 focus-visible:ring-emerald-500/20 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white";

const emptyValue = "Not available";

function formatActionType(type) {
  return (type || "unknown").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value) {
  if (!value) return emptyValue;
  return new Date(value).toLocaleString();
}

function normalizeText(value) {
  return String(value || "").toLowerCase();
}

function getActivitySummary(activity) {
  return activity.details || formatActionType(activity.type);
}

function getActivityTypeMeta(type) {
  const normalized = normalizeText(type);

  if (normalized.includes("verification")) {
    return {
      label: "Verification",
      tone: "border-emerald-500/30 bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-300",
      icon: ShieldCheck,
    };
  }

  if (normalized.includes("report")) {
    return {
      label: "Report",
      tone: "border-sky-500/30 bg-sky-500/[0.12] text-sky-700 dark:text-sky-300",
      icon: Activity,
    };
  }

  if (normalized.includes("banned") || normalized.includes("unbanned") || normalized.includes("user")) {
    return {
      label: "User Management",
      tone: "border-rose-500/30 bg-rose-500/[0.12] text-rose-700 dark:text-rose-300",
      icon: UserRound,
    };
  }

  return {
    label: "System",
    tone: "border-teal-500/30 bg-teal-500/[0.12] text-teal-700 dark:text-teal-300",
    icon: Sparkles,
  };
}

function getStatusMeta(type) {
  const normalized = normalizeText(type);

  if (normalized.includes("approved") || normalized.includes("resolved") || normalized.includes("unbanned")) {
    return {
      label: "Completed",
      tone: "border-emerald-500/30 bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-300",
      icon: CheckCircle2,
    };
  }

  if (normalized.includes("under_review")) {
    return {
      label: "Under Review",
      tone: "border-sky-500/30 bg-sky-500/[0.12] text-sky-700 dark:text-sky-300",
      icon: Activity,
    };
  }

  if (normalized.includes("correction")) {
    return {
      label: "Pending",
      tone: "border-amber-500/30 bg-amber-500/[0.12] text-amber-700 dark:text-amber-300",
      icon: Clock3,
    };
  }

  if (normalized.includes("rejected") || normalized.includes("dismissed") || normalized.includes("banned")) {
    return {
      label: "Completed",
      tone: "border-rose-500/30 bg-rose-500/[0.12] text-rose-700 dark:text-rose-300",
      icon: XCircle,
    };
  }

  return {
    label: "Completed",
    tone: "border-teal-500/30 bg-teal-500/[0.12] text-teal-700 dark:text-teal-300",
    icon: Activity,
  };
}

const statToneStyles = {
  neutral: {
    card:
      "border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(237,243,239,0.96))] dark:border-white/[0.08] dark:bg-[linear-gradient(180deg,rgba(25,56,52,0.94),rgba(9,22,20,0.98))]",
    icon: "bg-[rgba(25,56,52,0.08)] text-[var(--primary)] dark:bg-emerald-500/[0.14] dark:text-emerald-300",
  },
  success: {
    card:
      "border-emerald-500/[0.24] bg-[linear-gradient(180deg,rgba(236,253,245,0.98),rgba(221,247,237,0.96))] dark:border-emerald-500/20 dark:bg-[linear-gradient(180deg,rgba(15,68,52,0.62),rgba(9,25,20,0.98))]",
    icon: "bg-emerald-500/[0.14] text-emerald-700 dark:bg-emerald-500/[0.18] dark:text-emerald-300",
  },
  info: {
    card:
      "border-sky-500/[0.24] bg-[linear-gradient(180deg,rgba(239,246,255,0.98),rgba(224,242,254,0.96))] dark:border-sky-500/[0.18] dark:bg-[linear-gradient(180deg,rgba(16,58,74,0.52),rgba(8,18,24,0.98))]",
    icon: "bg-sky-500/[0.14] text-sky-700 dark:bg-sky-500/[0.18] dark:text-sky-300",
  },
  warning: {
    card:
      "border-amber-500/25 bg-[linear-gradient(180deg,rgba(255,251,235,0.98),rgba(255,247,214,0.96))] dark:border-amber-500/20 dark:bg-[linear-gradient(180deg,rgba(69,41,8,0.5),rgba(26,18,8,0.98))]",
    icon: "bg-amber-500/[0.14] text-amber-700 dark:bg-amber-500/[0.18] dark:text-amber-300",
  },
};

function AdminStatusBadge({ label, className }) {
  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        className,
      )}
    >
      {label}
    </Badge>
  );
}

function SummaryCard({ icon: Icon, label, value, tone = "neutral" }) {
  const palette = statToneStyles[tone] || statToneStyles.neutral;

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-[24px] border shadow-[0_18px_45px_rgba(16,33,30,0.08)] dark:shadow-[0_22px_55px_rgba(0,0,0,0.28)]",
        palette.card,
      )}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-muted)] dark:text-emerald-100/70">
              {label}
            </div>
            <div className="text-2xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white sm:text-3xl">
              {value}
            </div>
          </div>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 sm:h-11 sm:w-11",
              palette.icon,
            )}
          >
            <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={2.15} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className={cn("rounded-[24px] border", statToneStyles.neutral.card)}>
            <CardContent className="space-y-3 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24 rounded-full bg-[rgba(25,56,52,0.08)] dark:bg-white/[0.06]" />
                  <Skeleton className="h-8 w-16 rounded-full bg-[rgba(25,56,52,0.1)] dark:bg-white/[0.08]" />
                </div>
                <Skeleton className="h-10 w-10 rounded-2xl bg-[rgba(25,56,52,0.08)] dark:bg-white/[0.06]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className={adminSurfaceClass}>
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_220px]">
            <Skeleton className="h-12 rounded-2xl bg-[rgba(25,56,52,0.08)] dark:bg-white/[0.06]" />
            <Skeleton className="h-12 rounded-2xl bg-[rgba(25,56,52,0.08)] dark:bg-white/[0.06]" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className={cn(innerSurfaceClass, "overflow-hidden")}>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-12 w-12 rounded-2xl bg-[rgba(25,56,52,0.08)] dark:bg-white/[0.06]" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40 rounded-full bg-[rgba(25,56,52,0.08)] dark:bg-white/[0.06]" />
                    <Skeleton className="h-3 w-32 rounded-full bg-[rgba(25,56,52,0.06)] dark:bg-white/[0.04]" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full bg-[rgba(25,56,52,0.08)] dark:bg-white/[0.06]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-20 rounded-[18px] bg-[rgba(25,56,52,0.06)] dark:bg-white/[0.04]" />
                <Skeleton className="h-20 rounded-[18px] bg-[rgba(25,56,52,0.06)] dark:bg-white/[0.04]" />
              </div>
              <Skeleton className="h-10 rounded-full bg-[rgba(25,56,52,0.08)] dark:bg-white/[0.06]" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ hasFilters, onReset }) {
  return (
    <Card className={adminSurfaceClass}>
      <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/[0.1] text-emerald-700 dark:text-emerald-300">
          <Activity className="h-7 w-7" strokeWidth={2.1} />
        </div>
        <h3 className="mt-5 text-xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
          No activity logs found
        </h3>
        <p className="mt-2 max-w-md text-sm text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
          {hasFilters
            ? "Try changing your search or action-type filter to bring matching records back into view."
            : "New admin actions will appear here as soon as moderation or system events are recorded."}
        </p>
        {hasFilters ? (
          <Button
            type="button"
            onClick={onReset}
            className="mt-5 rounded-full bg-[linear-gradient(135deg,#1f6a55,#193834)] px-5 text-white shadow-[0_18px_45px_rgba(25,56,52,0.22)] hover:opacity-95"
          >
            Reset Filters
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ErrorState({ onRetry }) {
  return (
    <Card className={adminSurfaceClass}>
      <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/[0.1] text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-7 w-7" strokeWidth={2.1} />
        </div>
        <h3 className="mt-5 text-xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
          Unable to load activity logs
        </h3>
        <p className="mt-2 max-w-md text-sm text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
          The activity feed could not be loaded right now. Please try again.
        </p>
        <Button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-full bg-[linear-gradient(135deg,#1f6a55,#193834)] px-5 text-white shadow-[0_18px_45px_rgba(25,56,52,0.22)] hover:opacity-95"
        >
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}

function ActivityLogCard({ activity, onOpen }) {
  const typeMeta = getActivityTypeMeta(activity.type);
  const statusMeta = getStatusMeta(activity.type);
  const TypeIcon = typeMeta.icon;

  return (
    <Card className={cn(innerSurfaceClass, "overflow-hidden")}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/[0.16] bg-emerald-500/[0.1] text-emerald-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] dark:text-emerald-200">
                <TypeIcon className="h-5 w-5" strokeWidth={2.15} />
              </div>
              <div className="min-w-0">
                <div className="text-base font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
                  {getActivitySummary(activity)}
                </div>
                <div className="mt-1 text-sm text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                  {activity.adminName || "Admin"} • {activity.targetUser || "No target"}
                </div>
              </div>
            </div>
            <AdminStatusBadge label={statusMeta.label} className={statusMeta.tone} />
          </div>

          <div className="flex flex-wrap gap-2">
            <AdminStatusBadge label={typeMeta.label} className={typeMeta.tone} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[18px] border border-[rgba(25,56,52,0.12)] bg-white/[0.72] p-3 dark:border-white/[0.07] dark:bg-white/[0.03]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                Performed By
              </div>
              <div className="mt-1.5 text-sm font-semibold text-[var(--foreground)] dark:text-white">
                {activity.adminName || "Admin"}
              </div>
            </div>
            <div className="rounded-[18px] border border-[rgba(25,56,52,0.12)] bg-white/[0.72] p-3 dark:border-white/[0.07] dark:bg-white/[0.03]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                Date & Time
              </div>
              <div className="mt-1.5 text-sm font-semibold text-[var(--foreground)] dark:text-white">
                {formatDateTime(activity.timestamp)}
              </div>
            </div>
          </div>

          <div className="rounded-[18px] border border-[rgba(25,56,52,0.12)] bg-white/[0.72] p-3 dark:border-white/[0.07] dark:bg-white/[0.03]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
              Notes
            </div>
            <div className="mt-1.5 text-sm text-[var(--foreground)] dark:text-white">
              {activity.notes || "No notes"}
            </div>
          </div>

          <Button
            type="button"
            onClick={onOpen}
            variant="outline"
            className="h-11 rounded-full border-emerald-500/[0.18] bg-white/[0.72] text-[var(--foreground)] hover:border-emerald-500/[0.28] hover:bg-white dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]"
          >
            <Eye className="h-4 w-4" strokeWidth={2.1} />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionField({ label, value, className }) {
  return (
    <div
      className={cn(
        "rounded-[18px] border border-[rgba(25,56,52,0.12)] bg-white/[0.74] p-3.5 dark:border-white/[0.07] dark:bg-white/[0.03]",
        className,
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
        {label}
      </div>
      <div className="mt-1.5 text-sm font-semibold text-[var(--foreground)] dark:text-white">
        {value ?? emptyValue}
      </div>
    </div>
  );
}

export function AdminActivityLog() {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchActivities = async () => {
    setIsLoading(true);
    setFetchError(false);

    try {
      const path =
        typeFilter === "all"
          ? "/admin/activity-log"
          : `/admin/activity-log?action_type=${encodeURIComponent(typeFilter)}`;
      const data = await apiClient.get(path);
      setActivities(data || []);
    } catch (error) {
      console.error("Failed to fetch admin activity log:", error);
      setActivities([]);
      setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [typeFilter]);

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const haystack = [
        activity.adminName,
        activity.targetUser,
        activity.details,
        activity.notes,
        activity.type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchQuery === "" || haystack.includes(searchQuery.toLowerCase());
    });
  }, [activities, searchQuery]);

  const counts = {
    verifications: activities.filter((entry) =>
      ["verification_approved", "verification_rejected", "correction_requested"].includes(entry.type),
    ).length,
    userActions: activities.filter((entry) =>
      ["user_banned", "user_unbanned"].includes(entry.type),
    ).length,
    reports: activities.filter((entry) =>
      ["report_resolved", "report_dismissed", "report_under_review"].includes(entry.type),
    ).length,
    completed: activities.filter((entry) =>
      ["verification_approved", "report_resolved", "user_unbanned"].includes(entry.type),
    ).length,
  };

  const totalFiltered = filteredActivities.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedActivities = filteredActivities.slice(startIndex, startIndex + rowsPerPage);
  const hasFilters = searchQuery.trim() !== "" || typeFilter !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setCurrentPage(1);
  };

  return (
    <>
      <div className="p-4 lg:p-8">
        <div className="mx-auto max-w-[1600px] space-y-6">
          <Card className={cn(adminSurfaceClass, "overflow-hidden")}>
            <CardContent className="px-4 py-5 sm:px-6 sm:py-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0 space-y-3">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.1] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800 dark:text-emerald-300">
                    <Activity className="h-3.5 w-3.5" strokeWidth={2.2} />
                    Admin Workspace
                  </div>
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] dark:bg-emerald-500/[0.12] dark:text-emerald-300 sm:h-14 sm:w-14">
                      <Activity className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0 space-y-2">
                      <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white sm:text-4xl">
                        Activity Log
                      </h1>
                      <p className="max-w-2xl text-sm leading-6 text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)] sm:text-base">
                        Track moderation decisions, account actions, and report workflows from one compact audit workspace.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:w-auto sm:grid-cols-2 lg:min-w-[320px]">
                  <div className="rounded-[22px] border border-[rgba(25,56,52,0.12)] bg-white/[0.84] px-4 py-3 shadow-[0_14px_35px_rgba(16,33,30,0.06)] dark:border-white/[0.07] dark:bg-white/[0.04]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                      Filtered Logs
                    </div>
                    <div className="mt-1 text-2xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
                      {totalFiltered}
                    </div>
                  </div>
                  <div className="rounded-[22px] border border-[rgba(25,56,52,0.12)] bg-white/[0.84] px-4 py-3 shadow-[0_14px_35px_rgba(16,33,30,0.06)] dark:border-white/[0.07] dark:bg-white/[0.04]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                      Total Actions
                    </div>
                    <div className="mt-1 text-2xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
                      {activities.length}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <SummaryCard icon={Activity} label="Total Actions" value={activities.length} tone="neutral" />
            <SummaryCard icon={ShieldCheck} label="Verifications" value={counts.verifications} tone="success" />
            <SummaryCard icon={UserRound} label="User Actions" value={counts.userActions} tone="warning" />
            <SummaryCard icon={CheckCircle2} label="Completed" value={counts.completed || counts.reports} tone="info" />
          </section>

          <Card className={adminSurfaceClass}>
            <CardContent className="px-4 py-4 sm:px-6 sm:py-6">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_260px_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-muted)]" />
                  <Input
                    type="text"
                    placeholder="Search by admin, target, details, or notes"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setCurrentPage(1);
                    }}
                    className={cn(inputClassName, "pl-11")}
                  />
                </div>

                <Select
                  value={typeFilter}
                  onValueChange={(value) => {
                    setTypeFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className={selectTriggerClassName}>
                    <SelectValue placeholder="Filter by action type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_FILTERS.map((filter) => (
                      <SelectItem key={filter.value} value={filter.value}>
                        {filter.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasFilters ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResetFilters}
                    className="h-12 rounded-full border border-[rgba(25,56,52,0.12)] bg-white/[0.74] px-5 text-[var(--foreground)] hover:bg-white dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]"
                  >
                    Reset Filters
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {isLoading ? <LoadingState /> : null}
          {!isLoading && fetchError ? <ErrorState onRetry={fetchActivities} /> : null}
          {!isLoading && !fetchError && totalFiltered === 0 ? (
            <EmptyState hasFilters={hasFilters} onReset={handleResetFilters} />
          ) : null}

          {!isLoading && !fetchError && totalFiltered > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-3 lg:hidden">
                {paginatedActivities.map((activity) => (
                  <ActivityLogCard
                    key={activity.id}
                    activity={activity}
                    onOpen={() => setSelectedActivity(activity)}
                  />
                ))}
              </div>

              <Card className={cn(adminSurfaceClass, "hidden overflow-hidden lg:block")}>
                <CardHeader className="gap-3 border-b border-[rgba(25,56,52,0.08)] px-6 pb-4 pt-6 dark:border-white/[0.06]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
                        Admin Activity Feed
                      </CardTitle>
                      <CardDescription className="text-sm text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                        Compact view of audit events, decision makers, affected records, and timestamps.
                      </CardDescription>
                    </div>
                    <div className="rounded-full border border-emerald-500/20 bg-emerald-500/[0.1] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800 dark:text-emerald-300">
                      {totalFiltered} records
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-fixed">
                      <thead>
                        <tr className="border-b border-[rgba(25,56,52,0.08)] bg-[rgba(25,56,52,0.03)] text-left dark:border-white/[0.06] dark:bg-white/[0.03]">
                          <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                            Activity
                          </th>
                          <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                            Performed By
                          </th>
                          <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                            Module
                          </th>
                          <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                            Date & Time
                          </th>
                          <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                            Status
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedActivities.map((activity) => {
                          const typeMeta = getActivityTypeMeta(activity.type);
                          const statusMeta = getStatusMeta(activity.type);

                          return (
                            <tr
                              key={activity.id}
                              className="border-b border-[rgba(25,56,52,0.08)] transition-colors hover:bg-[rgba(25,56,52,0.03)] dark:border-white/[0.06] dark:hover:bg-white/[0.03]"
                            >
                              <td className="px-6 py-4">
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-[var(--foreground)] dark:text-white">
                                    {getActivitySummary(activity)}
                                  </div>
                                  <div className="mt-1 text-xs text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                                    {activity.targetUser || "No affected record"}
                                  </div>
                                  {activity.notes ? (
                                    <div className="mt-2 max-w-md text-xs italic text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                                      {activity.notes}
                                    </div>
                                  ) : null}
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="text-sm font-semibold text-[var(--foreground)] dark:text-white">
                                  {activity.adminName || "Admin"}
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <AdminStatusBadge label={typeMeta.label} className={typeMeta.tone} />
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="text-sm font-semibold text-[var(--foreground)] dark:text-white">
                                  {formatDateTime(activity.timestamp)}
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <AdminStatusBadge label={statusMeta.label} className={statusMeta.tone} />
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSelectedActivity(activity)}
                                    className="h-10 rounded-full border-emerald-500/[0.18] bg-white/[0.72] px-4 text-[var(--foreground)] hover:border-emerald-500/[0.28] hover:bg-white dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]"
                                  >
                                    <Eye className="h-4 w-4" strokeWidth={2.1} />
                                    View Details
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <TablePagination
                    currentPage={currentPage}
                    totalItems={totalFiltered}
                    rowsPerPage={rowsPerPage}
                    onPageChange={setCurrentPage}
                    onRowsPerPageChange={(rows) => {
                      setRowsPerPage(rows);
                      setCurrentPage(1);
                    }}
                  />
                </CardContent>
              </Card>

              <div className="lg:hidden">
                <Card className={cn(adminSurfaceClass, "overflow-hidden")}>
                  <CardContent className="p-0">
                    <TablePagination
                      currentPage={currentPage}
                      totalItems={totalFiltered}
                      rowsPerPage={rowsPerPage}
                      onPageChange={setCurrentPage}
                      onRowsPerPageChange={(rows) => {
                        setRowsPerPage(rows);
                        setCurrentPage(1);
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <Dialog open={Boolean(selectedActivity)} onOpenChange={(open) => !open && setSelectedActivity(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[28px] border-[rgba(25,56,52,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(238,244,240,0.97))] p-0 shadow-[0_32px_80px_rgba(16,33,30,0.18)] dark:border-white/[0.08] dark:bg-[linear-gradient(180deg,rgba(25,56,52,0.95),rgba(8,18,16,0.99))] sm:max-w-3xl">
          {selectedActivity ? (
            <>
              <DialogHeader className="border-b border-[rgba(25,56,52,0.08)] px-6 pb-5 pt-6 text-left dark:border-white/[0.06]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <DialogTitle className="text-2xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
                      {getActivitySummary(selectedActivity)}
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-sm text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                      Audit details for this admin action.
                    </DialogDescription>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <AdminStatusBadge
                        label={getActivityTypeMeta(selectedActivity.type).label}
                        className={getActivityTypeMeta(selectedActivity.type).tone}
                      />
                      <AdminStatusBadge
                        label={getStatusMeta(selectedActivity.type).label}
                        className={getStatusMeta(selectedActivity.type).tone}
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setSelectedActivity(null)}
                    className="h-11 rounded-full bg-[linear-gradient(135deg,#1f6a55,#193834)] px-5 text-white shadow-[0_18px_45px_rgba(25,56,52,0.22)] hover:opacity-95"
                  >
                    <Eye className="h-4 w-4" />
                    Close
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-6 px-6 py-6">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <SectionField label="Performed By" value={selectedActivity.adminName || "Admin"} />
                  <SectionField label="Module" value={getActivityTypeMeta(selectedActivity.type).label} />
                  <SectionField label="Status" value={getStatusMeta(selectedActivity.type).label} />
                  <SectionField label="Timestamp" value={formatDateTime(selectedActivity.timestamp)} />
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <SectionField label="Action Type" value={formatActionType(selectedActivity.type)} />
                  <SectionField label="Affected Record" value={selectedActivity.targetUser || emptyValue} />
                </div>

                <SectionField label="Details" value={selectedActivity.details || emptyValue} />
                <SectionField label="Notes / Message" value={selectedActivity.notes || emptyValue} />
              </div>

              <DialogFooter className="border-t border-[rgba(25,56,52,0.08)] px-6 py-5 sm:justify-end dark:border-white/[0.06]">
                <Button
                  type="button"
                  onClick={() => setSelectedActivity(null)}
                  className="h-11 rounded-full bg-[linear-gradient(135deg,#1f6a55,#193834)] px-5 text-white shadow-[0_18px_45px_rgba(25,56,52,0.22)] hover:opacity-95"
                >
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
