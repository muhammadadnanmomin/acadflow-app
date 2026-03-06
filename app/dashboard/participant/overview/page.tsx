"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Calendar,
  FileText,
  Award,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserCheck,
  Search,
  Send,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";

/* ---------- Types ---------- */

interface Deadline {
  id: string;
  title: string;
  submission_deadline: string;
}

interface Submission {
  id: string;
  status: string;
  conference_id: string;
  conferences: { title: string } | null;
}

interface ReviewTask {
  id: string;
  conferences: { title: string } | null;
}

interface RecommendedConference {
  id: string;
  title: string;
  start_date: string;
}

/* ---------- Supabase client ---------- */

const supabase = createClient();

/* ---------- Main Component ---------- */

export default function DashboardOverview() {
  const { profile } = useProfile();

  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [certificates, setCertificates] = useState(0);
  const [recommended, setRecommended] = useState<RecommendedConference[]>([]);
  const [reviewTasks, setReviewTasks] = useState<ReviewTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadData();
  }, [profile]);

  async function loadData() {
    if (!profile) return;
    setLoading(true);

    try {
      const [deadlinesRes, recommendedRes, submissionsRes, certsRes, reviewsRes] =
        await Promise.all([
          /* 🔹 Upcoming deadlines */
          supabase
            .from("conferences")
            .select("id, title, submission_deadline")
            .gte("submission_deadline", new Date().toISOString())
            .order("submission_deadline", { ascending: true })
            .limit(5),

          /* 🔹 Recommended conferences */
          supabase
            .from("conferences")
            .select("id, title, start_date")
            .eq("is_published", true)
            .limit(5),

          /* 🔹 Submission status */
          supabase
            .from("paper_submissions")
            .select("id, status, conference_id, conferences(title)")
            .eq("user_id", profile.id)
            .order("created_at", { ascending: false })
            .limit(5),

          /* 🔹 Certificates */
          supabase
            .from("paper_submissions")
            .select("*", { count: "exact", head: true })
            .eq("user_id", profile.id)
            .not("certificate_url", "is", null),

          /* 🔹 Reviewer tasks */
          supabase
            .from("paper_submissions")
            .select("id, conferences(title)")
            .eq("reviewer_id", profile.id)
            .eq("status", "pending"),
        ]);

      setDeadlines((deadlinesRes.data as Deadline[]) || []);
      setRecommended((recommendedRes.data as RecommendedConference[]) || []);
      setSubmissions((submissionsRes.data as unknown as Submission[]) || []);
      setCertificates(certsRes.count || 0);
      setReviewTasks((reviewsRes.data as unknown as ReviewTask[]) || []);
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  }

  /* ---------- Loading skeleton ---------- */

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl animate-in fade-in duration-300">
        {/* Greeting skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-72 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
        </div>

        {/* Quick actions skeleton */}
        <div className="flex gap-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-9 w-40 bg-gray-200 rounded-md animate-pulse"
            />
          ))}
        </div>

        {/* Card skeletons */}
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-white p-6 space-y-4"
          >
            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* ---------- Dashboard ---------- */

  return (
    <div className="space-y-8 max-w-6xl animate-in fade-in duration-300">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back {profile?.name || "Researcher"} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Quick Actions */}
      <Section
        title="Quick Actions"
        icon={<ArrowRight className="h-5 w-5 text-blue-600" />}
      >
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/conferences">
              <Search className="h-4 w-4" />
              Browse Conferences
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/participant/submissions">
              <Send className="h-4 w-4" />
              My Submissions
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/participant/certificates">
              <BadgeCheck className="h-4 w-4" />
              Certificates
            </Link>
          </Button>
        </div>
      </Section>

      {/* Upcoming Deadlines */}
      <Section
        title="Upcoming Deadlines"
        icon={<AlertCircle className="h-5 w-5 text-red-500" />}
      >
        {deadlines.length === 0 ? (
          <Empty text="No upcoming deadlines. You're all caught up!" />
        ) : (
          deadlines.map((c) => (
            <Row
              key={c.id}
              title={c.title}
              subtitle={`Deadline ${formatDistanceToNow(new Date(c.submission_deadline), { addSuffix: true })}`}
            />
          ))
        )}
      </Section>

      {/* Submission Status */}
      <Section
        title="Submission Status"
        icon={<FileText className="h-5 w-5 text-indigo-600" />}
      >
        {submissions.length === 0 ? (
          <Empty text="No submissions yet. Submit your first paper." />
        ) : (
          submissions.map((s) => (
            <Row
              key={s.id}
              title={s.conferences?.title ?? "Untitled Conference"}
              badge={<StatusBadge status={s.status} />}
            />
          ))
        )}
      </Section>

      {/* Reviewer Tasks */}
      {reviewTasks.length > 0 && (
        <Section
          title="Review Tasks"
          icon={<UserCheck className="h-5 w-5 text-amber-500" />}
        >
          {reviewTasks.map((r) => (
            <Row
              key={r.id}
              title={r.conferences?.title ?? "Untitled Conference"}
              subtitle="Pending review"
            />
          ))}
        </Section>
      )}

      {/* Recommended Conferences */}
      <Section
        title="Recommended Conferences"
        icon={<Calendar className="h-5 w-5 text-green-600" />}
      >
        {recommended.length === 0 ? (
          <Empty text="No conferences available right now." />
        ) : (
          recommended.map((c) => (
            <Row
              key={c.id}
              title={c.title}
              subtitle={`Starts ${formatDistanceToNow(new Date(c.start_date), { addSuffix: true })}`}
              link={`/conferences/${c.id}`}
            />
          ))
        )}
      </Section>

      {/* Certificates / Achievements */}
      <Section
        title="Achievements"
        icon={<Award className="h-5 w-5 text-purple-600" />}
      >
        <div className="flex items-center gap-3 p-2">
          <CheckCircle2 className="text-green-600 h-5 w-5" />
          <p className="font-medium">
            You have earned {certificates} certificate
            {certificates !== 1 && "s"}
          </p>
        </div>
      </Section>
    </div>
  );
}

/* ---------- Reusable Components ---------- */

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 font-semibold text-lg">
        {icon} {title}
      </div>
      {children}
    </Card>
  );
}

interface RowProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  link?: string;
}

function Row({ title, subtitle, badge, link }: RowProps) {
  const content = (
    <div className="flex justify-between items-center hover:bg-gray-50 transition rounded p-2 -mx-2">
      <div>
        <p className="font-medium">{title}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {badge}
    </div>
  );

  if (link) {
    return <Link href={link}>{content}</Link>;
  }

  return content;
}

function Empty({ text }: { text: string }) {
  return (
    <p className="text-sm text-gray-500 py-2 italic">{text}</p>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "accepted")
    return <Badge className="bg-green-100 text-green-700">Accepted</Badge>;
  if (status === "rejected")
    return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
}