import { supabase } from "@/lib/supabase/client";

export async function getRegistrationStatus(conferenceId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("conference_registrations")
    .select("*")
    .eq("user_id", user.id)
    .eq("conference_id", conferenceId)
    .maybeSingle();

  return data;
}
