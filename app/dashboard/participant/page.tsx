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
} from "lucide-react";

export default function ParticipantDashboard() {
  const { profile } = useProfile();
  const supabase = createClient();
  const organization = useOrganization();

  const [loading, setLoading] = useState(true);

  const [submissions, setSubmissions] = useState(0);
  const [registrations, setRegistrations] = useState(0);
  const [certificates, setCertificates] = useState(0);

  /* Load stats */
  async function loadStats() {
    if (!profile) return;

    setLoading(true);

    try {
      /* Submissions */
      if (!profile) return;

      const { count: subCount } = await supabase
        .from("paper_submissions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id);

      /* Registrations (participant only) */
      if (!profile) return;

      const { count: regCount } = await supabase
        .from("conference_registrations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("role", "participant");

      /* Certificates */
      if (!profile) return;
      
      const { count: certCount } = await supabase
        .from("paper_submissions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .not("certificate_url", "is", null);

      setSubmissions(subCount || 0);
      setRegistrations(regCount || 0);
      setCertificates(certCount || 0);
    } catch (error) {
      console.error("Participant stats error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, [profile]);

  return (
    <div className="space-y-8 max-w-6xl">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Participant Dashboard
        </h1>

        <p className="text-gray-500 mt-1">
          Manage your submissions and registrations
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-3">

        <StatCard
          title="My Submissions"
          value={submissions}
          icon={<FileText />}
          href="/dashboard/participant/submissions"
        />

        <StatCard
          title="My Registrations"
          value={registrations}
          icon={<Calendar />}
          href="/dashboard/participant/conferences"
        />

        <StatCard
          title="Certificates"
          value={certificates}
          icon={<Award />}
          href="/dashboard/participant/certificates"
        />

      </div>

      {/* Quick Actions */}
      <Card className="p-6 space-y-4">

        <h2 className="text-xl font-semibold">
          Quick Actions
        </h2>

        <div className="flex flex-wrap gap-3">

          <ActionButton
            href="/conferences"
            label="Browse Conferences"
          />

          <ActionButton
            href="/dashboard/participant/submissions"
            label="Upload Paper"
          />

          <ActionButton
            href="/dashboard/participant/payments"
            label="View Payments"
          />

        </div>

      </Card>

      {/* Create Organization CTA */}
      {!organization && (
        <Card className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-indigo-100 bg-indigo-50">
          <div>
            <p className="text-lg font-semibold text-indigo-900">
              Host Your Own Conference
            </p>
            <p className="text-sm text-indigo-700">
              Create an organization and start managing conferences.
            </p>
          </div>

          <Button asChild>
            <Link href="onboarding/organization">
              ➕ Create Organization
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
              Open Organizer Dashboard
            </Link>
          </Button>
        </Card>
      )}

      {/* Status */}
      <Card className="p-6">

        <h2 className="text-xl font-semibold mb-4">
          Account Status
        </h2>

        <div className="flex items-center gap-4">

          <Badge className="bg-green-100 text-green-700">
            Active
          </Badge>

          <p className="text-sm text-gray-500">
            Your account is in good standing
          </p>

        </div>

      </Card>

      {loading && (
        <p className="text-sm text-gray-400">
          Loading dashboard...
        </p>
      )}

    </div>
  );
}

/* Stat Card */
function StatCard({
  title,
  value,
  icon,
  href,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="p-5 cursor-pointer transition hover:shadow-md">
        <div className="flex items-center justify-between">

          <div>
            <p className="text-sm text-gray-500">
              {title}
            </p>
            <p className="mt-1 text-2xl font-bold">
              {value}
            </p>
          </div>

          <div className="bg-primary/10 p-3 rounded-lg text-primary">
            {icon}
          </div>

        </div>
      </Card>
    </Link>
  );
}

/* Action Button */
function ActionButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Button asChild variant="outline">
      <Link href={href}>
        {label}
      </Link>
    </Button>
  );
}
