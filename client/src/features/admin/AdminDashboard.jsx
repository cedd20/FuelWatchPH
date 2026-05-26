import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertCircle,
  ArrowRight,
  Ban,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  FileClock,
  Fuel,
  LayoutDashboard,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
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

const emptyStats = {
  totalRequests: 0,
  pendingRequests: 0,
  approvedRequests: 0,
  rejectedRequests: 0,
  totalReports: 0,
  openReports: 0,
  activeUsers: 0,
  bannedUsers: 0,
  verifiedToday: 0,
  reportsLoggedToday: 0,
};

const statusStyles = {
  pending: "border-amber-500/30 bg-amber-500/[0.12] text-amber-700 dark:text-amber-300",
  approved: "border-emerald-500/30 bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-300",
  rejected: "border-rose-500/30 bg-rose-500/[0.12] text-rose-700 dark:text-rose-300",
  under_review: "border-sky-500/30 bg-sky-500/[0.12] text-sky-700 dark:text-sky-300",
  resolved: "border-emerald-500/30 bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-300",
  banned: "border-rose-500/30 bg-rose-500/[0.12] text-rose-700 dark:text-rose-300",
};

const statToneStyles = {
  neutral: {
    card:
      "border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(237,243,239,0.96))] shadow-[0_18px_45px_rgba(16,33,30,0.08)] dark:border-white/[0.08] dark:bg-[linear-gradient(180deg,rgba(25,56,52,0.94),rgba(9,22,20,0.98))] dark:shadow-[0_22px_55px_rgba(0,0,0,0.35)]",
    icon: "bg-[rgba(25,56,52,0.08)] text-[var(--primary)] dark:bg-emerald-500/[0.14] dark:text-emerald-300",
    accent: "bg-emerald-500/75",
  },
  warning: {
    card:
      "border-amber-500/25 bg-[linear-gradient(180deg,rgba(255,251,235,0.98),rgba(255,247,214,0.96))] shadow-[0_18px_45px_rgba(120,53,15,0.08)] dark:border-amber-500/20 dark:bg-[linear-gradient(180deg,rgba(69,41,8,0.5),rgba(26,18,8,0.98))] dark:shadow-[0_22px_55px_rgba(0,0,0,0.28)]",
    icon: "bg-amber-500/[0.14] text-amber-700 dark:bg-amber-500/[0.18] dark:text-amber-300",
    accent: "bg-amber-400/80",
  },
  success: {
    card:
      "border-emerald-500/[0.24] bg-[linear-gradient(180deg,rgba(236,253,245,0.98),rgba(221,247,237,0.96))] shadow-[0_18px_45px_rgba(6,95,70,0.08)] dark:border-emerald-500/20 dark:bg-[linear-gradient(180deg,rgba(15,68,52,0.62),rgba(9,25,20,0.98))] dark:shadow-[0_22px_55px_rgba(0,0,0,0.28)]",
    icon: "bg-emerald-500/[0.14] text-emerald-700 dark:bg-emerald-500/[0.18] dark:text-emerald-300",
    accent: "bg-emerald-400/80",
  },
  danger: {
    card:
      "border-rose-500/[0.24] bg-[linear-gradient(180deg,rgba(255,241,242,0.98),rgba(255,228,230,0.96))] shadow-[0_18px_45px_rgba(159,18,57,0.08)] dark:border-rose-500/[0.18] dark:bg-[linear-gradient(180deg,rgba(84,20,35,0.52),rgba(24,10,14,0.98))] dark:shadow-[0_22px_55px_rgba(0,0,0,0.28)]",
    icon: "bg-rose-500/[0.14] text-rose-700 dark:bg-rose-500/[0.18] dark:text-rose-300",
    accent: "bg-rose-400/80",
  },
  info: {
    card:
      "border-sky-500/[0.24] bg-[linear-gradient(180deg,rgba(239,246,255,0.98),rgba(224,242,254,0.96))] shadow-[0_18px_45px_rgba(3,105,161,0.08)] dark:border-sky-500/[0.18] dark:bg-[linear-gradient(180deg,rgba(16,58,74,0.52),rgba(8,18,24,0.98))] dark:shadow-[0_22px_55px_rgba(0,0,0,0.28)]",
    icon: "bg-sky-500/[0.14] text-sky-700 dark:bg-sky-500/[0.18] dark:text-sky-300",
    accent: "bg-sky-400/80",
  },
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
};

