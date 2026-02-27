"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import RoleGuard from "@/lib/auth/RoleGuard";
import { createClient } from "@/lib/supabase/client";

import { Card } from "@/components/ui/card";

import {
  Users,
  Calendar,
  CreditCard,
  Shield,
} from "lucide-react";

const supabase = createClient()

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    conferences: 0,
    payments: 0,
  });

  async function loadStats() {
    const users = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const conferences = await supabase
      .from("conferences")
      .select("*", { count: "exact", head: true });

    const payments = await supabase
      .from("conference_registrations")
      .select("*", { count: "exact", head: true })
      .eq("payment_status", "success");

    setStats({
      users: users.count || 0,
      conferences: conferences.count || 0,
      payments: payments.count || 0,
    });
  }

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <RoleGuard adminOnly={true}>

      <div className="space-y-8 max-w-6xl">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">
            👑 Admin Dashboard
          </h1>

          <p className="text-gray-500 mt-1">
            System overview and controls
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-6 sm:grid-cols-3">

          <AdminCard
            title="Users"
            value={stats.users}
            icon={<Users />}
            href="/dashboard/admin/users"
          />

          <AdminCard
            title="Conferences"
            value={stats.conferences}
            icon={<Calendar />}
            href="/dashboard/admin/conferences"
          />

          <AdminCard
            title="Payments"
            value={stats.payments}
            icon={<CreditCard />}
            href="/dashboard/admin/payments"
          />

        </div>

        {/* System Status */}
        <Card className="p-6">

          <div className="flex items-center gap-3">

            <Shield className="h-5 w-5 text-green-600" />

            <p className="text-sm text-gray-600">
              All systems operational
            </p>

          </div>

        </Card>

      </div>

    </RoleGuard>
  );
}

/* Card Component */
function AdminCard({
  title,
  value,
  icon,
  href,
}: any) {
  return (
    <Link href={href}>

      <Card className="p-5 cursor-pointer transition hover:shadow-md">

        <div className="flex items-center justify-between">

          <div>
            <p className="text-sm text-gray-500">
              {title}
            </p>

            <p className="text-2xl font-bold">
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
