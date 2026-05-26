import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Ban,
  CheckCircle,
  Eye,
  Loader2,
  Mail,
  Search,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";

import { api as apiClient } from "@/lib/apiClient";
import { TablePagination } from "@/shared/components/admin/TablePagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
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
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/components/ui/utils";

const adminSurfaceClass =
  "rounded-[28px] border border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(238,244,240,0.96))] shadow-[0_24px_70px_rgba(16,33,30,0.08)] dark:border-white/[0.08] dark:bg-[linear-gradient(180deg,rgba(25,56,52,0.94),rgba(8,18,16,0.98))] dark:shadow-[0_30px_80px_rgba(0,0,0,0.36)]";

const innerSurfaceClass =
  "rounded-[22px] border border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(244,247,245,0.92),rgba(255,255,255,0.98))] shadow-[0_14px_35px_rgba(16,33,30,0.05)] dark:border-white/[0.07] dark:bg-[linear-gradient(180deg,rgba(16,33,30,0.94),rgba(12,26,23,0.98))] dark:shadow-[0_18px_45px_rgba(0,0,0,0.24)]";

const inputClassName =
  "h-12 rounded-2xl border-[rgba(25,56,52,0.12)] bg-white/[0.84] px-4 text-sm text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] focus-visible:border-emerald-500/40 focus-visible:ring-emerald-500/20 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white";

const selectTriggerClassName =
  "h-12 rounded-2xl border-[rgba(25,56,52,0.12)] bg-white/[0.84] px-4 text-sm text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] focus-visible:border-emerald-500/40 focus-visible:ring-emerald-500/20 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white";

const emptyValue = "Not available";

const normalizeText = (value) => String(value || "").toLowerCase();

const formatDate = (value) => {
  if (!value) return emptyValue;
  return new Date(value).toLocaleDateString();
};

const formatDateTime = (value) => {
  if (!value) return emptyValue;
  return new Date(value).toLocaleString();
};

