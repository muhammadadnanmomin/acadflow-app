"use client";

import { useEffect, useState } from "react";
import { useProfile } from "./useProfile";
import { useOrganization } from "@/lib/organizations/useOrganization";

export function useActiveRole() {
  const { profile, loading } = useProfile();
  const organization = useOrganization();

  const [activeRole, setActiveRole] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    const stored = localStorage.getItem("activeRole");

    // 🔹 if user switched workspace before, respect it
    if (stored) {
      setActiveRole(stored);
      return;
    }

    // 🔹 admin always admin
    if (profile.role === "admin") {
      setActiveRole("admin");
      return;
    }

    // 🔹 organizer workspace available
    if (organization) {
      setActiveRole("organizer");
      return;
    }

    // 🔹 default workspace
    setActiveRole("participant");
  }, [profile, organization]);

  return { activeRole, loading };
}