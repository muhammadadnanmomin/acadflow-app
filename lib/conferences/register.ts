import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export async function registerUser(
  conferenceId: string,
  role: "author" | "attendee"
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not logged in" };
  }

  const { error } = await supabase
    .from("conference_registrations")
    .insert({
      user_id: user.id,
      conference_id: conferenceId,
      role,
      has_paid: false,
    });

  if (error) return { error: error.message };

  return { success: true };
}
