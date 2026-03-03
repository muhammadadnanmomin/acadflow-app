"use server";

import { supabaseServer } from "@/lib/supabase/server";
import type {
    ConferenceDay,
    Track,
    Session,
    DayFormData,
    TrackFormData,
    SessionFormData,
    ScheduleExport,
} from "./types";

// ============================================================
// Schedule Server Actions
// ============================================================

// ---- Conference Days ----

export async function createConferenceDay(
    conferenceId: string,
    data: DayFormData
) {
    const { data: day, error } = await supabaseServer
        .from("conference_days")
        .insert({
            conference_id: conferenceId,
            day_number: data.day_number,
            date: data.date,
            label: data.label || null,
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return day as ConferenceDay;
}

export async function updateConferenceDay(
    dayId: string,
    data: Partial<DayFormData>
) {
    const { error } = await supabaseServer
        .from("conference_days")
        .update({
            ...(data.day_number !== undefined && { day_number: data.day_number }),
            ...(data.date !== undefined && { date: data.date }),
            ...(data.label !== undefined && { label: data.label || null }),
        })
        .eq("id", dayId);

    if (error) throw new Error(error.message);
}

export async function deleteConferenceDay(dayId: string) {
    const { error } = await supabaseServer
        .from("conference_days")
        .delete()
        .eq("id", dayId);

    if (error) throw new Error(error.message);
}

// ---- Tracks ----

export async function createTrack(conferenceId: string, data: TrackFormData) {
    const { data: track, error } = await supabaseServer
        .from("tracks")
        .insert({
            conference_id: conferenceId,
            name: data.name,
            room_name: data.room_name || null,
            color_code: data.color_code,
            sort_order: data.sort_order ?? 0,
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return track as Track;
}

export async function updateTrack(
    trackId: string,
    data: Partial<TrackFormData>
) {
    const { error } = await supabaseServer
        .from("tracks")
        .update({
            ...(data.name !== undefined && { name: data.name }),
            ...(data.room_name !== undefined && {
                room_name: data.room_name || null,
            }),
            ...(data.color_code !== undefined && { color_code: data.color_code }),
            ...(data.sort_order !== undefined && { sort_order: data.sort_order }),
        })
        .eq("id", trackId);

    if (error) throw new Error(error.message);
}

export async function deleteTrack(trackId: string) {
    const { error } = await supabaseServer
        .from("tracks")
        .delete()
        .eq("id", trackId);

    if (error) throw new Error(error.message);
}

// ---- Sessions ----

export async function createSession(
    conferenceId: string,
    data: SessionFormData
) {
    const { data: session, error } = await supabaseServer
        .from("sessions")
        .insert({
            conference_id: conferenceId,
            day_id: data.day_id,
            track_id: data.track_id,
            title: data.title,
            session_type: data.session_type,
            mode: data.mode,
            start_time: data.start_time,
            end_time: data.end_time,
            venue: data.venue || null,
            room: data.room || null,
            platform: data.platform || null,
            meeting_link: data.meeting_link || null,
            timezone: data.timezone || null,
            chairperson_id: data.chairperson_id || null,
            coordinator_id: data.coordinator_id || null,
        })
        .select()
        .single();

    if (error) throw new Error(error.message);

    // Assign papers if provided
    if (data.paper_ids?.length) {
        const presentations = data.paper_ids.map((paperId, i) => ({
            session_id: session.id,
            paper_id: paperId,
            presentation_order: i + 1,
        }));

        const { error: pError } = await supabaseServer
            .from("session_presentations")
            .insert(presentations);

        if (pError) throw new Error(pError.message);
    }

    return session as Session;
}

export async function updateSession(
    sessionId: string,
    data: Partial<SessionFormData>
) {
    const updatePayload: Record<string, unknown> = {};

    if (data.day_id !== undefined) updatePayload.day_id = data.day_id;
    if (data.track_id !== undefined) updatePayload.track_id = data.track_id;
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.session_type !== undefined)
        updatePayload.session_type = data.session_type;
    if (data.mode !== undefined) updatePayload.mode = data.mode;
    if (data.start_time !== undefined) updatePayload.start_time = data.start_time;
    if (data.end_time !== undefined) updatePayload.end_time = data.end_time;
    if (data.venue !== undefined) updatePayload.venue = data.venue || null;
    if (data.room !== undefined) updatePayload.room = data.room || null;
    if (data.platform !== undefined)
        updatePayload.platform = data.platform || null;
    if (data.meeting_link !== undefined)
        updatePayload.meeting_link = data.meeting_link || null;
    if (data.timezone !== undefined)
        updatePayload.timezone = data.timezone || null;
    if (data.chairperson_id !== undefined)
        updatePayload.chairperson_id = data.chairperson_id || null;
    if (data.coordinator_id !== undefined)
        updatePayload.coordinator_id = data.coordinator_id || null;

    const { error } = await supabaseServer
        .from("sessions")
        .update(updatePayload)
        .eq("id", sessionId);

    if (error) throw new Error(error.message);

    // Re-sync papers if provided
    if (data.paper_ids !== undefined) {
        // Remove existing
        await supabaseServer
            .from("session_presentations")
            .delete()
            .eq("session_id", sessionId);

        // Re-insert
        if (data.paper_ids.length > 0) {
            const presentations = data.paper_ids.map((paperId, i) => ({
                session_id: sessionId,
                paper_id: paperId,
                presentation_order: i + 1,
            }));

            const { error: pError } = await supabaseServer
                .from("session_presentations")
                .insert(presentations);

            if (pError) throw new Error(pError.message);
        }
    }
}

export async function deleteSession(sessionId: string) {
    const { error } = await supabaseServer
        .from("sessions")
        .delete()
        .eq("id", sessionId);

    if (error) throw new Error(error.message);
}

// ---- Export ----

export async function exportScheduleJSON(
    conferenceId: string
): Promise<ScheduleExport> {
    // Fetch all data
    const { data: days } = await supabaseServer
        .from("conference_days")
        .select("*")
        .eq("conference_id", conferenceId)
        .order("day_number");

    const { data: tracks } = await supabaseServer
        .from("tracks")
        .select("*")
        .eq("conference_id", conferenceId)
        .order("sort_order");

    const { data: sessions } = await supabaseServer
        .from("sessions")
        .select("*, session_presentations(*, paper:paper_submissions(id, title))")
        .eq("conference_id", conferenceId)
        .order("start_time");

    const exportData: ScheduleExport = {
        conference_id: conferenceId,
        exported_at: new Date().toISOString(),
        days:
            (days || []).map((day) => ({
                day_number: day.day_number,
                date: day.date,
                label: day.label,
                tracks: (tracks || []).map((track) => ({
                    name: track.name,
                    color_code: track.color_code,
                    sessions: (sessions || [])
                        .filter(
                            (s: { day_id: string; track_id: string }) =>
                                s.day_id === day.id && s.track_id === track.id
                        )
                        .map(
                            (s: {
                                title: string;
                                session_type: string;
                                mode: string;
                                start_time: string;
                                end_time: string;
                                venue: string | null;
                                room: string | null;
                                platform: string | null;
                                meeting_link: string | null;
                                status: string;
                                session_presentations: Array<{
                                    presentation_order: number;
                                    paper: { title: string } | null;
                                }>;
                            }) => ({
                                title: s.title,
                                session_type: s.session_type as ScheduleExport["days"][0]["tracks"][0]["sessions"][0]["session_type"],
                                mode: s.mode as ScheduleExport["days"][0]["tracks"][0]["sessions"][0]["mode"],
                                start_time: s.start_time,
                                end_time: s.end_time,
                                venue: s.venue,
                                room: s.room,
                                platform: s.platform,
                                meeting_link: s.meeting_link,
                                status: s.status as ScheduleExport["days"][0]["tracks"][0]["sessions"][0]["status"],
                                presentations: (s.session_presentations || []).map(
                                    (p: {
                                        presentation_order: number;
                                        paper: { title: string } | null;
                                    }) => ({
                                        paper_title: p.paper?.title || "Untitled",
                                        presentation_order: p.presentation_order,
                                    })
                                ),
                            })
                        ),
                })),
            })) || [],
    };

    return exportData;
}
