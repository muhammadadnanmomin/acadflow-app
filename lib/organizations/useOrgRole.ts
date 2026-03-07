"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";
import { useOrganization } from "./useOrganization";

const supabase = createClient();

export function useOrgRole() {
  const { profile } = useProfile();
  const { organization } = useOrganization();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || !organization) return;

    async function loadRole() {
      if (!profile) return;
      const { data } = await supabase
        .from("organization_members")
        .select("role")
        .eq("user_id", profile.id)
        .eq("organization_id", organization.id)
        .single();

      setRole(data?.role || null);
    }

    loadRole();
  }, [profile, organization]);

  return role;
}