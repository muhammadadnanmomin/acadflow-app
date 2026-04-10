"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { getConferenceDays, getTracks, getSessions } from "@/lib/schedule/queries";
import type { ConferenceDay, Track, Session } from "@/lib/schedule/types";

import { ListView } from "@/components/schedule/list-view";
import { TrackView } from "@/components/schedule/track-view";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    CalendarClock,
    List,
    LayoutGrid,
    ArrowLeft,
    ShieldAlert,
    CalendarX,
    Loader2,
} from "lucide-react";

type ViewTab = "list" | "track";

export default function ParticipantSchedulePage() {
    const params = useParams();
    const router = useRouter();
    const { profile, loading: profileLoading } = useProfile();
    const supabase = createClient();

    const conferenceId = params.id as string;

    // Access control state
    const [accessChecked, setAccessChecked] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);

    // Conference info
    const [conferenceTitle, setConferenceTitle] = useState("");

    // Schedule data
    const [days, setDays] = useState<ConferenceDay[]>([]);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedDayId, setSelectedDayId] = useState<string>("");

    // UI
    const [activeView, setActiveView] = useState<ViewTab>("list");
    const [loading, setLoading] = useState(true);

    // ── 1. Check registration access ──
    useEffect(() => {
        if (!profile || !conferenceId) return;

        async function checkAccess() {
            // Check if user is registered for this conference
            const { data, error } = await supabase
                .from("conference_registrations")
                .select("id")
                .eq("conference_id", conferenceId)
                .eq("user_id", profile!.id)
                .single();

            if (error || !data) {
                setHasAccess(false);
            } else {
                setHasAccess(true);
            }

            // Also fetch conference title
            const { data: conf } = await supabase
                .from("conferences")
                .select("title")
                .eq("id", conferenceId)
                .single();

            if (conf) setConferenceTitle(conf.title);

            setAccessChecked(true);
        }

        checkAccess();
    }, [profile, conferenceId]);

    // ── 2. Load schedule data (only if access granted) ──
    const loadScheduleData = useCallback(async () => {
        if (!conferenceId || !hasAccess) return;

        try {
            setLoading(true);
            const [d, t, s] = await Promise.all([
                getConferenceDays(conferenceId),
                getTracks(conferenceId),
                getSessions(conferenceId, selectedDayId || undefined),
            ]);
            setDays(d);
            setTracks(t);
            setSessions(s);

            // Auto-select first day
            if (!selectedDayId && d.length > 0) {
                setSelectedDayId(d[0].id);
            }
        } catch (err) {
            console.error("Failed to load schedule:", err);
        } finally {
            setLoading(false);
        }
    }, [conferenceId, hasAccess, selectedDayId]);

    useEffect(() => {
        if (accessChecked && hasAccess) {
            loadScheduleData();
        }
    }, [accessChecked, hasAccess, loadScheduleData]);

    // Reload sessions when day changes
    useEffect(() => {
        if (!conferenceId || !selectedDayId || !hasAccess) return;

        async function reload() {
            const s = await getSessions(conferenceId, selectedDayId);
            setSessions(s);
        }
        reload();
    }, [selectedDayId, conferenceId, hasAccess]);

    const filteredSessions = selectedDayId
        ? sessions.filter((s) => s.day_id === selectedDayId)
        : sessions;

    const VIEW_TABS: { key: ViewTab; label: string; icon: React.ReactNode }[] = [
        { key: "list", label: "List View", icon: <List className="h-3.5 w-3.5" /> },
        { key: "track", label: "Track View", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
    ];

    // ── Loading state ──
    if (profileLoading || !accessChecked) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Checking access...</span>
                </div>
            </div>
        );
    }

    // ── Access denied ──
    if (!hasAccess) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="max-w-md w-full p-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                        <ShieldAlert className="h-8 w-8 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                        Access Restricted
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">
                        You are not registered for this conference. Only registered
                        participants can view the schedule.
                    </p>
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => router.push("/dashboard/participant")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Go Back to Dashboard
                    </Button>
                </Card>
            </div>
        );
    }

    // ── Schedule not published (no days/tracks) ──
    const scheduleEmpty = days.length === 0 || tracks.length === 0;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <CalendarClock className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            Schedule
                        </h1>
                        {conferenceTitle && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {conferenceTitle}
                            </p>
                        )}
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground"
                    onClick={() => router.push("/dashboard/participant/conferences")}
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Conferences
                </Button>
            </div>

            {/* Empty schedule state */}
            {scheduleEmpty && !loading && (
                <Card className="p-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                        <CalendarX className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        Schedule has not been published yet.
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                        The conference organizer hasn&apos;t published the schedule yet.
                        Please check back later.
                    </p>
                </Card>
            )}

            {/* Loading schedule data */}
            {loading && !scheduleEmpty && (
                <div className="flex items-center justify-center h-40">
                    <div className="flex items-center gap-3 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading schedule...</span>
                    </div>
                </div>
            )}

            {/* Schedule content */}
            {!scheduleEmpty && !loading && (
                <>
                    {/* Day Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        <button
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                                !selectedDayId
                                    ? "bg-indigo-100 text-indigo-700"
                                    : "text-muted-foreground hover:bg-gray-100"
                            }`}
                            onClick={() => setSelectedDayId("")}
                        >
                            All Days
                        </button>
                        {days.map((day) => (
                            <button
                                key={day.id}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                                    selectedDayId === day.id
                                        ? "bg-indigo-100 text-indigo-700"
                                        : "text-muted-foreground hover:bg-gray-100"
                                }`}
                                onClick={() => setSelectedDayId(day.id)}
                            >
                                Day {day.day_number}
                                {day.label && (
                                    <span className="ml-1 text-xs opacity-70">
                                        {day.label}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* View Toggle + Stats */}
                    <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 w-fit">
                        {VIEW_TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveView(tab.key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                                    activeView === tab.key
                                        ? "bg-white shadow-sm text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}

                        <Badge variant="secondary" className="ml-2 text-xs">
                            {filteredSessions.length} session(s)
                        </Badge>
                    </div>

                    {/* Schedule Display */}
                    <div>
                        {activeView === "list" && (
                            <ListView
                                sessions={filteredSessions}
                                tracks={tracks}
                                readonly
                            />
                        )}
                        {activeView === "track" && (
                            <TrackView
                                sessions={filteredSessions}
                                tracks={tracks}
                                readonly
                            />
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
