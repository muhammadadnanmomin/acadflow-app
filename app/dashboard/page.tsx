"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/auth/useProfile";

export default function DashboardRedirect() {
  const { profile, loading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (loading || !profile) return;

    /**
     * If user directly navigates to /dashboard
     * we now KEEP them here (Overview Page).
     *
     * Role dashboards are accessed via sidebar.
     */

    router.replace("/dashboard/overview");

  }, [profile, loading, router]);

  return (
    <div className="p-10 text-gray-500">
      Loading your workspace...
    </div>
  );
}