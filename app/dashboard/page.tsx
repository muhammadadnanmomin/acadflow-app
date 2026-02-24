"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/auth/useProfile";

export default function DashboardRedirect() {
  const { profile, loading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (loading || !profile) return;

    const storedRole = localStorage.getItem("activeRole");

    // prefer stored role if user switched dashboard
    const role = storedRole || profile.role;

    if (role === "admin") {
      router.replace("/dashboard/admin");
    } else if (role === "organizer") {
      router.replace("/dashboard/organizer");
    } else if (role === "reviewer") {
      router.replace("/dashboard/reviewer");
    } else {
      // participant default
      router.replace("/dashboard/participant/overview");
    }
  }, [profile, loading, router]);

  return (
    <div className="p-10 text-gray-500">
      Loading your workspace...
    </div>
  );
}