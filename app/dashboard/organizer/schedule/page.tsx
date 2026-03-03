"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";
import { useOrganization } from "@/lib/organizations/useOrganization";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    CalendarClock,
    Plus,
    Download,
    List,
    LayoutGrid,
    Calendar,
    Settings2,
    Layers3,
    Loader2,
} from "lucide-react";

import { ManageDaysModal } from "@/components/schedule/manage-days-modal";
import { ManageTracksModal } from "@/components/schedule/manage-tracks-modal";
import { SessionModal } from "@/components/schedule/session-modal";
import { ListView } from "@/components/schedule/list-view";
import { TrackView } from "@/components/schedule/track-view";
import { CalendarView } from "@/components/schedule/calendar-view";

import { getConferenceDays, getTracks, getSessions } from "@/lib/schedule/queries";

import type { ConferenceDay, Track, Session } from "@/lib/schedule/types";
import { toast } from "sonner";

type ViewTab = "list" | "track" | "calendar";

export default function SchedulePage() {
    const { profile } = useProfile();
    const organization = useOrganization();
    const supabase = createClient();

    // Data
    const [conferences, setConferences] = useState<
        { id: string; title: string }[]
    >([]);
    const [selectedConferenceId, setSelectedConferenceId] = useState<string>("");
    const [days, setDays] = useState<ConferenceDay[]>([]);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedDayId, setSelectedDayId] = useState<string>("");

    // UI State
    const [activeView, setActiveView] = useState<ViewTab>("list");
    const [showDaysModal, setShowDaysModal] = useState(false);
    const [showTracksModal, setShowTracksModal] = useState(false);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [editSession, setEditSession] = useState<Session | null>(null);
    const [defaultTrackId, setDefaultTrackId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    // Load conferences
    useEffect(() => {
        if (!profile) return;

        async function loadConferences() {
            const orgIds = organization ? [organization.id] : [];
            let query = supabase
                .from("conferences")
                .select("id, title")
                .order("created_at", { ascending: false });

            query = query.or(`organizer_id.eq.${profile!.id}`);
            if (orgIds.length > 0) {
                query = query.or(`organization_id.in.(${orgIds.join(",")})`);
            }

            const { data } = await query;
            setConferences(data || []);
            if (data?.length && !selectedConferenceId) {
                setSelectedConferenceId(data[0].id);
            }
            setLoading(false);
        }
        loadConferences();
    }, [profile, organization]);

    // Load schedule data when conference changes
    const loadScheduleData = useCallback(async () => {
        if (!selectedConferenceId) return;

        try {
            const [d, t, s] = await Promise.all([
                getConferenceDays(selectedConferenceId),
                getTracks(selectedConferenceId),
                getSessions(selectedConferenceId, selectedDayId || undefined),
            ]);
            setDays(d);
            setTracks(t);
            setSessions(s);

            // Auto-select first day if none selected
            if (!selectedDayId && d.length > 0) {
                setSelectedDayId(d[0].id);
            }
        } catch (err) {
            console.error("Failed to load schedule data:", err);
        }
    }, [selectedConferenceId, selectedDayId]);

    useEffect(() => {
        loadScheduleData();
    }, [loadScheduleData]);

    // Reload sessions when day changes
    useEffect(() => {
        if (!selectedConferenceId || !selectedDayId) return;

        async function reload() {
            const s = await getSessions(selectedConferenceId, selectedDayId);
            setSessions(s);
        }
        reload();
    }, [selectedDayId, selectedConferenceId]);

    function handleEditSession(session: Session) {
        setEditSession(session);
        setShowSessionModal(true);
    }

    function handleTrackSlotClick(trackId: string, _hour: number) {
        setDefaultTrackId(trackId);
        setEditSession(null);
        setShowSessionModal(true);
    }

    async function handleExport() {
        setExporting(true);
        try {
            const res = await fetch(
                `/api/export-schedule-pdf?conferenceId=${selectedConferenceId}`
            );
            if (!res.ok) throw new Error("Export failed");

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;

            // Extract filename from Content-Disposition header or use fallback
            const disposition = res.headers.get("Content-Disposition");
            const match = disposition?.match(/filename="(.+)"/);
            a.download = match?.[1] || "Schedule.pdf";

            a.click();
            URL.revokeObjectURL(url);
            toast.success("Schedule PDF exported successfully");
        } catch {
            toast.error("Failed to export schedule PDF");
        } finally {
            setExporting(false);
        }
    }

    const filteredSessions = selectedDayId
        ? sessions.filter((s) => s.day_id === selectedDayId)
        : sessions;

    const VIEW_TABS: { key: ViewTab; label: string; icon: React.ReactNode }[] = [
        { key: "list", label: "List View", icon: <List className="h-3.5 w-3.5" /> },
        { key: "track", label: "Track View", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
        { key: "calendar", label: "Calendar", icon: <Calendar className="h-3.5 w-3.5" /> },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-muted-foreground">
                    Loading schedule...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <CalendarClock className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage your conference schedule with multi-track support
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        disabled={!selectedConferenceId || sessions.length === 0 || exporting}
                        className="gap-1.5"
                    >
                        {exporting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Download className="h-3.5 w-3.5" />
                        )}
                        {exporting ? "Exporting..." : "Export PDF"}
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => {
                            setEditSession(null);
                            setDefaultTrackId("");
                            setShowSessionModal(true);
                        }}
                        disabled={
                            !selectedConferenceId || days.length === 0 || tracks.length === 0
                        }
                        className="gap-1.5"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add Session
                    </Button>
                </div>
            </div>

            {/* Conference Selector */}
            {conferences.length > 1 && (
                <Card className="p-3">
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                            Conference:
                        </label>
                        <Select
                            value={selectedConferenceId}
                            onValueChange={(v) => {
                                setSelectedConferenceId(v);
                                setSelectedDayId("");
                            }}
                        >
                            <SelectTrigger className="max-w-md">
                                <SelectValue placeholder="Select conference" />
                            </SelectTrigger>
                            <SelectContent>
                                {conferences.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </Card>
            )}

            {!selectedConferenceId ? (
                <Card className="p-12 text-center text-muted-foreground">
                    <CalendarClock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No conference selected</p>
                    <p className="text-sm mt-1">
                        Create a conference first, then manage its schedule here.
                    </p>
                </Card>
            ) : (
                <>
                    {/* Day Tabs + Management Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Day tabs */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                            <button
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${!selectedDayId
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
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${selectedDayId === day.id
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

                        {/* Management buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-xs"
                                onClick={() => setShowDaysModal(true)}
                            >
                                <Settings2 className="h-3 w-3" />
                                Days
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-xs"
                                onClick={() => setShowTracksModal(true)}
                            >
                                <Layers3 className="h-3 w-3" />
                                Tracks
                            </Button>
                        </div>
                    </div>

                    {/* Setup prompts */}
                    {days.length === 0 && (
                        <Card className="p-8 text-center border-dashed border-2">
                            <Settings2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                            <p className="font-medium">Set up conference days first</p>
                            <p className="text-sm text-muted-foreground mt-1 mb-3">
                                Add the days of your conference to start building the schedule.
                            </p>
                            <Button
                                size="sm"
                                onClick={() => setShowDaysModal(true)}
                                className="gap-1.5"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Manage Days
                            </Button>
                        </Card>
                    )}

                    {days.length > 0 && tracks.length === 0 && (
                        <Card className="p-8 text-center border-dashed border-2">
                            <Layers3 className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                            <p className="font-medium">Set up tracks</p>
                            <p className="text-sm text-muted-foreground mt-1 mb-3">
                                Add tracks (e.g., Track A, Hall 1) to organize parallel sessions.
                            </p>
                            <Button
                                size="sm"
                                onClick={() => setShowTracksModal(true)}
                                className="gap-1.5"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Manage Tracks
                            </Button>
                        </Card>
                    )}

                    {/* View tabs + content */}
                    {days.length > 0 && tracks.length > 0 && (
                        <>
                            <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 w-fit">
                                {VIEW_TABS.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveView(tab.key)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${activeView === tab.key
                                            ? "bg-white shadow-sm text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </button>
                                ))}

                                {/* Stats badge */}
                                <Badge
                                    variant="secondary"
                                    className="ml-2 text-xs"
                                >
                                    {filteredSessions.length} session(s)
                                </Badge>
                            </div>

                            {/* View content */}
                            <div>
                                {activeView === "list" && (
                                    <ListView
                                        sessions={filteredSessions}
                                        tracks={tracks}
                                        onEdit={handleEditSession}
                                        onRefresh={loadScheduleData}
                                    />
                                )}
                                {activeView === "track" && (
                                    <TrackView
                                        sessions={filteredSessions}
                                        tracks={tracks}
                                        onSessionClick={handleEditSession}
                                        onSlotClick={handleTrackSlotClick}
                                    />
                                )}
                                {activeView === "calendar" && <CalendarView />}
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Modals */}
            <ManageDaysModal
                open={showDaysModal}
                onClose={() => setShowDaysModal(false)}
                conferenceId={selectedConferenceId}
                days={days}
                onRefresh={loadScheduleData}
            />
            <ManageTracksModal
                open={showTracksModal}
                onClose={() => setShowTracksModal(false)}
                conferenceId={selectedConferenceId}
                tracks={tracks}
                onRefresh={loadScheduleData}
            />
            <SessionModal
                open={showSessionModal}
                onClose={() => {
                    setShowSessionModal(false);
                    setEditSession(null);
                    setDefaultTrackId("");
                }}
                conferenceId={selectedConferenceId}
                days={days}
                tracks={tracks}
                editSession={editSession}
                defaultDayId={selectedDayId}
                defaultTrackId={defaultTrackId}
                onRefresh={loadScheduleData}
            />
        </div>
    );
}
