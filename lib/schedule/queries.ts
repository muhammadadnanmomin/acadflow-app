import { createClient } from "@/lib/supabase/client";
import type {
    ConferenceDay,
    Track,
    Session,
    SessionPresentation,
} from "./types";

// ============================================================
// Schedule Queries — Client-Side Supabase Fetchers
// ============================================================

const supabase = createClient();

/** Get all days for a conference, ordered by day_number */
export async function getConferenceDays(conferenceId: string) {
    const { data, error } = await supabase
        .from("conference_days")
        .select("*")
        .eq("conference_id", conferenceId)
        .order("day_number", { ascending: true });

    if (error) throw error;
    return data as ConferenceDay[];
}

/** Get all tracks for a conference, ordered by sort_order */
export async function getTracks(conferenceId: string) {
    const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .eq("conference_id", conferenceId)
        .order("sort_order", { ascending: true });

    if (error) throw error;
    return data as Track[];
}

/** Get sessions for a conference, optionally filtered by day/track */
export async function getSessions(
    conferenceId: string,
    dayId?: string,
    trackId?: string
) {
    let query = supabase
        .from("sessions")
        .select("*, track:tracks(*), day:conference_days(*)")
        .eq("conference_id", conferenceId)
        .order("start_time", { ascending: true });

    if (dayId) query = query.eq("day_id", dayId);
    if (trackId) query = query.eq("track_id", trackId);

    const { data, error } = await query;
    if (error) throw error;
    return data as Session[];
}

/** Get presentations (papers) for a session */
export async function getSessionPresentations(sessionId: string) {
    const { data, error } = await supabase
        .from("session_presentations")
        .select("*, paper:paper_submissions(id, title, status)")
        .eq("session_id", sessionId)
        .order("presentation_order", { ascending: true });

    if (error) throw error;
    return data as SessionPresentation[];
}

/** Get all accepted papers for a conference (for assignment dropdown) */
export async function getAcceptedPapers(conferenceId: string) {
    const { data, error } = await supabase
        .from("paper_submissions")
        .select("id, title, status")
        .eq("conference_id", conferenceId)
        .eq("status", "accepted");

    if (error) throw error;
    return data as { id: string; title: string; status: string }[];
}


