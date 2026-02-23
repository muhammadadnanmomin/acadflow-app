"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  Calendar,
  FileText,
  Award,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserCheck,
} from "lucide-react";

const supabase = createClient();

export default function DashboardOverview() {
  const { profile } = useProfile();

  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [certificates, setCertificates] = useState(0);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [reviewTasks, setReviewTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadData();
  }, [profile]);

  async function loadData() {
    setLoading(true);

    try {
      /* 🔹 Upcoming deadlines */
      const { data: confs } = await supabase
        .from("conferences")
        .select("id, title, submission_deadline")
        .gte("submission_deadline", new Date().toISOString())
        .order("submission_deadline", { ascending: true })
        .limit(5);

      setDeadlines(confs || []);

      /* 🔹 Recommended conferences */
      const { data: recs } = await supabase
        .from("conferences")
        .select("id, title, start_date")
        .eq("is_published", true)
        .limit(5);

      setRecommended(recs || []);

      /* 🔹 Submission status */
      const { data: subs } = await supabase
        .from("paper_submissions")
        .select("id, status, conference_id, conferences(title)")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setSubmissions(subs || []);

      /* 🔹 Certificates */
      const { count } = await supabase
        .from("paper_submissions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .not("certificate_url", "is", null);

      setCertificates(count || 0);

      /* 🔹 Reviewer tasks */
      const { data: reviews } = await supabase
        .from("paper_submissions")
        .select("id, conferences(title)")
        .eq("reviewer_id", profile.id)
        .eq("status", "pending");

      setReviewTasks(reviews || []);
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  }

  if (loading) {
    return <p className="text-gray-500">Loading overview...</p>;
  }

  return (
    <div className="space-y-8 max-w-6xl">

      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Here’s what’s happening today.
        </p>
      </div>

      {/* Upcoming Deadlines */}
      <Section title="Upcoming Deadlines" icon={<AlertCircle className="h-5 w-5 text-red-500" />}>
        {deadlines.length === 0 ? (
          <Empty text="No upcoming deadlines." />
        ) : (
          deadlines.map((c) => (
            <Row
              key={c.id}
              title={c.title}
              subtitle={`Deadline: ${new Date(c.submission_deadline).toDateString()}`}
            />
          ))
        )}
      </Section>

      {/* Submission Status */}
      <Section title="Submission Status" icon={<FileText className="h-5 w-5 text-indigo-600" />}>
        {submissions.length === 0 ? (
          <Empty text="No submissions yet." />
        ) : (
          submissions.map((s) => (
            <Row
              key={s.id}
              title={s.conferences?.title}
              badge={<StatusBadge status={s.status} />}
            />
          ))
        )}
      </Section>

      {/* Reviewer Tasks */}
      {reviewTasks.length > 0 && (
        <Section title="Review Tasks" icon={<UserCheck className="h-5 w-5 text-amber-500" />}>
          {reviewTasks.map((r) => (
            <Row
              key={r.id}
              title={r.conferences?.title}
              subtitle="Pending review"
            />
          ))}
        </Section>
      )}

      {/* Recommended Conferences */}
      <Section title="Recommended Conferences" icon={<Calendar className="h-5 w-5 text-green-600" />}>
        {recommended.length === 0 ? (
          <Empty text="No conferences available." />
        ) : (
          recommended.map((c) => (
            <Row
              key={c.id}
              title={c.title}
              subtitle={`Starts: ${new Date(c.start_date).toDateString()}`}
              link={`/conferences/${c.id}`}
            />
          ))
        )}
      </Section>

      {/* Certificates */}
      <Section title="Achievements" icon={<Award className="h-5 w-5 text-purple-600" />}>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="text-green-600" />
          <p className="font-medium">
            You have earned {certificates} certificate{certificates !== 1 && "s"}
          </p>
        </div>
      </Section>

    </div>
  );
}

/* ---------- Reusable Components ---------- */

function Section({ title, icon, children }: any) {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 font-semibold text-lg">
        {icon} {title}
      </div>
      {children}
    </Card>
  );
}

function Row({ title, subtitle, badge, link }: any) {
  const content = (
    <div className="flex justify-between items-center border-b pb-2 last:border-0">
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
  return <p className="text-sm text-gray-500">{text}</p>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "accepted")
    return <Badge className="bg-green-100 text-green-700">Accepted</Badge>;
  if (status === "rejected")
    return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
  return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
}