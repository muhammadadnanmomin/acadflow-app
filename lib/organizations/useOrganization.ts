"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

const supabase = createClient();

export function useOrganization() {
  const { profile } = useProfile();
  const [organization, setOrganization] = useState<any>(null);

  useEffect(() => {
    if (!profile) return;

    async function loadOrganization() {
      // 🔹 try membership first
      const { data, error } = await supabase
        .from("organization_members")
        .select(`organization:organizations(*)`)
        .eq("user_id", profile.id)
        .limit(1)
        .maybeSingle();

      if (data?.organization) {
        setOrganization(data.organization);
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
        return;
      }

      // 🔹 no organization
      setOrganization(null);
    }

    loadOrganization();
  }, [profile]);

  return organization;
}