const formatStatusLabel = (status) => {
  if (!status) return "Pending";
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

function AdminStatusBadge({ status }) {
  return (
    <Badge
      className={cn(
        "rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase backdrop-blur-sm",
        statusStyles[status] || statusStyles.pending,
      )}
    >
      {formatStatusLabel(status)}
    </Badge>
  );
}

function AdminSectionCard({
  icon: Icon,
  title,
  action,
  children,
  contentClassName,
}) {
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
      <CardContent className={cn("px-4 pt-3 sm:px-6 sm:pt-6", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

function AdminStatCard({ icon: Icon, label, value, tone = "neutral" }) {
  const palette = statToneStyles[tone] || statToneStyles.neutral;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-[26px] border transition-transform duration-200 hover:-translate-y-0.5",
        palette.card,
      )}
    >
      <div className={cn("absolute inset-x-5 top-0 h-px rounded-full", palette.accent)} />
      <CardContent className="p-3.5 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5 sm:space-y-2">
            <div className="text-2xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white sm:text-4xl">
              {value}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)] dark:text-emerald-100/70 sm:text-[11px] sm:tracking-[0.22em]">
              {label}
            </div>
          </div>
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] sm:h-[3.25rem] sm:w-[3.25rem]", palette.icon)}>
            <Icon className="h-4.5 w-4.5 sm:h-6 sm:w-6" strokeWidth={2.2} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminRecordItem({ title, subtitle, meta, status, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-[22px] border border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(244,247,245,0.92),rgba(255,255,255,0.98))] p-4 text-left shadow-[0_14px_35px_rgba(16,33,30,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/25 hover:shadow-[0_18px_45px_rgba(16,33,30,0.12)] dark:border-white/[0.07] dark:bg-[linear-gradient(180deg,rgba(16,33,30,0.94),rgba(12,26,23,0.98))] dark:shadow-[0_18px_45px_rgba(0,0,0,0.24)] dark:hover:border-emerald-400/20 dark:hover:bg-[linear-gradient(180deg,rgba(20,41,37,0.98),rgba(13,28,25,1))]"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
                {title}
              </div>
              {subtitle ? (
                <div className="mt-1 text-sm text-[var(--app-text-soft)] dark:text-[var(--app-text-soft)]">
                  {subtitle}
                </div>
              ) : null}
            </div>
          </div>
          {meta ? (
            <div className="text-xs font-medium tracking-wide text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
              {meta}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <AdminStatusBadge status={status} />
          <ChevronRight className="h-4 w-4 text-[var(--app-text-muted)] transition-transform duration-200 group-hover:translate-x-0.5 dark:text-emerald-100/45" />
        </div>
      </div>

      {children ? <div className="mt-3">{children}</div> : null}
    </button>
  );
}

function AdminActionButton({ icon: Icon, title, description, onClick, tone = "secondary" }) {
  const isPrimary = tone === "primary";
  const isDanger = tone === "danger";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-start gap-3 rounded-[22px] border p-4 text-left transition-all duration-200 hover:-translate-y-0.5",
        isPrimary &&
        "border-emerald-500/30 bg-[linear-gradient(135deg,#1f6a55,#193834)] text-white shadow-[0_18px_45px_rgba(25,56,52,0.22)] hover:shadow-[0_24px_55px_rgba(25,56,52,0.28)]",
        !isPrimary &&
        !isDanger &&
        "border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,246,243,0.96))] text-[var(--foreground)] shadow-[0_14px_35px_rgba(16,33,30,0.06)] hover:border-emerald-500/[0.24] hover:shadow-[0_18px_45px_rgba(16,33,30,0.12)] dark:border-white/[0.07] dark:bg-[linear-gradient(180deg,rgba(16,33,30,0.95),rgba(12,26,23,0.98))] dark:text-white dark:hover:border-emerald-400/20",
        isDanger &&
        "border-rose-500/20 bg-[linear-gradient(180deg,rgba(255,241,242,0.96),rgba(255,228,230,0.92))] text-rose-900 shadow-[0_14px_35px_rgba(159,18,57,0.08)] hover:shadow-[0_18px_45px_rgba(159,18,57,0.12)] dark:bg-[linear-gradient(180deg,rgba(84,20,35,0.5),rgba(24,10,14,0.98))] dark:text-rose-100",
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
          isPrimary && "border-white/[0.12] bg-white/[0.12]",
          !isPrimary && !isDanger && "border-emerald-500/[0.12] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
          isDanger && "border-rose-500/[0.15] bg-rose-500/10 text-rose-700 dark:text-rose-300",
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={2.15} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold tracking-tight">{title}</div>
          <ArrowRight
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5",
              isPrimary ? "text-white/70" : "text-[var(--app-text-muted)] dark:text-emerald-100/[0.45]",
            )}
          />
        </div>
        <div
          className={cn(
            "mt-1 text-xs leading-5",
            isPrimary ? "text-white/[0.74]" : "text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]",
          )}
        >
          {description}
        </div>
      </div>
    </button>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-[rgba(25,56,52,0.18)] bg-[rgba(230,240,236,0.52)] px-5 py-8 text-center dark:border-white/10 dark:bg-white/[0.025] sm:px-6 sm:py-10">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
        <Icon className="h-6 w-6" strokeWidth={2.1} />
      </div>
      <div className="mt-4 text-base font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
        {title}
      </div>
      <div className="mt-2 max-w-sm text-sm leading-6 text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
        {description}
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      setIsLoading(true);
      try {
        const data = await apiClient.get("/admin/dashboard");
        setDashboard(data || null);
      } catch (error) {
        console.error("Failed to fetch admin dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  const stats = dashboard?.stats || emptyStats;
  const recentVerifications = dashboard?.recentVerifications || [];
  const recentReports = dashboard?.recentReports || [];
  const recentActivity = dashboard?.recentActivity || [];

  const statCards = [
    {
      label: "Total Verification Requests",
      value: stats.totalRequests,
      icon: ShieldCheck,
      tone: "neutral",
    },
    {
      label: "Pending Verifications",
      value: stats.pendingRequests,
      icon: Clock3,
      tone: "warning",
    },
    {
      label: "Approved Requests",
      value: stats.approvedRequests,
      icon: CheckCircle2,
      tone: "success",
    },
    {
      label: "Rejected Requests",
      value: stats.rejectedRequests,
      icon: XCircle,
      tone: "danger",
    },
    {
      label: "Active Fuel Reports",
      value: stats.totalReports,
      icon: Fuel,
      tone: "info",
    },
    {
      label: "Open Fuel Reports",
      value: stats.openReports,
      icon: AlertCircle,
      tone: "warning",
    },
    {
      label: "Active Users",
      value: stats.activeUsers,
      icon: Users,
      tone: "neutral",
    },
    {
      label: "Banned Users",
      value: stats.bannedUsers,
      icon: Ban,
      tone: "danger",
    },
  ];

  if (isLoading && !dashboard) {
    return (
      <div className="relative overflow-hidden px-4 py-6 lg:px-8 lg:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(25,56,52,0.18),transparent_38%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(25,56,52,0.28),transparent_40%)]" />
        <div className="relative mx-auto flex min-h-[58vh] max-w-[1600px] items-center justify-center">
          <div className="flex items-center gap-3 rounded-full border border-emerald-500/[0.15] bg-[rgba(255,255,255,0.78)] px-6 py-3 text-sm font-medium text-[var(--app-text-soft)] shadow-[0_18px_40px_rgba(16,33,30,0.08)] backdrop-blur-xl dark:bg-[rgba(16,33,30,0.82)] dark:text-emerald-50 dark:shadow-[0_20px_55px_rgba(0,0,0,0.36)]">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-300" />
            Loading admin dashboard
          </div>
        </div>
      </div>
    );
  }

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
                  Dashboard Overview
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white lg:text-4xl">
                    FuelWatch PH
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-[var(--app-text-soft)] dark:text-[var(--app-text-soft)] sm:text-base">
                    Review the latest verification flow, fuel activity, and moderation health from a dashboard.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:min-w-[360px]">
                <div className="rounded-[24px] border border-emerald-500/[0.16] bg-white/[0.72] p-3.5 shadow-[0_14px_35px_rgba(16,33,30,0.06)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.04] sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-300">
                      <TrendingUp className="h-5 w-5" strokeWidth={2.15} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--app-text-muted)] dark:text-emerald-100/70">
                        Today
                      </div>
                      <div className="mt-1 text-sm font-medium text-[var(--app-text-soft)] dark:text-[var(--app-text-soft)]">
                        {stats.verifiedToday} verifications completed
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-[24px] border border-emerald-500/[0.16] bg-white/[0.72] p-3.5 shadow-[0_14px_35px_rgba(16,33,30,0.06)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.04] sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-300">
                      <LayoutDashboard className="h-5 w-5" strokeWidth={2.15} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--app-text-muted)] dark:text-emerald-100/70">
                        Queue
                      </div>
                      <div className="mt-1 text-sm font-medium text-[var(--app-text-soft)] dark:text-[var(--app-text-soft)]">
                        {stats.openReports} reports and {stats.pendingRequests} requests need attention
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
          {statCards.map((card) => (
            <AdminStatCard key={card.label} {...card} />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)] xl:gap-8">
          <div className="space-y-4 sm:space-y-6">
            <AdminSectionCard
              icon={ShieldCheck}
              title="Verification Queue"
              action={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open verification queue"
                  title="Open verification queue"
                  className="h-9 w-9 rounded-full border border-emerald-500/[0.15] bg-emerald-500/[0.08] text-emerald-800 hover:bg-emerald-500/[0.12] dark:text-emerald-200 dark:hover:bg-emerald-500/[0.14]"
                  onClick={() => navigate("/admin/verification-queue")}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              }
            >
              {recentVerifications.length === 0 ? (
                <EmptyState
                  icon={FileClock}
                  title="No verification requests yet"
                  description="New verification submissions will appear here as soon as users begin sending them in."
                />
              ) : (
                <div className="space-y-2.5 sm:space-y-3">
                  {recentVerifications.map((request) => (
                    <AdminRecordItem
                      key={request.id}
                      title={request.userName}
                      subtitle={request.idType}
                      meta={`Submitted ${formatDateTime(request.submissionDate)}`}
                      status={request.status}
                      onClick={() => navigate(`/admin/verification/${request.id}`)}
                    />
                  ))}
                </div>
              )}
            </AdminSectionCard>

            <AdminSectionCard
              icon={MapPin}
              title="Fuel Activity"
              action={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open fuel reports"
                  title="Open fuel reports"
                  className="h-9 w-9 rounded-full border border-emerald-500/[0.15] bg-emerald-500/[0.08] text-emerald-800 hover:bg-emerald-500/[0.12] dark:text-emerald-200 dark:hover:bg-emerald-500/[0.14]"
                  onClick={() => navigate("/admin/fuel-reports")}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              }
            >
              {recentReports.length === 0 ? (
                <EmptyState
                  icon={Fuel}
                  title="No fuel reports yet"
                  description="Once reports are submitted, this section will help your team triage the newest entries quickly."
                />
              ) : (
                <div className="space-y-2.5 sm:space-y-3">
                  {recentReports.map((report) => (
                    <AdminRecordItem
                      key={report.id}
                      title={report.stationName}
                      subtitle={report.reportType}
                      meta={`Reported by ${report.reportedBy} on ${formatDate(report.submissionDate)}`}
                      status={report.status}
                      onClick={() => navigate("/admin/fuel-reports")}
                    >
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                        <div className="rounded-[18px] border border-[rgba(25,56,52,0.12)] bg-white/[0.78] p-2.5 dark:border-white/[0.07] dark:bg-white/[0.03] sm:p-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                            Reported Price
                          </div>
                          <div className="mt-2 text-sm font-semibold text-[var(--foreground)] dark:text-white">
                            {report.priceLabel || "Pending review"}
                          </div>
                        </div>
                        <div className="rounded-[18px] border border-[rgba(25,56,52,0.12)] bg-white/[0.78] p-2.5 dark:border-white/[0.07] dark:bg-white/[0.03] sm:p-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                            Confirmations
                          </div>
                          <div className="mt-2 text-sm font-semibold text-[var(--foreground)] dark:text-white">
                            {report.confirmationCount ?? 0}
                          </div>
                        </div>
                      </div>
                    </AdminRecordItem>
                  ))}
                </div>
              )}
            </AdminSectionCard>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <AdminSectionCard
              icon={TrendingUp}
              title="Quick Actions"
              contentClassName="pt-3.5 sm:pt-6"
            >
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-1">
                <AdminActionButton
                  icon={ShieldCheck}
                  title="Review Pending Verifications"
                  description="Open the queue and process identity requests."
                  tone="primary"
                  onClick={() => navigate("/admin/verification-queue")}
                />
                <AdminActionButton
                  icon={Fuel}
                  title="Review Fuel Reports"
                  description="Inspect pricing submissions from contributors."
                  onClick={() => navigate("/admin/fuel-reports")}
                />
                <AdminActionButton
                  icon={MapPin}
                  title="Review Station Reports"
                  description="Check station-specific issues and moderation notes."
                  onClick={() => navigate("/admin/station-reports")}
                />
                <AdminActionButton
                  icon={Users}
                  title="View User Management"
                  description="Manage contributor access and account status."
                  onClick={() => navigate("/admin/user-management")}
                />
                <AdminActionButton
                  icon={Ban}
                  title="Review Banned Users"
                  description="Open User Management with restricted accounts pre-filtered."
                  tone="danger"
                  onClick={() => navigate("/admin/user-management?category=banned")}
                />
              </div>
            </AdminSectionCard>

            <AdminSectionCard
              icon={Sparkles}
              title="Today’s Summary"
            >
              <div className="space-y-2.5 sm:space-y-3">
                <div className="rounded-[22px] border border-emerald-500/[0.18] bg-[linear-gradient(180deg,rgba(236,253,245,0.9),rgba(221,247,237,0.82))] p-3.5 shadow-[0_14px_35px_rgba(6,95,70,0.08)] dark:border-emerald-500/[0.18] dark:bg-[linear-gradient(180deg,rgba(15,68,52,0.4),rgba(9,25,20,0.92))] sm:p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                        Verifications Completed
                      </div>
                      <div className="mt-2 text-3xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
                        {stats.verifiedToday}
                      </div>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/[0.14] text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-5 w-5" strokeWidth={2.1} />
                    </div>
                  </div>
                </div>
                <div className="rounded-[22px] border border-sky-500/[0.18] bg-[linear-gradient(180deg,rgba(239,246,255,0.9),rgba(224,242,254,0.82))] p-3.5 shadow-[0_14px_35px_rgba(3,105,161,0.08)] dark:border-sky-500/[0.18] dark:bg-[linear-gradient(180deg,rgba(16,58,74,0.4),rgba(8,18,24,0.92))] sm:p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--app-text-muted)] dark:text-emerald-100/65">
                        Reports Logged Today
                      </div>
                      <div className="mt-2 text-3xl font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
                        {stats.reportsLoggedToday}
                      </div>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/[0.14] text-sky-700 dark:text-sky-300">
                      <TrendingUp className="h-5 w-5" strokeWidth={2.1} />
                    </div>
                  </div>
                </div>
              </div>
            </AdminSectionCard>

            <AdminSectionCard
              icon={Clock3}
              title="Recent Activity"
              action={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open activity log"
                  title="Open activity log"
                  className="h-9 w-9 rounded-full border border-emerald-500/[0.15] bg-emerald-500/[0.08] text-emerald-800 hover:bg-emerald-500/[0.12] dark:text-emerald-200 dark:hover:bg-emerald-500/[0.14]"
                  onClick={() => navigate("/admin/activity-log")}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              }
            >
              {recentActivity.length === 0 ? (
                <EmptyState
                  icon={Clock3}
                  title="No recent activity yet"
                  description="Admin actions will start appearing here once verification and moderation work begins."
                />
              ) : (
                <div className="space-y-2.5 sm:space-y-3">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="rounded-[22px] border border-[rgba(25,56,52,0.12)] bg-[linear-gradient(180deg,rgba(244,247,245,0.92),rgba(255,255,255,0.98))] p-3.5 shadow-[0_14px_35px_rgba(16,33,30,0.05)] dark:border-white/[0.07] dark:bg-[linear-gradient(180deg,rgba(16,33,30,0.94),rgba(12,26,23,0.98))] sm:p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold tracking-tight text-[var(--foreground)] dark:text-white">
                            {activity.action}
                          </div>
                          <div className="mt-1 text-sm text-[var(--app-text-soft)] dark:text-[var(--app-text-soft)]">
                            {activity.target}
                          </div>
                          <div className="mt-2 text-xs font-medium tracking-wide text-[var(--app-text-muted)] dark:text-[var(--app-text-muted)]">
                            {formatDateTime(activity.timestamp)}
                          </div>
                        </div>
                        <AdminStatusBadge status={activity.type} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AdminSectionCard>
          </div>
        </section>
      </div>
    </div>
  );
}
