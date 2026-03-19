"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";
import { useOrganization } from "@/lib/organizations/useOrganization";
import { usePlan } from "@/lib/plans/usePlan";
import { getMyConferenceIds } from "@/lib/conference/getMyConferenceIds";
import { formatLimit, PLAN_LABELS, type PlanType } from "@/lib/config/pricing";
import UpgradeModal from "@/components/upgrade/UpgradeModal";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Calendar,
  FileText,
  Users,
  CreditCard,
  Plus,
  Building2,
  Zap,
  CheckCircle,
  XCircle,
  ArrowRight,
  Monitor,
  ClipboardList,
  UserCheck,
  IndianRupee,
  BarChart3,
  CalendarClock,
  Layers,
  Sparkles,
  Crown,
} from "lucide-react";

import Link from "next/link";

const supabase = createClient();

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function OrganizerDashboard() {
  const { profile } = useProfile();
  const { organization } = useOrganization();
  const plan = usePlan();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [stats, setStats] = useState({
    conferences: 0,
    activeConferences: 0,
    submissions: 0,
    reviewers: 0,
    revenue: 0,
    openSubmissions: 0,
    closedSubmissions: 0,
  });

  const [scheduleStats, setScheduleStats] = useState({
    totalDays: 0,
    totalTracks: 0,
    totalSessions: 0,
  });

  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    async function load() {
      if (!profile) return;
      setLoading(true);

      const today = new Date().toISOString().split("T")[0];

      /* ---- Conferences ---- */
      const myIds = await getMyConferenceIds(profile.id, organization?.id);

      if (myIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: conferences, error } = await supabase
        .from("conferences")
        .select("*")
        .in("id", myIds)
        .order("created_at", { ascending: false });

      const allConfs = conferences || [];
      const conferenceIds = allConfs.map((c) => c.id);

      /* Active conferences (published + not ended) */
      const activeConferences = allConfs.filter(
        (c) => c.is_published && c.end_date >= today
      ).length;

      /* Submission status overview */
      let openSubmissions = 0;
      let closedSubmissions = 0;
      for (const c of allConfs) {
        if (c.submission_deadline) {
          if (c.submission_deadline >= today) openSubmissions++;
          else closedSubmissions++;
        }
      }

      /* ---- Submissions count ---- */
      let submissions = 0;
      if (conferenceIds.length > 0) {
        const { count } = await supabase
          .from("paper_submissions")
          .select("*", { count: "exact", head: true })
          .in("conference_id", conferenceIds);
        submissions = count || 0;
      }

      /* ---- Reviewer count ---- */
      let reviewerCount = 0;
      if (conferenceIds.length > 0) {
        const { data } = await supabase
          .from("conference_staff")
          .select("user_id")
          .in("conference_id", conferenceIds)
          .eq("role", "reviewer");
        reviewerCount = new Set(data?.map((r) => r.user_id)).size;
      }

      /* ---- Revenue ---- */
      let revenue = 0;

      if (conferenceIds.length > 0) {
        /* Registration payments */
        const { data: regPayments } = await supabase
          .from("conference_registrations")
          .select("amount, payment_status")
          .in("conference_id", conferenceIds)
          .eq("payment_status", "success");

        if (regPayments) {
          revenue += regPayments.reduce(
            (sum, p) => sum + (p.amount || 0),
            0
          );
        }

        /* Paper fee payments */
        const { data: paperPayments } = await supabase
          .from("paper_submissions")
          .select("payment_conference_fee")
          .in("conference_id", conferenceIds)
          .eq("payment_status", "paid");

        if (paperPayments) {
          revenue += paperPayments.reduce(
            (sum, p) => sum + (Number(p.payment_conference_fee) || 0),
            0
          );
        }
      }

      /* ---- Schedule stats ---- */
      let totalDays = 0;
      let totalTracks = 0;
      let totalSessions = 0;

      if (conferenceIds.length > 0) {
        const { count: daysCount } = await supabase
          .from("conference_days")
          .select("*", { count: "exact", head: true })
          .in("conference_id", conferenceIds);
        totalDays = daysCount || 0;

        const { count: tracksCount } = await supabase
          .from("tracks")
          .select("*", { count: "exact", head: true })
          .in("conference_id", conferenceIds);
        totalTracks = tracksCount || 0;

        const { count: sessionsCount } = await supabase
          .from("sessions")
          .select("*", { count: "exact", head: true })
          .in("conference_id", conferenceIds);
        totalSessions = sessionsCount || 0;
      }

      setScheduleStats({ totalDays, totalTracks, totalSessions });

      setStats({
        conferences: allConfs.length,
        activeConferences,
        submissions,
        reviewers: reviewerCount,
        revenue,
        openSubmissions,
        closedSubmissions,
      });

      setRecent(allConfs.slice(0, 5));
      setLoading(false);
    }

    load();
  }, [profile, organization]);

  const today = new Date().toISOString().split("T")[0];

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-8 max-w-6xl">

      {/* ============================================================ */}
      {/*  Header                                                       */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Organizer Dashboard
          </h1>

          {organization ? (
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {organization.name}
            </p>
          ) : (
            <p className="text-amber-600 mt-1">
              No organization found
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {!organization && (
            <Button asChild variant="outline">
              <Link href="/dashboard/organizer/create">
                Create Organization
              </Link>
            </Button>
          )}

          <Button asChild>
            <Link href="/dashboard/organizer/conferences/new" className="gap-2">
              <Plus className="h-4 w-4" />
              New Conference
            </Link>
          </Button>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Plan & Usage Card                                            */}
      {/* ============================================================ */}
      {!plan.loading && (
        <Card className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${plan.planType === "free"
                ? "bg-gray-100"
                : plan.planType === "early_adopter"
                  ? "bg-indigo-100"
                  : "bg-purple-100"
                }`}>
                <Crown className={`h-5 w-5 ${plan.planType === "free"
                  ? "text-gray-500"
                  : plan.planType === "early_adopter"
                    ? "text-indigo-600"
                    : "text-purple-600"
                  }`} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">Current Plan</p>
                  <Badge className={`text-[11px] ${plan.planType === "free"
                    ? "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100"
                    : plan.planType === "early_adopter"
                      ? "bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                      : "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100"
                    }`}>
                    {PLAN_LABELS[plan.planType]}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-1">
                  {/* Conference usage */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      Conferences: {plan.conferencesUsed} / {formatLimit(plan.conferenceLimit)}
                    </span>
                    {plan.conferenceLimit !== null && (
                      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${plan.conferencesUsed >= plan.conferenceLimit
                            ? "bg-red-500"
                            : "bg-indigo-500"
                            }`}
                          style={{ width: `${Math.min(100, (plan.conferencesUsed / plan.conferenceLimit) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Submission usage – only shown for free plan */}
                  {plan.planType === "free" && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        Submissions: {plan.submissionsUsed} / {formatLimit(plan.submissionLimit)}
                      </span>
                      {plan.submissionLimit !== null && (
                        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${plan.submissionsUsed >= plan.submissionLimit
                              ? "bg-red-500"
                              : "bg-blue-500"
                              }`}
                            style={{ width: `${Math.min(100, (plan.submissionsUsed / plan.submissionLimit) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {plan.planType !== "enterprise" && (
              <Button
                onClick={() => setShowUpgradeModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 gap-2 shrink-0"
              >
                <Sparkles className="h-4 w-4" />
                {plan.planType === "free" ? "Upgrade Plan" : "Buy Conference Slot"}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* ============================================================ */}
      {/*  Stats Grid                                                   */}
      {/* ============================================================ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Conferences"
          value={stats.conferences}
          icon={Calendar}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <StatCard
          title="Active Now"
          value={stats.activeConferences}
          icon={Zap}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Submissions"
          value={stats.submissions}
          icon={FileText}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Reviewers"
          value={stats.reviewers}
          icon={Users}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          title="Total Collections"
          value={`₹${stats.revenue.toLocaleString()}`}
          icon={IndianRupee}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* ============================================================ */}
      {/*  Submission Overview + Quick Actions Row                      */}
      {/* ============================================================ */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* Submission Overview */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Submission Overview
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="text-2xl font-bold text-green-800">
                  {stats.openSubmissions}
                </p>
                <p className="text-xs text-green-600">Open</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <XCircle className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="text-2xl font-bold text-red-800">
                  {stats.closedSubmissions}
                </p>
                <p className="text-xs text-red-500">Closed</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
              <Zap className="h-4 w-4 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Quick Actions
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link href="/dashboard/organizer/conferences/new">
              <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                <Plus className="h-4 w-4 text-indigo-500" />
                <span className="text-sm">New Conference</span>
              </Button>
            </Link>

            <Link href="/dashboard/organizer/conferences">
              <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                <ClipboardList className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Manage Conferences</span>
              </Button>
            </Link>

            <Link href="/dashboard/organizer/reviewers">
              <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                <UserCheck className="h-4 w-4 text-green-500" />
                <span className="text-sm">Manage Reviewers</span>
              </Button>
            </Link>

            <Link href="/dashboard/organizer/submissions">
              <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                <FileText className="h-4 w-4 text-purple-500" />
                <span className="text-sm">View Submissions</span>
              </Button>
            </Link>

            <Link href="/dashboard/organizer/schedule">
              <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3">
                <CalendarClock className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Manage Schedule</span>
              </Button>
            </Link>
          </div>
        </Card>

      </div>

      {/* ============================================================ */}
      {/*  Schedule Overview                                             */}
      {/* ============================================================ */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
              <CalendarClock className="h-4 w-4 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Schedule Overview
            </h3>
            {scheduleStats.totalSessions > 0 && (
              <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 text-[11px]">
                <CheckCircle className="h-3 w-3" />
                Schedule Ready
              </Badge>
            )}
          </div>

          <Link
            href="/dashboard/organizer/schedule"
            className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
          >
            Manage Schedule
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {scheduleStats.totalDays === 0 &&
          scheduleStats.totalTracks === 0 &&
          scheduleStats.totalSessions === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-200 py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
              <CalendarClock className="h-6 w-6 text-orange-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              You haven&apos;t configured any schedule yet.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Set up days, tracks, and sessions for your conferences.
            </p>
            <Link href="/dashboard/organizer/schedule" className="mt-4 inline-block">
              <Button variant="outline" className="gap-2">
                <CalendarClock className="h-4 w-4" />
                Manage Schedule
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border bg-orange-50/50 border-orange-100 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {scheduleStats.totalDays}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Days Configured</p>
            </div>
            <div className="rounded-lg border bg-violet-50/50 border-violet-100 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {scheduleStats.totalTracks}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Tracks Configured</p>
            </div>
            <div className="rounded-lg border bg-cyan-50/50 border-cyan-100 px-4 py-3 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {scheduleStats.totalSessions}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Total Sessions</p>
            </div>
          </div>
        )}
      </Card>

      {/* ============================================================ */}
      {/*  Recent Conferences                                           */}
      {/* ============================================================ */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Conferences
          </h2>

          <Link
            href="/dashboard/organizer/conferences"
            className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading && (
          <p className="text-sm text-gray-500 py-6 text-center">
            Loading…
          </p>
        )}

        {!loading && recent.length === 0 ? (
          /* Empty state */
          <div className="py-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
              <Calendar className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              No conferences yet
            </h3>
            <p className="text-gray-500 mt-1 max-w-sm mx-auto">
              You haven&apos;t created any conferences yet. Get started
              by creating your first academic event.
            </p>
            <Link href="/dashboard/organizer/conferences/new" className="mt-4 inline-block">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Conference
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map((c) => {
              const submissionsOpen =
                c.submission_deadline && c.submission_deadline >= today;
              const submissionsClosed =
                c.submission_deadline && c.submission_deadline < today;

              return (
                <Link
                  key={c.id}
                  href={`/dashboard/organizer/conferences/${c.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border px-4 py-3 hover:bg-gray-50 transition-colors group"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    {/* Title row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                        {c.title}
                      </span>

                      {c.short_name && (
                        <Badge variant="secondary" className="text-[11px] shrink-0">
                          {c.short_name}
                        </Badge>
                      )}

                      <Badge
                        className={`text-[11px] shrink-0 ${c.is_published
                          ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
                          : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100"
                          }`}
                      >
                        {c.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(c.start_date)} → {formatDate(c.end_date)}
                      </span>

                      {c.mode && (
                        <Badge variant="outline" className="text-[11px] capitalize">
                          <Monitor className="h-3 w-3" />
                          {c.mode}
                        </Badge>
                      )}

                      {c.currency && (
                        <Badge variant="outline" className="text-[11px]">
                          <CreditCard className="h-3 w-3" />
                          {c.currency}
                        </Badge>
                      )}

                      {submissionsOpen && (
                        <Badge className="text-[11px] bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                          <CheckCircle className="h-3 w-3" />
                          Open
                        </Badge>
                      )}
                      {submissionsClosed && (
                        <Badge variant="secondary" className="text-[11px] text-red-600 bg-red-50 border-red-200 hover:bg-red-50">
                          <XCircle className="h-3 w-3" />
                          Closed
                        </Badge>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-500 transition-colors shrink-0 hidden sm:block" />
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      {/* ============================================================ */}
      {/*  Upgrade Modal                                                */}
      {/* ============================================================ */}
      {organization && profile && (
        <UpgradeModal
          open={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          organizationId={organization.id}
          userId={profile.id}
        />
      )}

    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card className="p-5 flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>

      <div className={`${iconBg} p-3 rounded-lg`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
    </Card>
  );
}