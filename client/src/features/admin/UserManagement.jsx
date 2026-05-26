import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Ban,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Eye,
  Loader2,
  Mail,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { useBanUser, useUnbanUser, useUserManagement } from "@/hooks/admin/useUserManagement";
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

const reasonLabels = {
  spam: "Spam or fraudulent activity",
  abuse: "Abusive behavior",
  false_info: "Submitting false information",
  multiple_accounts: "Multiple accounts",
  other: "Other violation",
};

const categoryDefinitions = [
  { value: "all", label: "All Users" },
  { value: "verified", label: "Verified" },
  { value: "unverified", label: "Unverified" },
  { value: "pending", label: "Pending" },
  { value: "banned", label: "Banned" },
  { value: "active", label: "Active" },
  { value: "admins", label: "Admins" },
  { value: "contributors", label: "Contributors" },
  { value: "regular", label: "Regular" },
];

const adminSurfaceClass =
  "rounded-[28px] border border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(238,244,240,0.96))] shadow-[0_24px_70px_rgba(16,33,30,0.08)] dark:border-white/[0.08] dark:bg-[linear-gradient(180deg,rgba(25,56,52,0.94),rgba(8,18,16,0.98))] dark:shadow-[0_30px_80px_rgba(0,0,0,0.36)]";

const innerSurfaceClass =
  "rounded-[22px] border border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(244,247,245,0.92),rgba(255,255,255,0.98))] shadow-[0_14px_35px_rgba(16,33,30,0.05)] dark:border-white/[0.07] dark:bg-[linear-gradient(180deg,rgba(16,33,30,0.94),rgba(12,26,23,0.98))] dark:shadow-[0_18px_45px_rgba(0,0,0,0.24)]";

const inputClassName =
  "h-12 rounded-2xl border-[rgba(25,56,52,0.12)] bg-white/[0.84] px-4 text-sm text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] focus-visible:border-emerald-500/40 focus-visible:ring-emerald-500/20 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white";

const selectTriggerClassName =
  "h-12 rounded-2xl border-[rgba(25,56,52,0.12)] bg-white/[0.84] px-4 text-sm text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] focus-visible:border-emerald-500/40 focus-visible:ring-emerald-500/20 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white";

const statToneStyles = {
  neutral: {
    card:
      "border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(237,243,239,0.96))] dark:border-white/[0.08] dark:bg-[linear-gradient(180deg,rgba(25,56,52,0.94),rgba(9,22,20,0.98))]",
    icon:
      "bg-[rgba(25,56,52,0.08)] text-[var(--primary)] dark:bg-emerald-500/[0.14] dark:text-emerald-300",
  },
  success: {
    card:
      "border-emerald-500/[0.24] bg-[linear-gradient(180deg,rgba(236,253,245,0.98),rgba(221,247,237,0.96))] dark:border-emerald-500/20 dark:bg-[linear-gradient(180deg,rgba(15,68,52,0.62),rgba(9,25,20,0.98))]",
    icon:
      "bg-emerald-500/[0.14] text-emerald-700 dark:bg-emerald-500/[0.18] dark:text-emerald-300",
  },
  info: {
    card:
      "border-sky-500/[0.24] bg-[linear-gradient(180deg,rgba(239,246,255,0.98),rgba(224,242,254,0.96))] dark:border-sky-500/[0.18] dark:bg-[linear-gradient(180deg,rgba(16,58,74,0.52),rgba(8,18,24,0.98))]",
    icon:
      "bg-sky-500/[0.14] text-sky-700 dark:bg-sky-500/[0.18] dark:text-sky-300",
  },
  warning: {
    card:
      "border-amber-500/25 bg-[linear-gradient(180deg,rgba(255,251,235,0.98),rgba(255,247,214,0.96))] dark:border-amber-500/20 dark:bg-[linear-gradient(180deg,rgba(69,41,8,0.5),rgba(26,18,8,0.98))]",
    icon:
      "bg-amber-500/[0.14] text-amber-700 dark:bg-amber-500/[0.18] dark:text-amber-300",
  },
  danger: {
    card:
      "border-rose-500/[0.24] bg-[linear-gradient(180deg,rgba(255,241,242,0.98),rgba(255,228,230,0.96))] dark:border-rose-500/[0.18] dark:bg-[linear-gradient(180deg,rgba(84,20,35,0.52),rgba(24,10,14,0.98))]",
    icon:
      "bg-rose-500/[0.14] text-rose-700 dark:bg-rose-500/[0.18] dark:text-rose-300",
  },
};

