import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/* =========================
   REQUIRE LOGIN
========================= */
export async function requireAuth() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return user;
}

/* =========================
   ORGANIZATION ACCESS
   (Organizer workspace)
========================= */
export async function requireOrganizationAccess() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // ✅ check if admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") {
    return user; // admin bypass
  }

  // check organization membership
  const { data } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (!data || data.length === 0) {
    redirect("/dashboard");
  }

  return user;
}

/* =========================
   REVIEWER ACCESS
========================= */
export async function requireReviewerAccess(
  conferenceId: string
) {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("conference_staff")
    .select("id")
    .eq("user_id", user.id)
    .eq("conference_id", conferenceId)
    .eq("role", "reviewer")
    .limit(1);

  if (!data || data.length === 0) {
    redirect("/dashboard");
  }

  return user;
}

/* =========================
   ADMIN ACCESS
========================= */
export async function requireAdmin() {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (data?.role !== "admin") {
    redirect("/dashboard");
  }

  return user;
}