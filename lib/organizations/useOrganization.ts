"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

const supabase = createClient();

export function useOrganization() {
  const { profile, loading: profileLoading } = useProfile();
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadOrganization = useCallback(async () => {
    if (!profile) return;

    setLoading(true);

    // 🔹 try membership first
    const { data } = await supabase
      .from("organization_members")
      .select(`organization:organizations(*)`)
      .eq("user_id", profile.id)
      .limit(1)
      .maybeSingle();

    if (data?.organization) {
      setOrganization(data.organization);
      setLoading(false);
      return;
    }

    // 🔹 admin fallback → fetch first organization
    if (profile.role === "admin") {
      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: true }) // predictable
        .limit(1)
        .maybeSingle();

      setOrganization(org || null);
      setLoading(false);
      return;
    }

    // 🔹 no organization
    setOrganization(null);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    if (profileLoading) return;

    if (!profile) {
      setLoading(false);
      return;
    }

    loadOrganization();
  }, [profile, profileLoading, loadOrganization]);

  // 🔹 Listen for page focus to re-fetch (catches post-upgrade returns)
  useEffect(() => {
    function handleFocus() {
      if (profile) loadOrganization();
    }

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [profile, loadOrganization]);

  return { organization, loading, refetch: loadOrganization };
}
