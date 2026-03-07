"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOrganization } from "@/lib/organizations/useOrganization";

import {
  FileText,
  Award,
  Calendar,
  Search,
  Upload,
  Send,
  BadgeCheck,
  CreditCard,
  Clock,
  Rocket,
  Building2,
  ArrowRight,
} from "lucide-react";

export default function ParticipantDashboard() {
  const { profile } = useProfile();
  const supabase = createClient();
  const { organization } = useOrganization();

  const [loading, setLoading] = useState(true);

  const [submissions, setSubmissions] = useState(0);
  const [registrations, setRegistrations] = useState(0);
  const [certificates, setCertificates] = useState(0);

  /* Load stats — all queries in parallel */
  async function loadStats() {
    if (!profile) return;

    setLoading(true);

    try {
      const [subsRes, regsRes, certsRes] = await Promise.all([
        /* Submissions */
        supabase
          .from("paper_submissions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profile.id),

        /* Registrations (participant only) */
        supabase
          .from("conference_registrations")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profile.id)
          .eq("role", "participant"),

        /* Certificates */
        supabase
          .from("paper_submissions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profile.id)
          .not("certificate_url", "is", null),
      ]);

      setSubmissions(subsRes.count || 0);
      setRegistrations(regsRes.count || 0);
      setCertificates(certsRes.count || 0);
    } catch (error) {
      console.error("Participant stats error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, [profile]);

  /* ---------- Loading skeleton ---------- */

  if (loading) {
    return (
      <div className="space-y-8 max-w-6xl animate-in fade-in duration-300">
        {/* Greeting skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-80 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
        </div>

        {/* Stat cards skeleton */}
        <div className="grid gap-6 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                  <div className="h-7 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-10 w-10 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions skeleton */}
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="flex flex-wrap gap-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-9 w-36 bg-gray-100 rounded-md animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Cards skeleton */}
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-white p-6 space-y-3">
            <div className="h-5 w-44 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  /* ---------- Dashboard ---------- */

  return (
    <div className="space-y-8 max-w-6xl animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back {profile?.name || "Researcher"} 👋
        </h1>

        <p className="text-gray-500 mt-1">
          Manage your submissions, registrations, and certificates.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-3">
        <StatCard
          title="My Submissions"
          value={submissions}
          icon={<FileText />}
          href="/dashboard/participant/submissions"
          helperText="Start by submitting your first paper."
        />

        <StatCard
          title="My Registrations"
          value={registrations}
          icon={<Calendar />}
          href="/dashboard/participant/conferences"
          helperText="Register for a conference to get started."
        />

        <StatCard
          title="Certificates"
          value={certificates}
          icon={<Award />}
          href="/dashboard/participant/certificates"
          helperText="Certificates appear after your paper is presented."
        />
      </div>

      {/* Quick Actions */}
      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>

        <div className="flex flex-wrap gap-3">
          <ActionButton
            href="/conferences"
            label="Browse Conferences"
            icon={<Search className="h-4 w-4" />}
          />

          <ActionButton
            href="/dashboard/participant/submissions"
            label="Upload Paper"
            icon={<Upload className="h-4 w-4" />}
          />

          <ActionButton
            href="/dashboard/participant/submissions"
            label="My Submissions"
            icon={<Send className="h-4 w-4" />}
          />

          <ActionButton
            href="/dashboard/participant/certificates"
            label="My Certificates"
            icon={<BadgeCheck className="h-4 w-4" />}
          />

          <ActionButton
            href="/dashboard/participant/payments"
            label="View Payments"
            icon={<CreditCard className="h-4 w-4" />}
          />
        </div>
      </Card>

      {/* Create Organization CTA */}
      {!organization && (
        <Card className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-indigo-100 bg-indigo-50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Rocket className="h-5 w-5 text-indigo-600" />
              <p className="text-lg font-semibold text-indigo-900">
                Start Hosting Conferences
              </p>
            </div>
            <p className="text-sm text-indigo-700">
              Create an organization and start managing conferences,
              submissions, and reviewers.
            </p>
          </div>

          <Button asChild>
            <Link href="/onboarding/organization">
              <Building2 className="h-4 w-4" />
              Create Organization
            </Link>
          </Button>
        </Card>
      )}

      {/* Organization Workspace */}
      {organization && (
        <Card className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-indigo-100 bg-indigo-50">
          <div>
            <p className="text-lg font-semibold text-indigo-900">
              {organization.name}
            </p>
            <p className="text-sm text-indigo-700">
              Manage conferences and your organization workspace.
            </p>
          </div>

          <Button asChild>
            <Link href="/dashboard/organizer">
              <ArrowRight className="h-4 w-4" />
              Open Organizer Dashboard
            </Link>
          </Button>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-500" />
          <h2 className="text-xl font-semibold">Recent Activity</h2>
        </div>

        <p className="text-sm text-gray-500 italic py-2">
          No recent activity yet.
        </p>
      </Card>

      {/* Status */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Account Status</h2>

        <div className="flex items-center gap-4">
          <Badge className="bg-green-100 text-green-700">Active</Badge>

          <p className="text-sm text-gray-500">
            Your account is in good standing
          </p>
        </div>
      </Card>
    </div>
  );
}

/* ---------- Stat Card ---------- */

function StatCard({
  title,
  value,
  icon,
  href,
  helperText,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  helperText?: string;
}) {
  return (
    <Link href={href}>
      <Card className="p-5 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            {value === 0 && helperText && (
              <p className="mt-1 text-xs text-gray-400">{helperText}</p>
            )}
          </div>

          <div className="bg-primary/10 p-3 rounded-lg text-primary">
            {icon}
          </div>
        </div>
      </Card>
    </Link>
  );
}

/* ---------- Action Button ---------- */

function ActionButton({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <Button asChild variant="outline">
      <Link href={href}>
        {icon}
        {label}
      </Link>
    </Button>
  );
}
