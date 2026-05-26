import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  FileBadge2,
  Filter,
  Loader2,
  Mail,
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
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { cn } from "@/shared/components/ui/utils";

const STATUS_OPTIONS = [
  { value: "all", label: "All Requests" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "needs_correction", label: "Needs Correction" },
];

const ID_TYPE_OPTIONS = [
  { value: "all", label: "All document types" },
  { value: "National ID", label: "National ID" },
  { value: "Driver's License", label: "Driver's License" },
  { value: "Passport", label: "Passport" },
];

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

const statToneStyles = {
  pending: {
    card:
      "border-amber-500/25 bg-[linear-gradient(180deg,rgba(255,251,235,0.98),rgba(255,247,214,0.96))] dark:border-amber-500/20 dark:bg-[linear-gradient(180deg,rgba(69,41,8,0.5),rgba(26,18,8,0.98))]",
    icon: "bg-amber-500/[0.14] text-amber-700 dark:bg-amber-500/[0.18] dark:text-amber-300",
  },
  approved: {
    card:
      "border-emerald-500/[0.24] bg-[linear-gradient(180deg,rgba(236,253,245,0.98),rgba(221,247,237,0.96))] dark:border-emerald-500/20 dark:bg-[linear-gradient(180deg,rgba(15,68,52,0.62),rgba(9,25,20,0.98))]",
    icon: "bg-emerald-500/[0.14] text-emerald-700 dark:bg-emerald-500/[0.18] dark:text-emerald-300",
  },
  rejected: {
    card:
      "border-rose-500/[0.24] bg-[linear-gradient(180deg,rgba(255,241,242,0.98),rgba(255,228,230,0.96))] dark:border-rose-500/[0.18] dark:bg-[linear-gradient(180deg,rgba(84,20,35,0.52),rgba(24,10,14,0.98))]",
    icon: "bg-rose-500/[0.14] text-rose-700 dark:bg-rose-500/[0.18] dark:text-rose-300",
  },
  needs_correction: {
    card:
      "border-orange-500/[0.24] bg-[linear-gradient(180deg,rgba(255,247,237,0.98),rgba(255,237,213,0.96))] dark:border-orange-500/[0.18] dark:bg-[linear-gradient(180deg,rgba(91,46,9,0.5),rgba(28,16,8,0.98))]",
    icon: "bg-orange-500/[0.14] text-orange-700 dark:bg-orange-500/[0.18] dark:text-orange-300",
  },
};

const formatStatusLabel = (status) => {
  if (!status) return "Pending";
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDate = (value) => {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString();
};

const formatTime = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

function AdminStatusBadge({ status }) {
  const Icon = statusIcons[status] || Clock3;

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        statusStyles[status] || statusStyles.pending,
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      {formatStatusLabel(status)}
    </Badge>
  );
}

function SummaryCard({ icon: Icon, label, value, tone }) {
  const palette = statToneStyles[tone];

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

function FilterChip({ active, children, onClick, tone = "default" }) {
  const activeClasses = {
    default: "bg-[linear-gradient(135deg,#1f6a55,#193834)] text-white shadow-[0_14px_35px_rgba(25,56,52,0.22)]",
    warning: "bg-[linear-gradient(135deg,#f59e0b,#d97706)] text-white shadow-[0_14px_35px_rgba(180,83,9,0.22)]",
    success: "bg-[linear-gradient(135deg,#059669,#0f766e)] text-white shadow-[0_14px_35px_rgba(5,150,105,0.22)]",
    danger: "bg-[linear-gradient(135deg,#e11d48,#be123c)] text-white shadow-[0_14px_35px_rgba(190,24,93,0.22)]",
    info: "bg-[linear-gradient(135deg,#2563eb,#1d4ed8)] text-white shadow-[0_14px_35px_rgba(37,99,235,0.22)]",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap",
        active
          ? activeClasses[tone] || activeClasses.default
          : "border-[rgba(25,56,52,0.12)] bg-white/[0.82] text-[var(--foreground)] hover:border-emerald-500/[0.22] dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-white",
      )}
    >
      {children}
    </button>
  );
}