const emptyValue = "Not available";

const normalizeText = (value) => String(value || "").toLowerCase().trim();

const formatDate = (value) => {
  if (!value) return emptyValue;
  return new Date(value).toLocaleDateString();
};

const formatDateTime = (value) => {
  if (!value) return emptyValue;
  return new Date(value).toLocaleString();
};

const formatPercent = (value) => `${Number(value || 0)}%`;

const getInitials = (name) =>
  String(name || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const getRoleLabel = (user) => {
  if (user?.role) return String(user.role).replace(/_/g, " ");
  if (user?.user_type === 0) return "Admin";
  return "User";
};

const isAdmin = (user) => normalizeText(getRoleLabel(user)).includes("admin");

const isContributor = (user) =>
  normalizeText(getRoleLabel(user)).includes("contributor") || Number(user?.karma || 0) > 200;

const getVerificationMeta = (status) => {
  switch (normalizeText(status)) {
    case "verified":
      return {
        label: "Verified",
        tone:
          "border-emerald-500/30 bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-300",
      };
    case "pending":
      return {
        label: "Pending",
        tone:
          "border-amber-500/30 bg-amber-500/[0.12] text-amber-700 dark:text-amber-300",
      };
    default:
      return {
        label: "Unverified",
        tone:
          "border-slate-500/20 bg-slate-500/[0.1] text-slate-700 dark:text-slate-300",
      };
  }
};

const getAccountStatusMeta = (status) => {
  switch (normalizeText(status)) {
    case "banned":
    case "suspended":
      return {
        label: "Banned",
        tone:
          "border-rose-500/30 bg-rose-500/[0.12] text-rose-700 dark:text-rose-300",
      };
    case "inactive":
      return {
        label: "Inactive",
        tone:
          "border-slate-500/20 bg-slate-500/[0.1] text-slate-700 dark:text-slate-300",
      };
    default:
      return {
        label: "Active",
        tone:
          "border-emerald-500/30 bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-300",
      };
  }
};

const getRoleTone = (role) => {
  const normalized = normalizeText(role);
  if (normalized.includes("admin")) {
    return "border-violet-500/30 bg-violet-500/[0.12] text-violet-700 dark:text-violet-300";
  }
  if (normalized.includes("contributor")) {
    return "border-teal-500/30 bg-teal-500/[0.12] text-teal-700 dark:text-teal-300";
  }
  return "border-slate-500/20 bg-slate-500/[0.1] text-slate-700 dark:text-slate-300";
};

const getBanReasonMeta = (user) => {
  const rawReason = user?.banReasonLabel || user?.banReason || "Policy Violation";
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

const isBannedUser = (user) =>
  ["banned", "suspended"].includes(normalizeText(user?.accountStatus)) || Boolean(user?.banRecordId);

const isActiveUser = (user) => !["banned", "suspended", "inactive"].includes(normalizeText(user?.accountStatus));

const matchesCategory = (user, category) => {
  switch (category) {
    case "verified":
      return normalizeText(user.verificationStatus) === "verified";
    case "unverified":
      return !["verified", "pending"].includes(normalizeText(user.verificationStatus));
    case "pending":
      return normalizeText(user.verificationStatus) === "pending";
    case "banned":
      return isBannedUser(user);
    case "active":
      return isActiveUser(user);
    case "admins":
      return isAdmin(user);
    case "contributors":
      return isContributor(user);
    case "regular":
      return !isAdmin(user) && !isContributor(user);
    default:
      return true;
  }
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
          <div className="space-y-3">
            <Skeleton className="h-12 rounded-2xl bg-[rgba(25,56,52,0.08)] dark:bg-white/[0.06]" />
            <Skeleton className="h-16 rounded-[24px] bg-[rgba(25,56,52,0.08)] dark:bg-white/[0.06]" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ categoryLabel, hasFilters, onReset }) {
  return (
    <Card className={adminSurfaceClass}>
      <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/[0.1] text-emerald-700 dark:text-emerald-300">
          <Users className="h-7 w-7" strokeWidth={2.1} />
        </div>
        <h3 className="mt-5 text-xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
          No matching users found
        </h3>
        <p className="mt-2 max-w-md text-sm text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
          {hasFilters
            ? `Try changing your search or selected category to see more than the current ${categoryLabel.toLowerCase()} view.`
            : "No user records are available right now."}
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
          Unable to load users
        </h3>
        <p className="mt-2 max-w-md text-sm text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
          The user list could not be loaded right now. Please try again.
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

function UserAvatar({ user, className }) {
  const isRestricted = isBannedUser(user);

  return (
    <Avatar
      className={cn(
        "h-11 w-11 rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]",
        isRestricted
          ? "border-rose-500/[0.16] bg-rose-500/[0.1] text-rose-800 dark:text-rose-200"
          : "border-emerald-500/[0.16] bg-emerald-500/[0.1] text-emerald-800 dark:text-emerald-200",
        className,
      )}
    >
      <AvatarImage src={user?.avatarUrl || user?.avatar_url || user?.profilePicture} alt={user?.name || "User"} />
      <AvatarFallback className="rounded-2xl bg-transparent text-sm font-semibold">
        {getInitials(user?.name)}
      </AvatarFallback>
    </Avatar>
  );
}

function SectionField({ label, value, className }) {
  return (
    <div className={cn("rounded-[18px] border border-[rgba(25,56,52,0.12)] bg-white/[0.74] p-3.5 dark:border-white/[0.07] dark:bg-white/[0.03]", className)}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
        {label}
      </div>
      <div className="mt-1.5 text-sm font-semibold text-[var(--foreground)] dark:text-white">
        {value ?? emptyValue}
      </div>
    </div>
  );
}

function UserManagementCard({ user, onViewDetails, onRestrict, onReinstate }) {
  const roleLabel = getRoleLabel(user);
  const verification = getVerificationMeta(user.verificationStatus);
  const accountStatus = getAccountStatusMeta(user.accountStatus);
  const isTrustedContributor = isContributor(user);
  const restricted = isBannedUser(user);
  const banReason = restricted ? getBanReasonMeta(user) : null;

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
                <div className="mt-1 text-sm text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                  {user.email || "No email on file"}
                </div>
              </div>
            </div>
            <AdminStatusBadge label={accountStatus.label} className={accountStatus.tone} />
          </div>

          <div className="flex flex-wrap gap-2">
            <AdminStatusBadge label={roleLabel} className={getRoleTone(roleLabel)} />
            <AdminStatusBadge label={verification.label} className={verification.tone} />
            {isTrustedContributor ? (
              <AdminStatusBadge
                label="Contributor"
                className="border-teal-500/30 bg-teal-500/[0.12] text-teal-700 dark:text-teal-300"
              />
            ) : (
              <AdminStatusBadge
                label="Regular"
                className="border-slate-500/20 bg-slate-500/[0.1] text-slate-700 dark:text-slate-300"
              />
            )}
            {isAdmin(user) ? (
              <AdminStatusBadge
                label="Admin"
                className="border-violet-500/30 bg-violet-500/[0.12] text-violet-700 dark:text-violet-300"
              />
            ) : null}
            {banReason ? <AdminStatusBadge label={banReason.label} className={banReason.tone} /> : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SectionField label="Karma" value={user.karma ?? 0} />
            <SectionField label="Joined" value={formatDate(user.joinDate)} />
            <SectionField label="Role" value={roleLabel} />
            <SectionField label="Verification" value={verification.label} />
          </div>

          {restricted ? (
            <div className="grid grid-cols-2 gap-3">
              <SectionField label="Date Banned" value={formatDate(user.banDate)} />
              <SectionField label="Banned By" value={user.bannedBy || emptyValue} />
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              onClick={onViewDetails}
              variant="outline"
              className="h-11 flex-1 rounded-full border-emerald-500/[0.18] bg-white/[0.72] text-[var(--foreground)] hover:border-emerald-500/[0.28] hover:bg-white dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]"
            >
              <Eye className="h-4 w-4" strokeWidth={2.1} />
              View Details
              <ChevronRight className="h-4 w-4" strokeWidth={2.15} />
            </Button>
            {restricted ? (
              <Button
                type="button"
                onClick={onReinstate}
                disabled={!user.banRecordId}
                className="h-11 flex-1 rounded-full bg-[linear-gradient(135deg,#1f6a55,#193834)] text-white shadow-[0_18px_45px_rgba(25,56,52,0.22)] hover:opacity-95 disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" strokeWidth={2.1} />
                {user.banRecordId ? "Reactivate" : "Restricted"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={onRestrict}
                className="h-11 flex-1 rounded-full bg-[linear-gradient(135deg,#be123c,#dc2626)] text-white shadow-[0_18px_45px_rgba(159,18,57,0.22)] hover:opacity-95"
              >
                <Ban className="h-4 w-4" strokeWidth={2.1} />
                Ban User
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function UserManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(
    categoryDefinitions.some((item) => item.value === initialCategory) ? initialCategory : "all",
  );
  const [banReasonFilter, setBanReasonFilter] = useState("all");
  const [banModalData, setBanModalData] = useState(null);
  const [unbanModalData, setUnbanModalData] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [banReason, setBanReason] = useState("");
  const [banNotes, setBanNotes] = useState("");
  const [unbanNotes, setUnbanNotes] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const {
    data: users = [],
    isLoading,
    isError: fetchError,
    refetch,
  } = useUserManagement();
  const banMutation = useBanUser();
  const unbanMutation = useUnbanUser();
  const isSubmittingBan = banMutation.isPending;
  const isSubmittingUnban = unbanMutation.isPending;

  useEffect(() => {
    const nextCategory = searchParams.get("category");
    if (categoryDefinitions.some((item) => item.value === nextCategory) && nextCategory !== categoryFilter) {
      setCategoryFilter(nextCategory);
      setCurrentPage(1);
    }
    if (!nextCategory && categoryFilter !== "all") {
      setCategoryFilter("all");
      setCurrentPage(1);
    }
  }, [searchParams, categoryFilter]);

  const handleBanUser = async () => {
    if (!banModalData || !banReason) return;

    try {
      await banMutation.mutateAsync({
        userId: banModalData.userId,
        payload: {
          reason: banReason,
          reason_label: reasonLabels[banReason] || "Other violation",
          notes: banNotes,
        },
      });

      setBanModalData(null);
      setBanReason("");
      setBanNotes("");
      toast.success("User banned successfully.");
    } catch (error) {
      toast.error(error.message || "Failed to ban user.");
    }
  };

  const handleUnbanUser = async () => {
    if (!unbanModalData?.banRecordId) return;

    try {
      await unbanMutation.mutateAsync({
        banId: unbanModalData.banRecordId,
        payload: {
          notes: unbanNotes,
        },
      });

      setUnbanModalData(null);
      setUnbanNotes("");
      toast.success("User unbanned successfully.");
    } catch (error) {
      toast.error(error.message || "Failed to reactivate user.");
    }
  };

  const categoryCounts = useMemo(() => {
    return Object.fromEntries(
      categoryDefinitions.map((item) => [
        item.value,
        users.filter((user) => matchesCategory(user, item.value)).length,
      ]),
    );
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const userName = normalizeText(user.name);
      const userEmail = normalizeText(user.email);
      const searchValue = normalizeText(searchQuery);
      const matchesSearch =
        searchValue === "" || userName.includes(searchValue) || userEmail.includes(searchValue);
      const matchesSelectedCategory = matchesCategory(user, categoryFilter);
      const matchesBanReason =
        banReasonFilter === "all" ||
        normalizeText(user.banReason || user.banReasonLabel).includes(banReasonFilter);

      return matchesSearch && matchesSelectedCategory && matchesBanReason;
    });
  }, [users, searchQuery, categoryFilter, banReasonFilter]);

  const totalFiltered = filteredUsers.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const handleCategoryChange = (value) => {
    setCategoryFilter(value);
    setBanReasonFilter("all");
    setCurrentPage(1);

    const nextParams = new URLSearchParams(searchParams);
    if (value === "all") {
      nextParams.delete("category");
    } else {
      nextParams.set("category", value);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setBanReasonFilter("all");
    handleCategoryChange("all");
  };

  const categoryMeta = categoryDefinitions.find((item) => item.value === categoryFilter) || categoryDefinitions[0];
  const verifiedCount = categoryCounts.verified || 0;
  const pendingCount = categoryCounts.pending || 0;
  const activeCount = categoryCounts.active || 0;
  const bannedCount = categoryCounts.banned || 0;
  const contributorCount = categoryCounts.contributors || 0;
  const hasFilters = searchQuery.trim() !== "" || categoryFilter !== "all" || banReasonFilter !== "all";
  const showBanReasonFilter = categoryFilter === "banned";
  const banReasonOptions = useMemo(() => {
    const uniqueReasons = Array.from(
      new Set(
        users
          .filter((user) => isBannedUser(user))
          .map((user) => user.banReasonLabel || user.banReason)
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
  }, [users]);

  return (
    <>
      <div className="p-4 lg:p-8">
        <div className="mx-auto max-w-[1600px] space-y-6">
          <Card className={cn(adminSurfaceClass, "overflow-hidden")}>
            <CardContent className="px-4 py-5 sm:px-6 sm:py-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0 space-y-3">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.1] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800 dark:text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.2} />
                    Admin Workspace
                  </div>
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] dark:bg-emerald-500/[0.12] dark:text-emerald-300 sm:h-14 sm:w-14">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0 space-y-2">
                      <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white sm:text-4xl">
                        User Management
                      </h1>
                      <p className="max-w-2xl text-sm leading-6 text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)] sm:text-base">
                        Manage verified, pending, regular, contributor, and restricted accounts from one central user control area.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:w-auto sm:grid-cols-2 lg:min-w-[320px]">
                  <div className="rounded-[22px] border border-[rgba(25,56,52,0.12)] bg-white/[0.84] px-4 py-3 shadow-[0_14px_35px_rgba(16,33,30,0.06)] dark:border-white/[0.07] dark:bg-white/[0.04]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                      Current View
                    </div>
                    <div className="mt-1 text-base font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
                      {categoryMeta.label}
                    </div>
                  </div>
                  <div className="rounded-[22px] border border-[rgba(25,56,52,0.12)] bg-white/[0.84] px-4 py-3 shadow-[0_14px_35px_rgba(16,33,30,0.06)] dark:border-white/[0.07] dark:bg-white/[0.04]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                      Filtered Users
                    </div>
                    <div className="mt-1 text-2xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
                      {totalFiltered}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <SummaryCard icon={Users} label="Total Users" value={users.length} tone="neutral" />
            <SummaryCard icon={ShieldCheck} label="Verified" value={verifiedCount} tone="success" />
            <SummaryCard icon={Shield} label="Pending" value={pendingCount} tone="warning" />
            <SummaryCard icon={Ban} label="Restricted" value={bannedCount} tone="danger" />
            <SummaryCard icon={CheckCircle2} label="Active" value={activeCount} tone="success" />
            <SummaryCard icon={Sparkles} label="Contributors" value={contributorCount} tone="info" />
          </section>

          <Card className={adminSurfaceClass}>
            <CardContent className="space-y-4 px-4 py-4 sm:px-6 sm:py-6">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-text-muted)]" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search by name or email"
                  className={cn(inputClassName, "pl-11")}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {categoryDefinitions.map((item) => {
                  const isActiveChip = item.value === categoryFilter;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => handleCategoryChange(item.value)}
                      className={cn(
                        "shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all",
                        isActiveChip
                          ? "border-transparent bg-[linear-gradient(135deg,#1f6a55,#193834)] text-white shadow-[0_18px_45px_rgba(25,56,52,0.22)]"
                          : "border-[rgba(25,56,52,0.12)] bg-white/[0.78] text-[var(--foreground)] hover:border-emerald-500/25 hover:bg-white dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]",
                      )}
                    >
                      {item.label} ({categoryCounts[item.value] || 0})
                    </button>
                  );
                })}
              </div>

              <div className={cn("grid gap-3", showBanReasonFilter ? "lg:grid-cols-[240px_auto]" : "lg:grid-cols-[auto]")}>
                {showBanReasonFilter ? (
                  <Select
                    value={banReasonFilter}
                    onValueChange={(value) => {
                      setBanReasonFilter(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className={selectTriggerClassName}>
                      <SelectValue placeholder="Filter by ban reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {banReasonOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}

                {hasFilters ? (
                  <div className="flex justify-start lg:justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleResetFilters}
                      className="h-12 rounded-full border border-[rgba(25,56,52,0.12)] bg-white/[0.74] px-5 text-[var(--foreground)] hover:bg-white dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]"
                    >
                      Reset Filters
                    </Button>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {isLoading ? <LoadingState /> : null}
          {!isLoading && fetchError ? <ErrorState onRetry={refetch} /> : null}
          {!isLoading && !fetchError && totalFiltered === 0 ? (
            <EmptyState categoryLabel={categoryMeta.label} hasFilters={hasFilters} onReset={handleResetFilters} />
          ) : null}

          {!isLoading && !fetchError && totalFiltered > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-3 lg:hidden">
                {paginatedUsers.map((user) => (
                  <UserManagementCard
                    key={`${user.id}-${user.banRecordId || "base"}`}
                    user={user}
                    onViewDetails={() => setSelectedUser(user)}
                    onRestrict={() =>
                      setBanModalData({
                        userId: user.userId || user.id,
                        userName: user.name,
                        userEmail: user.email,
                      })
                    }
                    onReinstate={() =>
                      setUnbanModalData({
                        banRecordId: user.banRecordId,
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
                        Member Directory
                      </CardTitle>
                      <CardDescription className="text-sm text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                        Unified directory for verified members, pending requests, moderators, contributors, and restricted users.
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
                            User
                          </th>
                          <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                            Email
                          </th>
                          <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                            Role
                          </th>
                          <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                            Verification
                          </th>
                          <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                            Status
                          </th>
                          <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                            Karma
                          </th>
                          <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                            Joined
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedUsers.map((user) => {
                          const roleLabel = getRoleLabel(user);
                          const verification = getVerificationMeta(user.verificationStatus);
                          const accountStatus = getAccountStatusMeta(user.accountStatus);
                          const restricted = isBannedUser(user);
                          const banReason = restricted ? getBanReasonMeta(user) : null;

                          return (
                            <tr
                              key={`${user.id}-${user.banRecordId || "base"}`}
                              className="border-b border-[rgba(25,56,52,0.08)] transition-colors hover:bg-[rgba(25,56,52,0.03)] dark:border-white/[0.06] dark:hover:bg-white/[0.03]"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-start gap-3">
                                  <UserAvatar user={user} />
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold text-[var(--foreground)] dark:text-white">
                                      {user.name || "Unknown user"}
                                    </div>
                                    <div className="mt-1 flex flex-wrap gap-2">
                                      {isAdmin(user) ? (
                                        <AdminStatusBadge
                                          label="Admin"
                                          className="border-violet-500/30 bg-violet-500/[0.12] text-violet-700 dark:text-violet-300"
                                        />
                                      ) : null}
                                      {isContributor(user) ? (
                                        <AdminStatusBadge
                                          label="Contributor"
                                          className="border-teal-500/30 bg-teal-500/[0.12] text-teal-700 dark:text-teal-300"
                                        />
                                      ) : (
                                        <AdminStatusBadge
                                          label="Regular"
                                          className="border-slate-500/20 bg-slate-500/[0.1] text-slate-700 dark:text-slate-300"
                                        />
                                      )}
                                      {banReason ? <AdminStatusBadge label={banReason.label} className={banReason.tone} /> : null}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="text-sm font-semibold text-[var(--foreground)] dark:text-white">
                                  {user.email || emptyValue}
                                </div>
                                {restricted ? (
                                  <div className="mt-1 text-xs text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                                    {user.bannedBy ? `By ${user.bannedBy}` : "Restricted account"}
                                  </div>
                                ) : null}
                              </td>
                              <td className="px-4 py-4 align-top">
                                <AdminStatusBadge label={roleLabel} className={getRoleTone(roleLabel)} />
                              </td>
                              <td className="px-4 py-4 align-top">
                                <AdminStatusBadge label={verification.label} className={verification.tone} />
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="space-y-2">
                                  <AdminStatusBadge label={accountStatus.label} className={accountStatus.tone} />
                                  {restricted && user.banDate ? (
                                    <div className="text-xs text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                                      {formatDate(user.banDate)}
                                    </div>
                                  ) : null}
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="text-sm font-semibold text-[var(--foreground)] dark:text-white">
                                  {user.karma ?? 0}
                                </div>
                                <div className="mt-1 text-xs text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                                  {user.totalUpdates ?? 0} contributions
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="text-sm font-semibold text-[var(--foreground)] dark:text-white">
                                  {formatDate(user.joinDate)}
                                </div>
                                <div className="mt-1 text-xs text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                                  Accuracy {formatPercent(user.accuracyRate)}
                                </div>
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
                                    Manage
                                  </Button>
                                  {restricted ? (
                                    <Button
                                      type="button"
                                      onClick={() =>
                                        setUnbanModalData({
                                          banRecordId: user.banRecordId,
                                          userName: user.name,
                                          userEmail: user.email,
                                        })
                                      }
                                      disabled={!user.banRecordId}
                                      className="h-10 rounded-full bg-[linear-gradient(135deg,#1f6a55,#193834)] px-4 text-white shadow-[0_18px_45px_rgba(25,56,52,0.22)] hover:opacity-95 disabled:opacity-60"
                                    >
                                      <CheckCircle2 className="h-4 w-4" strokeWidth={2.1} />
                                      Reactivate
                                    </Button>
                                  ) : (
                                    <Button
                                      type="button"
                                      onClick={() =>
                                        setBanModalData({
                                          userId: user.userId || user.id,
                                          userName: user.name,
                                          userEmail: user.email,
                                        })
                                      }
                                      className="h-10 rounded-full bg-[linear-gradient(135deg,#be123c,#dc2626)] px-4 text-white shadow-[0_18px_45px_rgba(159,18,57,0.2)] hover:opacity-95"
                                    >
                                      <Ban className="h-4 w-4" strokeWidth={2.1} />
                                      Ban User
                                    </Button>
                                  )}
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

      <Dialog
        open={Boolean(banModalData)}
        onOpenChange={(open) => {
          if (!open) {
            setBanModalData(null);
            setBanReason("");
            setBanNotes("");
          }
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[28px] border-[rgba(190,24,93,0.25)] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(255,243,245,0.97))] p-0 shadow-[0_32px_80px_rgba(24,10,14,0.22)] dark:border-rose-500/20 dark:bg-[linear-gradient(180deg,rgba(54,16,28,0.94),rgba(14,8,10,0.98))] sm:max-w-xl">
          <DialogHeader className="border-b border-rose-500/15 px-6 pb-5 pt-6 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/[0.12] text-rose-700 dark:text-rose-300">
                <Ban className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
                  Ban User
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-[var(--app-text-muted)] dark:text-rose-100/70">
                  Confirm the ban reason before restricting account access.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 px-6 py-6">
            <div className="rounded-[22px] border border-rose-500/15 bg-white/[0.74] p-4 dark:bg-white/[0.03]">
              <div className="text-sm font-semibold text-[var(--foreground)] dark:text-white">
                {banModalData?.userName || "Unknown user"}
              </div>
              <div className="mt-1 text-sm text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                {banModalData?.userEmail || "No email on file"}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--foreground)] dark:text-white">
                Ban Reason
              </label>
              <Select value={banReason} onValueChange={setBanReason}>
                <SelectTrigger className={cn(selectTriggerClassName, "border-rose-500/20 focus-visible:border-rose-500/40")}>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(reasonLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--foreground)] dark:text-white">
                Admin Notes
              </label>
              <Textarea
                value={banNotes}
                onChange={(event) => setBanNotes(event.target.value)}
                placeholder="Add internal context for this moderation action"
                rows={4}
                className="rounded-[20px] border-rose-500/15 bg-white/[0.84] px-4 py-3 text-sm focus-visible:border-rose-500/40 focus-visible:ring-rose-500/20 dark:bg-white/[0.04]"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-rose-500/15 px-6 py-5 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setBanModalData(null);
                setBanReason("");
                setBanNotes("");
              }}
              className="h-11 rounded-full border-[rgba(25,56,52,0.12)] bg-white/[0.8] px-5 text-[var(--foreground)] hover:bg-white dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleBanUser}
              disabled={!banReason || isSubmittingBan}
              className="h-11 rounded-full bg-[linear-gradient(135deg,#be123c,#dc2626)] px-5 text-white shadow-[0_18px_45px_rgba(159,18,57,0.22)] hover:opacity-95"
            >
              {isSubmittingBan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
              Ban User
            </Button>
          </DialogFooter>
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
                <CheckCircle2 className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
                  Reactivate User
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
              disabled={isSubmittingUnban || !unbanModalData?.banRecordId}
              className="h-11 rounded-full bg-[linear-gradient(135deg,#1f6a55,#193834)] px-5 text-white shadow-[0_18px_45px_rgba(25,56,52,0.22)] hover:opacity-95"
            >
              {isSubmittingUnban ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Reactivate User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedUser)} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-[28px] border-[rgba(25,56,52,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(238,244,240,0.97))] p-0 shadow-[0_32px_80px_rgba(16,33,30,0.18)] dark:border-white/[0.08] dark:bg-[linear-gradient(180deg,rgba(25,56,52,0.95),rgba(8,18,16,0.99))] sm:max-w-3xl">
          {selectedUser ? (
            <>
              <DialogHeader className="border-b border-[rgba(25,56,52,0.08)] px-6 pb-5 pt-6 text-left dark:border-white/[0.06]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <UserAvatar user={selectedUser} className="h-14 w-14 rounded-[20px] text-base" />
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
                          label={getRoleLabel(selectedUser)}
                          className={getRoleTone(getRoleLabel(selectedUser))}
                        />
                        <AdminStatusBadge
                          label={getVerificationMeta(selectedUser.verificationStatus).label}
                          className={getVerificationMeta(selectedUser.verificationStatus).tone}
                        />
                        <AdminStatusBadge
                          label={getAccountStatusMeta(selectedUser.accountStatus).label}
                          className={getAccountStatusMeta(selectedUser.accountStatus).tone}
                        />
                        {isContributor(selectedUser) ? (
                          <AdminStatusBadge
                            label="Contributor"
                            className="border-teal-500/30 bg-teal-500/[0.12] text-teal-700 dark:text-teal-300"
                          />
                        ) : (
                          <AdminStatusBadge
                            label="Regular"
                            className="border-slate-500/20 bg-slate-500/[0.1] text-slate-700 dark:text-slate-300"
                          />
                        )}
                        {isBannedUser(selectedUser) ? (
                          <AdminStatusBadge
                            label={getBanReasonMeta(selectedUser).label}
                            className={getBanReasonMeta(selectedUser).tone}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>

                </div>
              </DialogHeader>

              <div className="space-y-6 px-6 py-6">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <SectionField label="Karma Score" value={selectedUser.karma ?? 0} />
                  <SectionField label="Contributions" value={selectedUser.totalUpdates ?? 0} />
                  <SectionField label="Accuracy" value={formatPercent(selectedUser.accuracyRate)} />
                  <SectionField label="Joined" value={formatDate(selectedUser.joinDate)} />
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <SectionField label="Account Status" value={getAccountStatusMeta(selectedUser.accountStatus).label} />
                  <SectionField label="Verification" value={getVerificationMeta(selectedUser.verificationStatus).label} />
                  <SectionField label="Role" value={getRoleLabel(selectedUser)} />
                  <SectionField label="Category" value={isContributor(selectedUser) ? "Contributor" : "Regular User"} />
                  <SectionField label="Saved Stations" value={selectedUser.savedStationsCount ?? emptyValue} />
                  <SectionField label="Recent Activity" value={selectedUser.recentActivity || emptyValue} />
                </div>

                {isBannedUser(selectedUser) ? (
                  <div className="grid gap-3 lg:grid-cols-2">
                    <SectionField label="Ban Reason" value={getBanReasonMeta(selectedUser).label} />
                    <SectionField label="Banned By" value={selectedUser.bannedBy || emptyValue} />
                    <SectionField label="Date Banned" value={formatDateTime(selectedUser.banDate)} />
                    <SectionField label="Moderation Notes" value={selectedUser.notes || selectedUser.adminNotes || emptyValue} />
                  </div>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-2">
                    <SectionField
                      label="Joined At"
                      value={
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                          <span>{formatDateTime(selectedUser.joinDate)}</span>
                        </div>
                      }
                    />
                    <SectionField label="Moderation Notes" value={selectedUser.adminNotes || emptyValue} />
                  </div>
                )}

                <Card className={innerSurfaceClass}>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedUser(null)}
                        className="h-11 flex-1 rounded-full border-emerald-500/[0.18] bg-white/[0.72] text-[var(--foreground)] hover:border-emerald-500/[0.28] hover:bg-white dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]"
                      >
                        <UserRound className="h-4 w-4" />
                        Done Reviewing
                      </Button>
                      {isBannedUser(selectedUser) ? (
                        <Button
                          type="button"
                          onClick={() => {
                            setSelectedUser(null);
                            setUnbanModalData({
                              banRecordId: selectedUser.banRecordId,
                              userName: selectedUser.name,
                              userEmail: selectedUser.email,
                            });
                          }}
                          disabled={!selectedUser.banRecordId}
                          className="h-11 flex-1 rounded-full bg-[linear-gradient(135deg,#1f6a55,#193834)] text-white shadow-[0_18px_45px_rgba(25,56,52,0.22)] hover:opacity-95 disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Reactivate User
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => {
                            setSelectedUser(null);
                            setBanModalData({
                              userId: selectedUser.userId || selectedUser.id,
                              userName: selectedUser.name,
                              userEmail: selectedUser.email,
                            });
                          }}
                          className="h-11 flex-1 rounded-full bg-[linear-gradient(135deg,#be123c,#dc2626)] text-white shadow-[0_18px_45px_rgba(159,18,57,0.22)] hover:opacity-95"
                        >
                          <Ban className="h-4 w-4" />
                          Ban User
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
