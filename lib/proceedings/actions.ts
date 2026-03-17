"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ConferenceProceedings } from "./types";

/* ------------------------------------------------------------------ */
/*  Check if the current user can access proceedings for a conference  */
/* ------------------------------------------------------------------ */
export async function checkProceedingsAccess(
  conferenceId: string
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data, error } = await supabase.rpc("can_access_proceedings", {
    conf_id: conferenceId,
  });

  if (error) {
    console.error("checkProceedingsAccess error:", error);
    return false;
  }

  return !!data;
}

/* ------------------------------------------------------------------ */
/*  Get the proceedings record for a conference                        */
/* ------------------------------------------------------------------ */
export async function getProceedingsForConference(
  conferenceId: string
): Promise<ConferenceProceedings | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("conference_proceedings")
    .select("*")
    .eq("conference_id", conferenceId)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("getProceedingsForConference error:", error);
    return null;
  }

  return data;
}

/* ------------------------------------------------------------------ */
/*  Generate a short-lived signed URL (5 minutes)                      */
/* ------------------------------------------------------------------ */
export async function getSignedProceedingsUrl(
  filePath: string
): Promise<string | null> {
  const { data, error } = await supabaseAdmin.storage
    .from("conference-proceedings")
    .createSignedUrl(filePath, 60 * 5); // 5-minute expiry

  if (error) {
    console.error("getSignedProceedingsUrl error:", error);
    return null;
  }

  return data.signedUrl;
}

/* ------------------------------------------------------------------ */
/*  Log proceedings access (audit)                                     */
/* ------------------------------------------------------------------ */
export async function logProceedingsAccess(
  conferenceId: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabaseAdmin.from("proceedings_access_logs").insert({
    user_id: user.id,
    conference_id: conferenceId,
  });
}

/* ------------------------------------------------------------------ */
/*  Check if user is organizer / owner of a conference                 */
/* ------------------------------------------------------------------ */
export async function isConferenceOrganizer(
  conferenceId: string
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from("conference_staff")
    .select("id")
    .eq("conference_id", conferenceId)
    .eq("user_id", user.id)
    .in("role", ["organizer", "owner"])
    .limit(1);

  return !!data && data.length > 0;
}

/* ------------------------------------------------------------------ */
/*  Get proceedings for organizer (bypasses is_published filter)        */
/* ------------------------------------------------------------------ */
export async function getOrganizerProceedings(
  conferenceId: string
): Promise<ConferenceProceedings | null> {
  const { data, error } = await supabaseAdmin
    .from("conference_proceedings")
    .select("*")
    .eq("conference_id", conferenceId)
    .maybeSingle();

  if (error) {
    console.error("getOrganizerProceedings error:", error);
    return null;
  }

  return data;
}
