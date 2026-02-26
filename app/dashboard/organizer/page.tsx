"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { useOrganization } from "@/lib/organizations/useOrganization";

import {
  Calendar,
  FileText,
  Users,
  CreditCard,
  Plus,
  Building2,
} from "lucide-react";

import Link from "next/link";

export default function OrganizerDashboard() {
  const { profile } = useProfile();
  const supabase = createClient();

  const organization = useOrganization();

  const [stats, setStats] = useState({
    conferences: 0,
    submissions: 0,
    reviewers: 0,
    revenue: 0,
  });

  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;

    async function load() {
      if (!profile) return;

      const orgIds = organization ? [organization.id] : [];

      /* conferences query */
      let query = supabase
        .from("conferences")
        .select("*")
        .order("created_at", { ascending: false });

      query = query.or(`organizer_id.eq.${profile.id}`);

      if (orgIds.length > 0) {
        query = query.or(
          `organization_id.in.(${orgIds.join(",")})`
        );
      }

      const { data: conferences, error } = await query;

      if (error) {
        console.error(error);
        return;
      }

      const conferenceIds = conferences?.map(c => c.id) || [];

      /* submissions count */
      let submissions = 0;

      if (conferenceIds.length > 0) {
        const { count } = await supabase
          .from("paper_submissions")
          .select("*", { count: "exact", head: true })
          .in("conference_id", conferenceIds);

        submissions = count || 0;
      }

      /* ✅ reviewer count (unique reviewers across conferences) */
      let reviewerCount = 0;

      if (conferenceIds.length > 0) {
        const { data } = await supabase
          .from("conference_registrations")
          .select("user_id")
          .in("conference_id", conferenceIds)
          .eq("role", "reviewer");

        reviewerCount = new Set(
          data?.map(r => r.user_id)
        ).size;
      }

      setStats({
        conferences: conferences?.length || 0,
        submissions,
        reviewers: reviewerCount,
        revenue: 0,
      });

      setRecent(conferences?.slice(0, 5) || []);
    }

    load();
  }, [profile, organization]);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Organizer Dashboard
          </h1>

          {/* Organization indicator */}
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
            <Link href="/dashboard/organizer/conferences/new">
              <Plus className="h-4 w-4 mr-1" />
              New Conference
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="Conferences" value={stats.conferences} icon={Calendar} />
        <Stat title="Submissions" value={stats.submissions} icon={FileText} />
        <Stat title="Reviewers" value={stats.reviewers} icon={Users} />
        <Stat title="Revenue" value={`₹${stats.revenue}`} icon={CreditCard} />
      </div>

      {/* Recent Conferences */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Recent Conferences
          </h2>

          <Link
            href="/dashboard/organizer/conferences"
            className="text-sm text-indigo-600 hover:underline"
          >
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="text-sm text-gray-500">
            No conferences yet.
          </p>
        ) : (
          <div className="space-y-3">
            {recent.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between border-b pb-2 last:border-0"
              >
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-sm text-gray-500">
                    {c.start_date} → {c.end_date}
                  </p>
                </div>

                <Link
                  href={`/dashboard/organizer/conferences`}
                  className="text-sm text-indigo-600"
                >
                  Manage
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* Small stat card */
function Stat({ title, value, icon: Icon }: any) {
  return (
    <Card className="p-6 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>

      <div className="bg-indigo-50 p-3 rounded-lg">
        <Icon className="h-6 w-6 text-indigo-600" />
      </div>
    </Card>
  );
}