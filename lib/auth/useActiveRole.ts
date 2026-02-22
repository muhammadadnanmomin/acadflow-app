"use client";

import { useEffect, useState } from "react";
import { useProfile } from "./useProfile";

export function useActiveRole() {
  const { profile, loading } = useProfile();
  const [activeRole, setActiveRole] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    const stored = localStorage.getItem("activeRole");

    if (stored) {
      setActiveRole(stored);
    } else {
      setActiveRole(profile.role);
      localStorage.setItem("activeRole", profile.role);
    }
  }, [profile]);

  return { activeRole, loading };
}
