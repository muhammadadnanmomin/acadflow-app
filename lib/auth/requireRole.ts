import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requireRole(role: "organizer" | "reviewer" | "participant") {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("conference_registrations")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", role)
    .limit(1);

  if (error || !data || data.length === 0) {
    redirect("/dashboard");
  }

  return user;
}