const getInitials = (name) =>
  String(name || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const getBanReasonMeta = (user) => {
  const rawReason = user?.banReasonLabel || user?.banReason || "Banned";
  const normalized = normalizeText(rawReason);

  if (normalized.includes("spam") || normalized.includes("fraud")) {
    return {
      label: user?.banReasonLabel || "Spam",
      tone: "border-amber-500/30 bg-amber-500/[0.12] text-amber-700 dark:text-amber-300",
    };
  }

  if (normalized.includes("multiple")) {
    return {
      label: user?.banReasonLabel || "Multiple Accounts",
      tone: "border-sky-500/30 bg-sky-500/[0.12] text-sky-700 dark:text-sky-300",
    };
  }

  if (normalized.includes("abuse")) {
    return {
      label: user?.banReasonLabel || "Abusive Behavior",
      tone: "border-rose-500/30 bg-rose-500/[0.12] text-rose-700 dark:text-rose-300",
    };
  }

  return {
    label: user?.banReasonLabel || "Policy Violation",
    tone: "border-orange-500/30 bg-orange-500/[0.12] text-orange-700 dark:text-orange-300",
  };
};

const getStatusMeta = (user) => {
  const normalizedStatus = normalizeText(user?.accountStatus || user?.status || "banned");

  if (normalizedStatus.includes("reinstated")) {
    return {
      label: "Reinstated",
      tone: "border-emerald-500/30 bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-300",
    };
  }

  if (normalizedStatus.includes("review")) {
    return {
      label: "Under Review",
      tone: "border-sky-500/30 bg-sky-500/[0.12] text-sky-700 dark:text-sky-300",
    };
  }

  if (normalizedStatus.includes("temporary") || normalizedStatus.includes("temp")) {
    return {
      label: "Temporarily Banned",
      tone: "border-amber-500/30 bg-amber-500/[0.12] text-amber-700 dark:text-amber-300",
    };
  }

  if (normalizedStatus.includes("permanent")) {
    return {
      label: "Permanently Banned",
      tone: "border-rose-500/30 bg-rose-500/[0.12] text-rose-700 dark:text-rose-300",
    };
  }

  return {
    label: "Banned",
    tone: "border-rose-500/30 bg-rose-500/[0.12] text-rose-700 dark:text-rose-300",
  };
};

const statToneStyles = {
  danger: {
    card:
      "border-rose-500/[0.24] bg-[linear-gradient(180deg,rgba(255,241,242,0.98),rgba(255,228,230,0.96))] dark:border-rose-500/[0.18] dark:bg-[linear-gradient(180deg,rgba(84,20,35,0.52),rgba(24,10,14,0.98))]",
    icon: "bg-rose-500/[0.14] text-rose-700 dark:bg-rose-500/[0.18] dark:text-rose-300",
  },
  warning: {
    card:
      "border-amber-500/25 bg-[linear-gradient(180deg,rgba(255,251,235,0.98),rgba(255,247,214,0.96))] dark:border-amber-500/20 dark:bg-[linear-gradient(180deg,rgba(69,41,8,0.5),rgba(26,18,8,0.98))]",
    icon: "bg-amber-500/[0.14] text-amber-700 dark:bg-amber-500/[0.18] dark:text-amber-300",
  },
  info: {
    card:
      "border-sky-500/[0.24] bg-[linear-gradient(180deg,rgba(239,246,255,0.98),rgba(224,242,254,0.96))] dark:border-sky-500/[0.18] dark:bg-[linear-gradient(180deg,rgba(16,58,74,0.52),rgba(8,18,24,0.98))]",
    icon: "bg-sky-500/[0.14] text-sky-700 dark:bg-sky-500/[0.18] dark:text-sky-300",
  },
  success: {
    card:
      "border-emerald-500/[0.24] bg-[linear-gradient(180deg,rgba(236,253,245,0.98),rgba(221,247,237,0.96))] dark:border-emerald-500/20 dark:bg-[linear-gradient(180deg,rgba(15,68,52,0.62),rgba(9,25,20,0.98))]",
    icon: "bg-emerald-500/[0.14] text-emerald-700 dark:bg-emerald-500/[0.18] dark:text-emerald-300",
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

function SummaryCard({ icon: Icon, label, value, tone = "danger" }) {
  const palette = statToneStyles[tone] || statToneStyles.danger;

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

function UserAvatar({ user }) {
  return (
    <Avatar className="h-11 w-11 rounded-2xl border border-rose-500/[0.16] bg-rose-500/[0.1] text-rose-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] dark:text-rose-200">
      <AvatarImage src={user?.avatarUrl || user?.avatar_url || user?.profilePicture} alt={user?.name || "User"} />
      <AvatarFallback className="rounded-2xl bg-transparent text-sm font-semibold">
        {getInitials(user?.name)}
      </AvatarFallback>
    </Avatar>
  );
}

function LoadingState() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className={cn("rounded-[24px] border", statToneStyles.danger.card)}>
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
                    <Skeleton className="h-4 w-32 rounded-full bg-[rgba(25,56,52,0.08)] dark:bg-white/[0.06]" />
                    <Skeleton className="h-3 w-40 rounded-full bg-[rgba(25,56,52,0.06)] dark:bg-white/[0.04]" />
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
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/[0.1] text-rose-700 dark:text-rose-300">
          <Ban className="h-7 w-7" strokeWidth={2.1} />
        </div>
        <h3 className="mt-5 text-xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
          No banned users found
        </h3>
        <p className="mt-2 max-w-md text-sm text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
          {hasFilters
            ? "Try changing your search or active ban reason filter to bring matching records back into view."
            : "No users are currently banned."}
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
          Unable to load banned users
        </h3>
        <p className="mt-2 max-w-md text-sm text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
          The banned users list could not be loaded right now. Please try again.
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

function BannedUserCard({ user, onViewDetails, onUnban }) {
  const reason = getBanReasonMeta(user);
  const status = getStatusMeta(user);

  return (
    <Card className={cn(innerSurfaceClass, "overflow-hidden")}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <UserAvatar user={user} />
              <div className="min-w-0">
                <div className="truncate text-base font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
                  {user.name || "Unknown user"}
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{user.email || "No email on file"}</span>
                </div>
              </div>
            </div>
            <AdminStatusBadge label={status.label} className={status.tone} />
          </div>

          <div className="flex flex-wrap gap-2">
            <AdminStatusBadge label={reason.label} className={reason.tone} />
          </div>

          {user.notes ? (
            <div className="rounded-[18px] border border-[rgba(25,56,52,0.12)] bg-white/[0.72] p-3 text-sm italic text-[var(--app-text-muted)] dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-[var(--app-text-muted)]">
              {user.notes}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[18px] border border-[rgba(25,56,52,0.12)] bg-white/[0.72] p-3 dark:border-white/[0.07] dark:bg-white/[0.03]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                Date Banned
              </div>
              <div className="mt-1.5 text-sm font-semibold text-[var(--foreground)] dark:text-white">
                {formatDate(user.banDate)}
              </div>
            </div>
            <div className="rounded-[18px] border border-[rgba(25,56,52,0.12)] bg-white/[0.72] p-3 dark:border-white/[0.07] dark:bg-white/[0.03]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                Banned By
              </div>
              <div className="mt-1.5 text-sm font-semibold text-[var(--foreground)] dark:text-white">
                {user.bannedBy || emptyValue}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              onClick={onViewDetails}
              variant="outline"
              className="h-11 flex-1 rounded-full border-emerald-500/[0.18] bg-white/[0.72] text-[var(--foreground)] hover:border-emerald-500/[0.28] hover:bg-white dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]"
            >
              <Eye className="h-4 w-4" strokeWidth={2.1} />
              View Details
            </Button>
            <Button
              type="button"
              onClick={onUnban}
              className="h-11 flex-1 rounded-full bg-[linear-gradient(135deg,#1f6a55,#193834)] text-white shadow-[0_18px_45px_rgba(25,56,52,0.22)] hover:opacity-95"
            >
              <CheckCircle className="h-4 w-4" strokeWidth={2.1} />
              Unban User
            </Button>
          </div>
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

export function BannedUsers() {
  const [bannedUsers, setBannedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [unbanModalData, setUnbanModalData] = useState(null);
  const [unbanNotes, setUnbanNotes] = useState("");
  const [isSubmittingUnban, setIsSubmittingUnban] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchBannedUsers = async () => {
    setIsLoading(true);
    setFetchError(false);

    try {
      const data = await apiClient.get("/admin/banned-users");
      setBannedUsers(data || []);
    } catch (error) {
      console.error("Failed to fetch banned users:", error);
      setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBannedUsers();
  }, []);

  const handleUnbanUser = async () => {
    if (!unbanModalData) return;

    setIsSubmittingUnban(true);

    try {
      await apiClient.post(`/admin/bans/${unbanModalData.banId}/unban`, {
        notes: unbanNotes,
      });

      setUnbanModalData(null);
      setUnbanNotes("");
      fetchBannedUsers();
    } catch (error) {
      console.error("Failed to unban user:", error);
      alert("Failed to unban user. Please try again.");
    } finally {
      setIsSubmittingUnban(false);
    }
  };

  const reasonOptions = useMemo(() => {
    const uniqueReasons = Array.from(
      new Set(
        bannedUsers
          .map((user) => user.banReason || user.banReasonLabel)
          .filter(Boolean),
      ),
    );

    return [
      { value: "all", label: "All reasons" },
      ...uniqueReasons.map((reason) => ({
        value: normalizeText(reason),
        label: reason,
      })),
    ];
  }, [bannedUsers]);

  const filteredUsers = useMemo(() => {
    return bannedUsers.filter((user) => {
      const name = normalizeText(user.name);
      const email = normalizeText(user.email);
      const reason = normalizeText(user.banReason || user.banReasonLabel);

      const matchesSearch =
        searchQuery === "" ||
        name.includes(normalizeText(searchQuery)) ||
        email.includes(normalizeText(searchQuery));

      const matchesReason = reasonFilter === "all" || reason === reasonFilter;

      return matchesSearch && matchesReason;
    });
  }, [bannedUsers, searchQuery, reasonFilter]);

  const totalFiltered = filteredUsers.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const handleResetFilters = () => {
    setSearchQuery("");
    setReasonFilter("all");
    setCurrentPage(1);
  };

  const spamCount = bannedUsers.filter((user) =>
    normalizeText(user.banReason).includes("spam"),
  ).length;
  const abuseCount = bannedUsers.filter((user) =>
    normalizeText(user.banReason).includes("abuse"),
  ).length;
  const multipleAccountsCount = bannedUsers.filter((user) =>
    normalizeText(user.banReason).includes("multiple_accounts"),
  ).length;
  const reviewedCount = bannedUsers.filter((user) =>
    normalizeText(user.accountStatus || user.status).includes("review"),
  ).length;
  const hasFilters = searchQuery.trim() !== "" || reasonFilter !== "all";

  return (
    <>
      <div className="p-4 lg:p-8">
        <div className="mx-auto max-w-[1600px] space-y-6">
          <Card className={cn(adminSurfaceClass, "overflow-hidden")}>
            <CardContent className="px-4 py-5 sm:px-6 sm:py-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0 space-y-3">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.1] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800 dark:text-emerald-300">
                    <ShieldAlert className="h-3.5 w-3.5" strokeWidth={2.2} />
                    Admin Workspace
                  </div>
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] dark:bg-rose-500/[0.12] dark:text-rose-300 sm:h-14 sm:w-14">
                      <Ban className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0 space-y-2">
                      <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white sm:text-4xl">
                        Banned Users
                      </h1>
                      <p className="max-w-2xl text-sm leading-6 text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)] sm:text-base">
                        Review banned accounts, inspect violations, and manage reinstatement decisions from one compact moderation workspace.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:w-auto sm:grid-cols-2 lg:min-w-[320px]">
                  <div className="rounded-[22px] border border-[rgba(25,56,52,0.12)] bg-white/[0.84] px-4 py-3 shadow-[0_14px_35px_rgba(16,33,30,0.06)] dark:border-white/[0.07] dark:bg-white/[0.04]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                      Filtered Users
                    </div>
                    <div className="mt-1 text-2xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
                      {totalFiltered}
                    </div>
                  </div>
                  <div className="rounded-[22px] border border-[rgba(25,56,52,0.12)] bg-white/[0.84] px-4 py-3 shadow-[0_14px_35px_rgba(16,33,30,0.06)] dark:border-white/[0.07] dark:bg-white/[0.04]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                      Total Banned
                    </div>
                    <div className="mt-1 text-2xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
                      {bannedUsers.length}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <SummaryCard icon={Ban} label="Total Banned" value={bannedUsers.length} tone="danger" />
            <SummaryCard icon={Sparkles} label="Spam Cases" value={spamCount} tone="warning" />
            <SummaryCard icon={AlertCircle} label="Abuse Cases" value={abuseCount} tone="danger" />
            <SummaryCard icon={Users} label="Under Review" value={reviewedCount || multipleAccountsCount} tone="info" />
          </section>

          <Card className={adminSurfaceClass}>
            <CardContent className="px-4 py-4 sm:px-6 sm:py-6">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_240px_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-muted)]" />
                  <Input
                    type="text"
                    placeholder="Search by name or email"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setCurrentPage(1);
                    }}
                    className={cn(inputClassName, "pl-11")}
                  />
                </div>

                <Select
                  value={reasonFilter}
                  onValueChange={(value) => {
                    setReasonFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className={selectTriggerClassName}>
                    <SelectValue placeholder="Filter by ban reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {reasonOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
          {!isLoading && fetchError ? <ErrorState onRetry={fetchBannedUsers} /> : null}
          {!isLoading && !fetchError && totalFiltered === 0 ? (
            <EmptyState hasFilters={hasFilters} onReset={handleResetFilters} />
          ) : null}

          {!isLoading && !fetchError && totalFiltered > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-3 lg:hidden">
                {paginatedUsers.map((user) => (
                  <BannedUserCard
                    key={user.id}
                    user={user}
                    onViewDetails={() => setSelectedUser(user)}
                    onUnban={() =>
                      setUnbanModalData({
                        banId: user.id,
                        userId: user.userId,
                        userName: user.name,
                        userEmail: user.email,
                      })
                    }
                  />
                ))}
              </div>

              <Card className={cn(adminSurfaceClass, "hidden overflow-hidden lg:block")}>
                <CardHeader className="gap-3 border-b border-[rgba(25,56,52,0.08)] px-6 pb-4 pt-6 dark:border-white/[0.06]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
                        Banned User Directory
                      </CardTitle>
                      <CardDescription className="text-sm text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                        Compact view of violations, ban status, moderator actions, and reinstatement options.
                      </CardDescription>
                    </div>
                    <div className="rounded-full border border-rose-500/20 bg-rose-500/[0.1] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-800 dark:text-rose-300">
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
                            User
                          </th>
                          <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                            Ban Reason
                          </th>
                          <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                            Date Banned
                          </th>
                          <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                            Banned By
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
                        {paginatedUsers.map((user) => {
                          const reason = getBanReasonMeta(user);
                          const status = getStatusMeta(user);

                          return (
                            <tr
                              key={user.id}
                              className="border-b border-[rgba(25,56,52,0.08)] transition-colors hover:bg-[rgba(25,56,52,0.03)] dark:border-white/[0.06] dark:hover:bg-white/[0.03]"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-start gap-3">
                                  <UserAvatar user={user} />
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold text-[var(--foreground)] dark:text-white">
                                      {user.name || "Unknown user"}
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                                      <Mail className="h-3.5 w-3.5 shrink-0" />
                                      <span className="truncate">{user.email || "No email on file"}</span>
                                    </div>
                                    {user.notes ? (
                                      <div className="mt-2 max-w-md text-xs italic text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                                        {user.notes}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <AdminStatusBadge label={reason.label} className={reason.tone} />
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="text-sm font-semibold text-[var(--foreground)] dark:text-white">
                                  {formatDate(user.banDate)}
                                </div>
                                <div className="mt-1 text-xs text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                                  {formatDateTime(user.banDate).split(", ").slice(1).join(", ") || emptyValue}
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="text-sm font-semibold text-[var(--foreground)] dark:text-white">
                                  {user.bannedBy || emptyValue}
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <AdminStatusBadge label={status.label} className={status.tone} />
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSelectedUser(user)}
                                    className="h-10 rounded-full border-emerald-500/[0.18] bg-white/[0.72] px-4 text-[var(--foreground)] hover:border-emerald-500/[0.28] hover:bg-white dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]"
                                  >
                                    <Eye className="h-4 w-4" strokeWidth={2.1} />
                                    Review
                                  </Button>
                                  <Button
                                    type="button"
                                    onClick={() =>
                                      setUnbanModalData({
                                        banId: user.id,
                                        userId: user.userId,
                                        userName: user.name,
                                        userEmail: user.email,
                                      })
                                    }
                                    className="h-10 rounded-full bg-[linear-gradient(135deg,#1f6a55,#193834)] px-4 text-white shadow-[0_18px_45px_rgba(25,56,52,0.22)] hover:opacity-95"
                                  >
                                    <CheckCircle className="h-4 w-4" strokeWidth={2.1} />
                                    Unban
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

      <Dialog open={Boolean(selectedUser)} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[28px] border-[rgba(25,56,52,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(238,244,240,0.97))] p-0 shadow-[0_32px_80px_rgba(16,33,30,0.18)] dark:border-white/[0.08] dark:bg-[linear-gradient(180deg,rgba(25,56,52,0.95),rgba(8,18,16,0.99))] sm:max-w-3xl">
          {selectedUser ? (
            <>
              <DialogHeader className="border-b border-[rgba(25,56,52,0.08)] px-6 pb-5 pt-6 text-left dark:border-white/[0.06]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="shrink-0">
                      <UserAvatar user={selectedUser} />
                    </div>
                    <div className="min-w-0">
                      <DialogTitle className="truncate text-2xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
                        {selectedUser.name || "Unknown user"}
                      </DialogTitle>
                      <DialogDescription className="mt-1 flex items-center gap-2 text-sm text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                        <Mail className="h-4 w-4 shrink-0" />
                        <span className="truncate">{selectedUser.email || "No email on file"}</span>
                      </DialogDescription>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <AdminStatusBadge
                          label={getBanReasonMeta(selectedUser).label}
                          className={getBanReasonMeta(selectedUser).tone}
                        />
                        <AdminStatusBadge
                          label={getStatusMeta(selectedUser).label}
                          className={getStatusMeta(selectedUser).tone}
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="h-11 rounded-full bg-[linear-gradient(135deg,#1f6a55,#193834)] px-5 text-white shadow-[0_18px_45px_rgba(25,56,52,0.22)] hover:opacity-95"
                  >
                    <Eye className="h-4 w-4" />
                    Close
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-6 px-6 py-6">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <SectionField label="Status" value={getStatusMeta(selectedUser).label} />
                  <SectionField label="Ban Reason" value={getBanReasonMeta(selectedUser).label} />
                  <SectionField label="Karma Score" value={selectedUser.karma ?? emptyValue} />
                  <SectionField label="Banned By" value={selectedUser.bannedBy || emptyValue} />
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <SectionField label="Date Banned" value={formatDateTime(selectedUser.banDate)} />
                  <SectionField label="Ban Type" value={getStatusMeta(selectedUser).label} />
                  <SectionField label="Related Reports" value={selectedUser.relatedReportsCount ?? emptyValue} />
                  <SectionField label="Violations" value={selectedUser.violationsCount ?? emptyValue} />
                </div>

                <SectionField
                  label="Admin Notes"
                  value={selectedUser.notes || selectedUser.adminNotes || emptyValue}
                />

                <Card className={innerSurfaceClass}>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedUser(null)}
                        className="h-11 flex-1 rounded-full border-emerald-500/[0.18] bg-white/[0.72] text-[var(--foreground)] hover:border-emerald-500/[0.28] hover:bg-white dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]"
                      >
                        Keep Banned
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setSelectedUser(null);
                          setUnbanModalData({
                            banId: selectedUser.id,
                            userId: selectedUser.userId,
                            userName: selectedUser.name,
                            userEmail: selectedUser.email,
                          });
                        }}
                        className="h-11 flex-1 rounded-full bg-[linear-gradient(135deg,#1f6a55,#193834)] text-white shadow-[0_18px_45px_rgba(25,56,52,0.22)] hover:opacity-95"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Unban User
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(unbanModalData)}
        onOpenChange={(open) => {
          if (!open) {
            setUnbanModalData(null);
            setUnbanNotes("");
          }
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[28px] border-[rgba(16,185,129,0.24)] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(237,252,244,0.97))] p-0 shadow-[0_32px_80px_rgba(16,33,30,0.18)] dark:border-emerald-500/20 dark:bg-[linear-gradient(180deg,rgba(15,68,52,0.92),rgba(9,25,20,0.99))] sm:max-w-xl">
          <DialogHeader className="border-b border-emerald-500/15 px-6 pb-5 pt-6 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-300">
                <CheckCircle className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
                  Unban User
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-[var(--app-text-muted)] dark:text-emerald-100/70">
                  Confirm reinstatement before restoring account access.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 px-6 py-6">
            <div className="rounded-[22px] border border-emerald-500/15 bg-white/[0.74] p-4 dark:bg-white/[0.03]">
              <div className="text-sm font-semibold text-[var(--foreground)] dark:text-white">
                {unbanModalData?.userName || "Unknown user"}
              </div>
              <div className="mt-1 text-sm text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                {unbanModalData?.userEmail || "No email on file"}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--foreground)] dark:text-white">
                Admin Notes
              </label>
              <Textarea
                value={unbanNotes}
                onChange={(event) => setUnbanNotes(event.target.value)}
                placeholder="Add any notes about this reinstatement"
                rows={4}
                className="rounded-[20px] border-emerald-500/15 bg-white/[0.84] px-4 py-3 text-sm focus-visible:border-emerald-500/40 focus-visible:ring-emerald-500/20 dark:bg-white/[0.04]"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-emerald-500/15 px-6 py-5 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setUnbanModalData(null);
                setUnbanNotes("");
              }}
              className="h-11 rounded-full border-[rgba(25,56,52,0.12)] bg-white/[0.8] px-5 text-[var(--foreground)] hover:bg-white dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUnbanUser}
              disabled={isSubmittingUnban}
              className="h-11 rounded-full bg-[linear-gradient(135deg,#1f6a55,#193834)] px-5 text-white shadow-[0_18px_45px_rgba(25,56,52,0.22)] hover:opacity-95"
            >
              {isSubmittingUnban ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Unban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
