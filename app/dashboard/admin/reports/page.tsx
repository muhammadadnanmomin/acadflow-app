"use client";

import { useEffect, useState } from "react";

import RoleGuard from "@/lib/auth/RoleGuard";
import { supabase } from "@/lib/supabase/client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  Users,
  Calendar,
  CreditCard,
  TrendingUp,
} from "lucide-react";

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    users: 0,
    conferences: 0,
    submissions: 0,
    revenue: 0,
  });

  /* Load reports */
  async function loadReports() {
    setLoading(true);

    const users = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const conferences = await supabase
      .from("conferences")
      .select("*", { count: "exact", head: true });

    const submissions = await supabase
      .from("paper_submissions")
      .select("*", { count: "exact", head: true });

    const payments = await supabase
      .from("conference_registrations")
      .select("amount")
      .eq("payment_status", "success");

    const revenue =
      payments.data?.reduce(
        (sum, p) => sum + (p.amount || 0),
        0
      ) || 0;

    setStats({
      users: users.count || 0,
      conferences: conferences.count || 0,
      submissions: submissions.count || 0,
      revenue,
    });

    setLoading(false);
  }

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <RoleGuard allowed={["admin"]}>

      <div className="space-y-8 max-w-7xl">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">
            Reports & Analytics
          </h1>

          <p className="text-gray-500 mt-1">
            Platform performance overview
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

          <ReportCard
            title="Total Users"
            value={stats.users}
            icon={<Users />}
            color="blue"
          />

          <ReportCard
            title="Conferences"
            value={stats.conferences}
            icon={<Calendar />}
            color="purple"
          />

          <ReportCard
            title="Submissions"
            value={stats.submissions}
            icon={<TrendingUp />}
            color="orange"
          />

          <ReportCard
            title="Revenue"
            value={`₹${stats.revenue}`}
            icon={<CreditCard />}
            color="green"
          />

        </div>

        {/* Summary */}
        <Card className="p-6 space-y-4">

          <h2 className="text-xl font-semibold">
            System Summary
          </h2>

          {loading ? (

            <p className="text-sm text-gray-500">
              Loading report summary...
            </p>

          ) : (

            <div className="space-y-2 text-sm">

              <SummaryItem
                label="Platform Status"
                value="Healthy"
                color="green"
              />

              <SummaryItem
                label="Growth"
                value="Stable"
                color="blue"
              />

              <SummaryItem
                label="Payment System"
                value="Operational"
                color="green"
              />

              <SummaryItem
                label="Submissions Rate"
                value={
                  stats.submissions > 0
                    ? "Active"
                    : "Low"
                }
                color="orange"
              />

            </div>

          )}

        </Card>

      </div>

    </RoleGuard>
  );
}

/* Stat Card */
function ReportCard({
  title,
  value,
  icon,
  color,
}: any) {

  const colors: any = {
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    orange: "bg-orange-100 text-orange-700",
    green: "bg-green-100 text-green-700",
  };

  return (
    <Card className="p-5">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm text-gray-500">
            {title}
          </p>

          <p className="text-2xl font-bold">
            {value}
          </p>
        </div>

        <div
          className={`p-3 rounded-lg ${colors[color]}`}
        >
          {icon}
        </div>

      </div>

    </Card>
  );
}

/* Summary Line */
function SummaryItem({
  label,
  value,
  color,
}: any) {

  const colors: any = {
    green: "text-green-600",
    blue: "text-blue-600",
    orange: "text-orange-600",
  };

  return (
    <div className="flex justify-between">

      <span className="text-gray-600">
        {label}
      </span>

      <Badge className={colors[color]}>
        {value}
      </Badge>

    </div>
  );
}
