"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

/* Strong typing for identity only */
interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at?: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadProfile(user: any) {
      if (!user) {
        if (mounted) {
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          name,
          email,
          avatar_url,
          bio,
          created_at
        `)
        .eq("id", user.id)
        .single();

      if (mounted) {
        if (!error && data) {
          setProfile(data);
        } else {
          console.error("Profile load error:", error);
          setProfile(null);
        }
        setLoading(false);
      }
    }

    /* Load current session */
    supabase.auth.getSession().then(({ data }) => {
      loadProfile(data.session?.user);
    });

    /* Listen for auth changes */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadProfile(session?.user);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { profile, loading };
}
