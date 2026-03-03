// ============================================================
// Schedule Types — AcadFlow Multi-Track Scheduling
// ============================================================

export type SessionType =
    | "keynote"
    | "technical"
    | "invited"
    | "workshop"
    | "ceremony"
    | "break";

export type SessionMode = "offline" | "online" | "hybrid";

export type SessionStatus = "scheduled" | "completed" | "cancelled";

// ---- Database Row Types ----

export interface ConferenceDay {
    id: string;
    conference_id: string;
    day_number: number;
    date: string; // ISO date string
    label: string | null;
    created_at: string;
}

export interface Track {
    id: string;
    conference_id: string;
    name: string;
    room_name: string | null;
    color_code: string;
    sort_order: number;
    created_at: string;
}

export interface Session {
    id: string;
    conference_id: string;
    day_id: string;
    track_id: string;
    title: string;
    session_type: SessionType;
    mode: SessionMode;
    start_time: string; // ISO TIMESTAMPTZ
    end_time: string;
    venue: string | null;
    room: string | null;
    platform: string | null;
    meeting_link: string | null;
    timezone: string | null;
    chairperson_name: string | null;
    chairperson_email: string | null;
    coordinator_name: string | null;
    coordinator_email: string | null;
    status: SessionStatus;
    created_at: string;
    // Joined fields (optional)
    track?: Track;
    day?: ConferenceDay;
    presentations?: SessionPresentation[];
}

export interface SessionPresentation {
    id: string;
    session_id: string;
    paper_id: string;
    presentation_order: number;
    custom_start_time: string | null;
    custom_end_time: string | null;
    created_at: string;
    // Joined
    paper?: {
        id: string;
        title: string;
        authors?: string;
        status?: string;
    };
}

// ---- Form Types ----

export interface SessionFormData {
    day_id: string;
    track_id: string;
    title: string;
    session_type: SessionType;
    mode: SessionMode;
    start_time: string;
    end_time: string;
    venue?: string;
    room?: string;
    platform?: string;
    meeting_link?: string;
    timezone?: string;
    chairperson_name?: string;
    chairperson_email?: string;
    coordinator_name?: string;
    coordinator_email?: string;
    paper_ids?: string[];
}

export interface DayFormData {
    day_number: number;
    date: string;
    label?: string;
}

export interface TrackFormData {
    name: string;
    room_name?: string;
    color_code: string;
    sort_order?: number;
}

// ---- Conflict Types ----

export type ConflictType =
    | "track_time_overlap"
    | "room_conflict"
    | "chairperson_conflict"
    | "paper_duplicate";

export interface ConflictResult {
    type: ConflictType;
    message: string;
    conflicting_session_id?: string;
    conflicting_session_title?: string;
}

// ---- Export Types ----

export interface ScheduleExport {
    conference_id: string;
    exported_at: string;
    days: {
        day_number: number;
        date: string;
        label: string | null;
        tracks: {
            name: string;
            color_code: string;
            sessions: {
                title: string;
                session_type: SessionType;
                mode: SessionMode;
                start_time: string;
                end_time: string;
                venue: string | null;
                room: string | null;
                platform: string | null;
                meeting_link: string | null;
                chairperson_name: string | null;
                chairperson_email: string | null;
                coordinator_name: string | null;
                coordinator_email: string | null;
                status: SessionStatus;
                presentations: {
                    paper_title: string;
                    presentation_order: number;
                }[];
            }[];
        }[];
    }[];
}
