"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Pencil,
    Trash2,
    MapPin,
    Video,
    Clock,
    User,
} from "lucide-react";
import type { Session, Track } from "@/lib/schedule/types";
import { deleteSession } from "@/lib/schedule/actions";
import { toast } from "sonner";

interface ListViewProps {
    sessions: Session[];
    tracks: Track[];
    onEdit: (session: Session) => void;
    onRefresh: () => void;
}

const TYPE_COLORS: Record<string, string> = {
    keynote: "bg-purple-100 text-purple-700",
    technical: "bg-blue-100 text-blue-700",
    invited: "bg-teal-100 text-teal-700",
    workshop: "bg-orange-100 text-orange-700",
    ceremony: "bg-pink-100 text-pink-700",
    break: "bg-gray-100 text-gray-600",
};

const MODE_ICONS = {
    offline: MapPin,
    online: Video,
    hybrid: () => (
        <span className="flex items-center gap-0.5">
            <MapPin className="h-3 w-3" />
            <Video className="h-3 w-3" />
        </span>
    ),
};

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function ListView({
    sessions,
    tracks,
    onEdit,
    onRefresh,
}: ListViewProps) {
    // Group sessions by track
    const grouped = tracks.map((track) => ({
        track,
        sessions: sessions
            .filter((s) => s.track_id === track.id)
            .sort(
                (a, b) =>
                    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
            ),
    }));

    async function handleDelete(sessionId: string) {
        if (!confirm("Delete this session? This cannot be undone.")) return;
        try {
            await deleteSession(sessionId);
            toast.success("Session deleted");
            onRefresh();
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to delete"
            );
        }
    }

    if (sessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Clock className="h-12 w-12 mb-3 opacity-40" />
                <p className="text-lg font-medium">No sessions scheduled</p>
                <p className="text-sm">
                    Create tracks and add sessions to get started.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {grouped.map(({ track, sessions: trackSessions }) =>
                trackSessions.length === 0 ? null : (
                    <div key={track.id}>
                        {/* Track header */}
                        <div className="flex items-center gap-2 mb-3">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: track.color_code }}
                            />
                            <h3 className="font-semibold text-sm">{track.name}</h3>
                            {track.room_name && (
                                <span className="text-xs text-muted-foreground">
                                    ({track.room_name})
                                </span>
                            )}
                            <Badge variant="secondary" className="text-xs ml-auto">
                                {trackSessions.length} session(s)
                            </Badge>
                        </div>

                        {/* Sessions */}
                        <div className="space-y-2">
                            {trackSessions.map((session) => {
                                const ModeIcon =
                                    MODE_ICONS[session.mode] || MapPin;

                                return (
                                    <Card
                                        key={session.id}
                                        className="px-4 py-3 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="font-medium text-sm truncate">
                                                        {session.title}
                                                    </h4>
                                                    <Badge
                                                        className={`text-[10px] ${TYPE_COLORS[session.session_type] || ""
                                                            }`}
                                                    >
                                                        {session.session_type}
                                                    </Badge>
                                                    {session.status === "cancelled" && (
                                                        <Badge variant="destructive" className="text-[10px]">
                                                            Cancelled
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatTime(session.start_time)} –{" "}
                                                        {formatTime(session.end_time)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <ModeIcon className="h-3 w-3" />
                                                        {session.mode}
                                                    </span>
                                                    {session.venue && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" />
                                                            {session.venue}
                                                            {session.room ? ` / ${session.room}` : ""}
                                                        </span>
                                                    )}
                                                    {session.chairperson_id && (
                                                        <span className="flex items-center gap-1">
                                                            <User className="h-3 w-3" />
                                                            Chair assigned
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-1 shrink-0">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7"
                                                    onClick={() => onEdit(session)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 text-red-500 hover:text-red-700"
                                                    onClick={() => handleDelete(session.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )
            )}
        </div>
    );
}
