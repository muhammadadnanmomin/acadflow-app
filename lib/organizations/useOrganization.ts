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
      const { data, error } = await supabase
        .from("organization_members")
        .select(`
          organization:organizations(*)
        `)
        .eq("user_id", profile.id)
        .limit(1)
        .single();

      if (!error && data?.organization) {
        setOrganization(data.organization);
      }
    }

    loadOrganization();
  }, [profile]);

  return organization;
}