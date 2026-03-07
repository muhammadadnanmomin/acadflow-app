"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

const supabase = createClient();

export function useOrganization() {
  const { profile, loading: profileLoading } = useProfile();
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profileLoading) return;

    if (!profile) {
      setLoading(false);
      return;
    }

    async function loadOrganization() {
      // 🔹 try membership first
      if (!profile) return;

      setLoading(true);

      const { data, error } = await supabase
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
    }

    loadOrganization();
  }, [profile, profileLoading]);

  return { organization, loading };
}