function VerificationRequestCard({ request, onReview }) {
  const displayName = request.user_profiles?.username || request.full_name || "Unknown user";
  const email = request.user_profiles?.email || "No email available";
  const resolved = request.status !== "pending";

  return (
    <div className="group w-full rounded-[26px] border border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,246,243,0.96))] p-4 text-left shadow-[0_18px_45px_rgba(16,33,30,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/[0.24] hover:shadow-[0_22px_55px_rgba(16,33,30,0.12)] dark:border-white/[0.07] dark:bg-[linear-gradient(180deg,rgba(16,33,30,0.95),rgba(12,26,23,0.98))] dark:hover:border-emerald-400/20 sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/[0.12] bg-emerald-500/[0.1] text-emerald-700 dark:text-emerald-300">
              <UserRound className="h-5 w-5" strokeWidth={2.15} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
                {displayName}
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{email}</span>
              </div>
            </div>
          </div>
          <AdminStatusBadge status={request.status} />
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="rounded-[18px] border border-[rgba(25,56,52,0.12)] bg-white/[0.7] p-3 dark:border-white/[0.07] dark:bg-white/[0.03]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
              Document Type
            </div>
            <div className="mt-1.5 text-sm font-semibold text-[var(--foreground)] dark:text-white">
              {request.id_type || "Unknown"}
            </div>
          </div>
          <div className="rounded-[18px] border border-[rgba(25,56,52,0.12)] bg-white/[0.7] p-3 dark:border-white/[0.07] dark:bg-white/[0.03]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
              Submitted
            </div>
            <div className="mt-1.5 text-sm font-semibold text-[var(--foreground)] dark:text-white">
              {formatDate(request.created_at)}
            </div>
            <div className="mt-0.5 text-xs text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
              {formatTime(request.created_at)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onReview}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-500/[0.18] bg-emerald-500/[0.1] px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-all hover:bg-emerald-500/[0.14] dark:text-emerald-200 dark:hover:bg-emerald-500/[0.16] sm:w-auto sm:py-2"
          >
            <Eye className="h-4 w-4" strokeWidth={2.1} />
            {resolved ? "View Details" : "Review Request"}
            <ChevronRight className="h-4 w-4" strokeWidth={2.15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card
          key={index}
          className="rounded-[26px] border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,246,243,0.96))] dark:border-white/[0.07] dark:bg-[linear-gradient(180deg,rgba(16,33,30,0.95),rgba(12,26,23,0.98))]"
        >
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 animate-pulse rounded-2xl bg-[rgba(25,56,52,0.08)] dark:bg-white/[0.06]" />
                <div className="space-y-2">
                  <div className="h-4 w-36 animate-pulse rounded-full bg-[rgba(25,56,52,0.08)] dark:bg-white/[0.06]" />
                  <div className="h-3 w-44 animate-pulse rounded-full bg-[rgba(25,56,52,0.06)] dark:bg-white/[0.04]" />
                </div>
              </div>
              <div className="h-7 w-28 animate-pulse rounded-full bg-[rgba(25,56,52,0.08)] dark:bg-white/[0.06]" />
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div className="h-[4.5rem] animate-pulse rounded-[18px] bg-[rgba(25,56,52,0.06)] dark:bg-white/[0.04]" />
              <div className="h-[4.5rem] animate-pulse rounded-[18px] bg-[rgba(25,56,52,0.06)] dark:bg-white/[0.04]" />
            </div>
            <div className="h-4 w-52 animate-pulse rounded-full bg-[rgba(25,56,52,0.06)] dark:bg-white/[0.04]" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters, onReset }) {
  return (
    <Card className="rounded-[28px] border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(238,244,240,0.96))] shadow-[0_24px_70px_rgba(16,33,30,0.08)] dark:border-white/[0.08] dark:bg-[linear-gradient(180deg,rgba(25,56,52,0.94),rgba(8,18,16,0.98))] dark:shadow-[0_30px_80px_rgba(0,0,0,0.36)]">
      <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/[0.1] text-emerald-700 dark:text-emerald-300">
          <Filter className="h-7 w-7" strokeWidth={2.1} />
        </div>
        <div className="mt-4 text-lg font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
          No verification requests found
        </div>
        <div className="mt-2 max-w-md text-sm leading-6 text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
          {hasFilters
            ? "Try adjusting your search or active filters to bring matching requests back into view."
            : "New user submissions will appear here as soon as they enter the verification queue."}
        </div>
        {hasFilters ? (
          <Button
            onClick={onReset}
            className="mt-5 rounded-full bg-[linear-gradient(135deg,#1f6a55,#193834)] px-5 text-white hover:opacity-95"
          >
            Reset Filters
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function VerificationQueue() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [idTypeFilter, setIdTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    async function fetchRequests() {
      setIsLoading(true);
      try {
        const query =
          statusFilter === "all"
            ? "/admin/verifications"
            : `/admin/verifications?status=${encodeURIComponent(statusFilter)}`;
        const data = await apiClient.get(query);
        setRequests(data || []);
      } catch (error) {
        console.error("Failed to fetch verifications:", error);
        setRequests([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRequests();
  }, [statusFilter]);

  const counts = useMemo(
    () => ({
      pending: requests.filter((request) => request.status === "pending").length,
      approved: requests.filter((request) => request.status === "approved").length,
      rejected: requests.filter((request) => request.status === "rejected").length,
      needs_correction: requests.filter((request) => request.status === "needs_correction").length,
    }),
    [requests],
  );

  const filteredRequests = useMemo(
    () =>
      requests.filter((request) => {
        const displayName = request.user_profiles?.username || request.full_name || "";
        const email = request.user_profiles?.email || "";
        const matchesSearch =
          searchQuery === "" ||
          displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (request.full_name || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesIdType =
          idTypeFilter === "all" || request.id_type === idTypeFilter;
        return matchesSearch && matchesIdType;
      }),
    [requests, searchQuery, idTypeFilter],
  );

  const totalFiltered = filteredRequests.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedRequests = filteredRequests.slice(
    startIndex,
    startIndex + rowsPerPage,
  );

  const hasFilters = searchQuery !== "" || statusFilter !== "all" || idTypeFilter !== "all";

  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setIdTypeFilter("all");
    setCurrentPage(1);
  };

  return (
    <div className="relative overflow-hidden px-4 py-5 lg:px-8 lg:py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(42,107,88,0.1),transparent_30%),radial-gradient(circle_at_85%_0%,rgba(52,211,153,0.08),transparent_22%),linear-gradient(180deg,rgba(244,247,245,0.85),rgba(237,243,239,0.8))] dark:bg-[radial-gradient(circle_at_top_left,rgba(42,107,88,0.28),transparent_30%),radial-gradient(circle_at_85%_0%,rgba(52,211,153,0.12),transparent_22%),linear-gradient(180deg,rgba(5,10,9,0.96),rgba(8,17,15,0.98))]" />
      <div className="absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(25,56,52,0.04),transparent)] dark:bg-[linear-gradient(180deg,rgba(25,56,52,0.22),transparent)]" />

      <div className="relative mx-auto max-w-[1600px] space-y-4 sm:space-y-6 lg:space-y-8">
        <Card className="overflow-hidden rounded-[32px] border-[rgba(25,56,52,0.12)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(233,239,235,0.94))] shadow-[0_28px_90px_rgba(16,33,30,0.08)] dark:border-white/[0.08] dark:bg-[linear-gradient(135deg,rgba(25,56,52,0.98),rgba(8,17,15,0.98))] dark:shadow-[0_35px_100px_rgba(0,0,0,0.42)]">
          <CardContent className="relative p-5 sm:p-7 lg:p-8">
            <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.12),transparent_62%)] dark:block" />
            <div className="relative flex flex-col gap-4 sm:gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl space-y-3 sm:space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/[0.15] bg-emerald-500/[0.08] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-800 dark:text-emerald-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Verification Requests
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white lg:text-4xl">
                    Review identity submissions faster
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-[var(--app-text-soft)] dark:text-[var(--app-text-soft)] sm:text-base">
                    Filter the queue, scan applicant details, and jump straight into each request using the updated FuelWatch PH admin review surface.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:min-w-[360px]">
                <div className="rounded-[24px] border border-emerald-500/[0.16] bg-white/[0.72] p-3.5 shadow-[0_14px_35px_rgba(16,33,30,0.06)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.04] sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-300">
                      <ShieldCheck className="h-5 w-5" strokeWidth={2.15} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--app-text-muted)] dark:text-emerald-100/70">
                        In Queue
                      </div>
                      <div className="mt-1 text-sm font-medium text-[var(--app-text-soft)] dark:text-[var(--app-text-soft)]">
                        {counts.pending} requests are waiting for action
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-[24px] border border-emerald-500/[0.16] bg-white/[0.72] p-3.5 shadow-[0_14px_35px_rgba(16,33,30,0.06)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.04] sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-300">
                      <FileBadge2 className="h-5 w-5" strokeWidth={2.15} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--app-text-muted)] dark:text-emerald-100/70">
                        Total Results
                      </div>
                      <div className="mt-1 text-sm font-medium text-[var(--app-text-soft)] dark:text-[var(--app-text-soft)]">
                        {totalFiltered} matching request{totalFiltered === 1 ? "" : "s"} in view
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4">
          <SummaryCard
            icon={Clock3}
            label="Pending"
            value={counts.pending}
            tone="pending"
          />
          <SummaryCard
            icon={CheckCircle2}
            label="Approved"
            value={counts.approved}
            tone="approved"
          />
          <SummaryCard
            icon={XCircle}
            label="Rejected"
            value={counts.rejected}
            tone="rejected"
          />
          <SummaryCard
            icon={AlertCircle}
            label="Needs Correction"
            value={counts.needs_correction}
            tone="needs_correction"
          />
        </section>

        <Card className="overflow-hidden rounded-[28px] border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(238,244,240,0.96))] shadow-[0_24px_70px_rgba(16,33,30,0.08)] dark:border-white/[0.08] dark:bg-[linear-gradient(180deg,rgba(25,56,52,0.94),rgba(8,18,16,0.98))] dark:shadow-[0_30px_80px_rgba(0,0,0,0.36)]">
          <CardContent className="space-y-3.5 px-4 py-4 sm:space-y-5 sm:px-6 sm:py-6">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-muted)] sm:h-5 sm:w-5" />
                <input
                  type="text"
                  placeholder="Search by username, full name, or email..."
                  value={searchQuery}
                  onChange={(event) => handleFilterChange(setSearchQuery, event.target.value)}
                  className="w-full rounded-[18px] border border-[rgba(25,56,52,0.12)] bg-white/[0.82] py-3 pl-11 pr-4 text-sm text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--app-text-muted)] focus:border-emerald-500/[0.3] focus:ring-4 focus:ring-emerald-500/[0.12] dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-[var(--app-text-muted)] sm:py-3.5 sm:pl-12"
                />
              </div>

              <select
                value={idTypeFilter}
                onChange={(event) =>
                  handleFilterChange(setIdTypeFilter, event.target.value)
                }
                className="w-full rounded-[18px] border border-[rgba(25,56,52,0.12)] bg-white/[0.82] px-4 py-3 text-sm font-medium text-[var(--foreground)] outline-none transition-all focus:border-emerald-500/[0.3] focus:ring-4 focus:ring-emerald-500/[0.12] dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white sm:py-3.5"
              >
                {ID_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
              {STATUS_OPTIONS.map((option) => {
                const tone =
                  option.value === "pending"
                    ? "warning"
                    : option.value === "approved"
                      ? "success"
                      : option.value === "rejected"
                        ? "danger"
                        : option.value === "needs_correction"
                          ? "info"
                          : "default";
                const count =
                  option.value === "all"
                    ? requests.length
                    : counts[option.value] ?? 0;

                return (
                  <FilterChip
                    key={option.value}
                    active={statusFilter === option.value}
                    tone={tone}
                    onClick={() => handleFilterChange(setStatusFilter, option.value)}
                  >
                    {option.label} ({count})
                  </FilterChip>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[28px] border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(238,244,240,0.96))] shadow-[0_24px_70px_rgba(16,33,30,0.08)] dark:border-white/[0.08] dark:bg-[linear-gradient(180deg,rgba(25,56,52,0.94),rgba(8,18,16,0.98))] dark:shadow-[0_30px_80px_rgba(0,0,0,0.36)]">
          <CardHeader className="gap-2 border-b border-[rgba(25,56,52,0.08)] px-4 pb-3 pt-3 dark:border-white/[0.06] sm:gap-3 sm:px-6 sm:pb-5 sm:pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] dark:bg-emerald-500/[0.12] dark:text-emerald-300 sm:h-11 sm:w-11">
                <ShieldCheck className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={2.25} />
              </div>
              <div>
                <CardTitle className="truncate text-base font-semibold tracking-tight text-[var(--foreground)] dark:text-white sm:text-xl">
                  Request Queue
                </CardTitle>
                <div className="mt-1 text-xs font-medium text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                  {totalFiltered} request{totalFiltered === 1 ? "" : "s"} ready to review
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pt-3 sm:space-y-5 sm:px-6 sm:pt-6">
            {isLoading ? (
              <LoadingState />
            ) : totalFiltered === 0 ? (
              <EmptyState hasFilters={hasFilters} onReset={resetFilters} />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 lg:hidden sm:gap-4">
                  {paginatedRequests.map((request) => (
                    <VerificationRequestCard
                      key={request.id}
                      request={request}
                      onReview={() => navigate(`/admin/verification/${request.id}`)}
                    />
                  ))}
                </div>

                <div className="hidden overflow-hidden rounded-[24px] border border-[rgba(25,56,52,0.12)] bg-white/[0.78] shadow-[0_18px_45px_rgba(16,33,30,0.06)] dark:border-white/[0.07] dark:bg-white/[0.03] lg:block">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[960px]">
                      <thead>
                        <tr className="border-b border-[rgba(25,56,52,0.12)] bg-[rgba(230,240,236,0.72)] dark:border-white/[0.07] dark:bg-white/[0.04]">
                          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/70">Applicant</th>
                          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/70">Email</th>
                          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/70">Document Type</th>
                          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/70">Submitted</th>
                          <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/70">Status</th>
                          <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/70">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRequests.map((request) => {
                          const displayName = request.user_profiles?.username || request.full_name || "Unknown user";
                          const email = request.user_profiles?.email || "No email available";
                          const resolved = request.status !== "pending";

                          return (
                            <tr
                              key={request.id}
                              className="border-b border-[rgba(25,56,52,0.08)] transition-colors hover:bg-[rgba(230,240,236,0.52)] dark:border-white/[0.06] dark:hover:bg-white/[0.03]"
                            >
                              <td className="px-5 py-4">
                                <div className="text-sm font-semibold text-[var(--foreground)] dark:text-white">
                                  {displayName}
                                </div>
                                <div className="mt-1 text-xs text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                                  {request.full_name}
                                </div>
                              </td>
                              <td className="px-5 py-4 text-sm text-[var(--app-text-soft)] dark:text-[var(--app-text-soft)]">
                                {email}
                              </td>
                              <td className="px-5 py-4">
                                <span className="inline-flex rounded-full border border-[rgba(25,56,52,0.12)] bg-white/[0.84] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-white">
                                  {request.id_type || "Unknown"}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <div className="text-sm font-semibold text-[var(--foreground)] dark:text-white">
                                  {formatDate(request.created_at)}
                                </div>
                                <div className="mt-1 text-xs text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                                  {formatTime(request.created_at)}
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <AdminStatusBadge status={request.status} />
                              </td>
                              <td className="px-5 py-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/admin/verification/${request.id}`)}
                                  className="inline-flex items-center gap-2 rounded-full border border-emerald-500/[0.18] bg-emerald-500/[0.1] px-4 py-2 text-sm font-semibold text-emerald-800 transition-all hover:bg-emerald-500/[0.14] dark:text-emerald-200 dark:hover:bg-emerald-500/[0.16]"
                                >
                                  <Eye className="h-4 w-4" strokeWidth={2.1} />
                                  {resolved ? "View Details" : "Review"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[22px] border border-[rgba(25,56,52,0.12)] bg-white/[0.72] dark:border-white/[0.07] dark:bg-white/[0.03]">
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
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center pb-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/[0.15] bg-white/[0.72] px-4 py-2 text-sm font-medium text-[var(--app-text-soft)] dark:bg-white/[0.04] dark:text-emerald-50">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-300" />
              Loading verification queue
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
