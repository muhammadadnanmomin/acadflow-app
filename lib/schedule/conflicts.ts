import { createClient } from "@/lib/supabase/client";
import type { ConflictResult, SessionFormData } from "./types";

// ============================================================
// Conflict Detection — Thin TS wrapper over DB functions (RPC)
// ============================================================

const supabase = createClient();

/** Check overlapping sessions in the same track */
export async function detectTimeOverlap(
    trackId: string,
    startTime: string,
    endTime: string,
    excludeId?: string
): Promise<ConflictResult[]> {
    const { data, error } = await supabase.rpc("check_track_time_overlap", {
        p_track_id: trackId,
        p_start_time: startTime,
        p_end_time: endTime,
        p_exclude_id: excludeId ?? null,
    });

    if (error) throw error;
    return (data || []).map((row: { id: string; title: string }) => ({
        type: "track_time_overlap" as const,
        message: `Time conflicts with "${row.title}" in the same track`,
        conflicting_session_id: row.id,
        conflicting_session_title: row.title,
    }));
}

/** Check room double-booking across the conference */
export async function detectRoomConflict(
    conferenceId: string,
    room: string,
    startTime: string,
    endTime: string,
    excludeId?: string
): Promise<ConflictResult[]> {
    if (!room) return [];

    const { data, error } = await supabase.rpc("check_room_conflict", {
        p_conference_id: conferenceId,
        p_room: room,
        p_start_time: startTime,
        p_end_time: endTime,
        p_exclude_id: excludeId ?? null,
    });

    if (error) throw error;
    return (data || []).map((row: { id: string; title: string }) => ({
        type: "room_conflict" as const,
        message: `Room "${room}" is already booked by "${row.title}"`,
        conflicting_session_id: row.id,
        conflicting_session_title: row.title,
    }));
}

/** Check if chairperson is already assigned during the same time */
export async function detectChairpersonConflict(
    chairpersonId: string,
    startTime: string,
    endTime: string,
    excludeId?: string
): Promise<ConflictResult[]> {
    if (!chairpersonId) return [];

    const { data, error } = await supabase.rpc("check_chairperson_conflict", {
        p_chairperson_id: chairpersonId,
        p_start_time: startTime,
        p_end_time: endTime,
        p_exclude_id: excludeId ?? null,
    });

    if (error) throw error;
    return (data || []).map((row: { id: string; title: string }) => ({
        type: "chairperson_conflict" as const,
        message: `Chairperson already assigned to "${row.title}" during this time`,
        conflicting_session_id: row.id,
        conflicting_session_title: row.title,
    }));
}

/** Check if a paper is already in another session */
export async function detectPaperDuplicate(
    paperId: string,
    excludeSessionId?: string
): Promise<ConflictResult[]> {
    const { data, error } = await supabase.rpc("check_paper_duplicate", {
        p_paper_id: paperId,
        p_exclude_session_id: excludeSessionId ?? null,
    });

    if (error) throw error;
    return (data || []).map(
        (row: { session_id: string; session_title: string }) => ({
            type: "paper_duplicate" as const,
            message: `Paper already assigned to session "${row.session_title}"`,
            conflicting_session_id: row.session_id,
            conflicting_session_title: row.session_title,
        })
    );
}

/** Run all conflict checks in parallel */
export async function detectAllConflicts(
    conferenceId: string,
    formData: SessionFormData,
    excludeSessionId?: string
): Promise<ConflictResult[]> {
    const checks: Promise<ConflictResult[]>[] = [
        detectTimeOverlap(
            formData.track_id,
            formData.start_time,
            formData.end_time,
            excludeSessionId
        ),
        detectRoomConflict(
            conferenceId,
            formData.room || "",
            formData.start_time,
            formData.end_time,
            excludeSessionId
        ),
    ];

    if (formData.chairperson_id) {
        checks.push(
            detectChairpersonConflict(
                formData.chairperson_id,
                formData.start_time,
                formData.end_time,
                excludeSessionId
            )
        );
    }

    if (formData.paper_ids?.length) {
        for (const paperId of formData.paper_ids) {
            checks.push(detectPaperDuplicate(paperId, excludeSessionId));
        }
    }

    const results = await Promise.all(checks);
    return results.flat();
}
