"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import type { Session, Track } from "@/lib/schedule/types";

interface TrackViewProps {
    sessions: Session[];
    tracks: Track[];
    onSessionClick?: (session: Session) => void;
    onSlotClick?: (trackId: string, hour: number) => void;
    readonly?: boolean;
}

// Generate time slots from 8:00 to 20:00
function generateTimeSlots(startHour = 8, endHour = 20) {
    const slots: { hour: number; label: string }[] = [];
    for (let h = startHour; h <= endHour; h++) {
        const ampm = h >= 12 ? "PM" : "AM";
        const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
        slots.push({
            hour: h,
            label: `${displayHour}:00 ${ampm}`,
        });
    }
    return slots;
}

const SLOT_HEIGHT = 64; // px per hour

function getSessionPosition(session: Session, startHour: number) {
    const start = new Date(session.start_time);
    const end = new Date(session.end_time);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const offsetMinutes = startMinutes - startHour * 60;
    const durationMinutes = endMinutes - startMinutes;

    return {
        top: (offsetMinutes / 60) * SLOT_HEIGHT,
        height: Math.max((durationMinutes / 60) * SLOT_HEIGHT, 24),
    };
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

const TYPE_SHORT: Record<string, string> = {
    keynote: "KEY",
    technical: "TECH",
    invited: "INV",
    workshop: "WRK",
    ceremony: "CER",
    break: "BRK",
};

export function TrackView({
    sessions,
    tracks,
    onSessionClick,
    onSlotClick,
    readonly = false,
}: TrackViewProps) {
    const timeSlots = useMemo(() => generateTimeSlots(8, 20), []);
    const totalHeight = timeSlots.length * SLOT_HEIGHT;

    if (tracks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Clock className="h-12 w-12 mb-3 opacity-40" />
                <p className="text-lg font-medium">No tracks configured</p>
                <p className="text-sm">
                    Add tracks first, then create sessions.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto border rounded-xl bg-white">
            <div className="min-w-[700px]">
                {/* Header row */}
                <div className="flex border-b sticky top-0 bg-white z-10">
                    {/* Time column header */}
                    <div className="w-20 shrink-0 px-2 py-3 text-xs font-semibold text-muted-foreground border-r">
                        Time
                    </div>
                    {/* Track headers */}
                    {tracks.map((track) => (
                        <div
                            key={track.id}
                            className="flex-1 min-w-[160px] px-3 py-3 text-center border-r last:border-r-0"
                        >
                            <div className="flex items-center justify-center gap-2">
                                <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: track.color_code }}
                                />
                                <span className="font-semibold text-sm">{track.name}</span>
                            </div>
                            {track.room_name && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {track.room_name}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Grid body */}
                <div className="flex" style={{ height: totalHeight }}>
                    {/* Time column */}
                    <div className="w-20 shrink-0 relative border-r">
                        {timeSlots.map((slot) => (
                            <div
                                key={slot.hour}
                                className="absolute w-full px-2 text-[11px] text-muted-foreground"
                                style={{ top: (slot.hour - 8) * SLOT_HEIGHT }}
                            >
                                <span className="leading-none">{slot.label}</span>
                                <div className="border-t mt-1.5 mr-[-1px]" />
                            </div>
                        ))}
                    </div>

                    {/* Track columns */}
                    {tracks.map((track) => {
                        const trackSessions = sessions.filter(
                            (s) => s.track_id === track.id
                        );

                        return (
                            <div
                                key={track.id}
                                className="flex-1 min-w-[160px] relative border-r last:border-r-0"
                                onClick={(e) => {
                                    if (readonly) return;
                                    // Only fire if clicking empty space
                                    if (e.target === e.currentTarget && onSlotClick) {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const y = e.clientY - rect.top;
                                        const hour = Math.floor(y / SLOT_HEIGHT) + 8;
                                        onSlotClick(track.id, hour);
                                    }
                                }}
                            >
                                {/* Grid lines */}
                                {timeSlots.map((slot) => (
                                    <div
                                        key={slot.hour}
                                        className="absolute w-full border-t border-dashed border-gray-100"
                                        style={{ top: (slot.hour - 8) * SLOT_HEIGHT }}
                                    />
                                ))}

                                {/* Session blocks */}
                                {trackSessions.map((session) => {
                                    const pos = getSessionPosition(session, 8);

                                    return (
                                        <div
                                            key={session.id}
                                            role={readonly ? undefined : "button"}
                                            tabIndex={readonly ? undefined : 0}
                                            onClick={(e) => {
                                                if (readonly) return;
                                                e.stopPropagation();
                                                onSessionClick?.(session);
                                            }}
                                            className={`absolute left-1 right-1 rounded-md px-2 py-1 text-left transition-all
                        overflow-hidden border border-white/30 ${
                            readonly
                                ? "cursor-default"
                                : "hover:shadow-lg hover:scale-[1.02] cursor-pointer"
                        }`}
                                            style={{
                                                top: pos.top,
                                                height: pos.height,
                                                backgroundColor: track.color_code + "22",
                                                borderLeftColor: track.color_code,
                                                borderLeftWidth: 3,
                                            }}
                                        >
                                            <p className="font-medium text-[11px] leading-tight truncate">
                                                {session.title}
                                            </p>
                                            <p className="text-[9px] text-muted-foreground mt-0.5">
                                                {formatTime(session.start_time)} –{" "}
                                                {formatTime(session.end_time)}
                                            </p>
                                            {pos.height > 40 && (
                                                <Badge
                                                    className="text-[8px] mt-0.5 px-1 py-0"
                                                    variant="secondary"
                                                >
                                                    {TYPE_SHORT[session.session_type] ||
                                                        session.session_type}
                                                </Badge>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
