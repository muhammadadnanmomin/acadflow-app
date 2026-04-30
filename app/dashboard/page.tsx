"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import { useProfile } from "@/lib/auth/useProfile";
import { useOrganization } from "@/lib/organizations/useOrganization";

export default function DashboardRedirect() {
  const { profile, loading } = useProfile();
  const { organization } = useOrganization();
  const router = useRouter();
  const supabase = createClient();

  const [isReviewer, setIsReviewer] = useState<boolean | null>(null);

  // 🔹 detect reviewer role via conference_staff
  useEffect(() => {
    if (!profile) return;

    async function checkReviewer() {
      if (!profile) return;
      const { data } = await supabase
        .from("conference_staff")
        .select("id")
        .eq("user_id", profile.id)
        .eq("role", "reviewer")
        .limit(1);

      setIsReviewer(data && data.length > 0);
    }

    checkReviewer();
  }, [profile]);

  useEffect(() => {
    if (loading || !profile || isReviewer === null) return;

    const storedRole = localStorage.getItem("activeRole");

    let role: string;

    // 1️⃣ user workspace preference
    if (storedRole) {
      role = storedRole;
    }

    // 2️⃣ organizer workspace available
    else if (organization) {
      role = "organizer";
    }

    // 3️⃣ reviewer workspace available
    else if (isReviewer) {
      role = "reviewer";
    }

    // 4️⃣ admin fallback
    else if (profile.role === "admin") {
      role = "admin";
    }

    // 5️⃣ default
    else {
      role = "participant";
    }

    switch (role) {
      case "admin":
        router.replace("/dashboard/admin");
        break;
      case "organizer":
        router.replace("/dashboard/organizer");
        break;
      case "reviewer":
        router.replace("/dashboard/reviewer");
        break;
      default:
        router.replace("/dashboard/participant/overview");
    }
  }, [profile, loading, organization, isReviewer, router]);

  return (
    <div className="p-10 text-gray-500">
      Loading your workspace...
    </div>
  );
}