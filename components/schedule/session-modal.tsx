"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type {
    ConferenceDay,
    Track,
    Session,
    SessionFormData,
    ConflictResult,
} from "@/lib/schedule/types";
import { createSession, updateSession } from "@/lib/schedule/actions";
import { detectAllConflicts } from "@/lib/schedule/conflicts";
import {
    getAcceptedPapers,
    getConferenceMembers,
} from "@/lib/schedule/queries";

interface SessionModalProps {
    open: boolean;
    onClose: () => void;
    conferenceId: string;
    days: ConferenceDay[];
    tracks: Track[];
    editSession?: Session | null;
    defaultDayId?: string;
    defaultTrackId?: string;
    onRefresh: () => void;
}

const SESSION_TYPES = [
    { value: "keynote", label: "Keynote" },
    { value: "technical", label: "Technical" },
    { value: "invited", label: "Invited" },
    { value: "workshop", label: "Workshop" },
    { value: "ceremony", label: "Ceremony" },
    { value: "break", label: "Break" },
] as const;

const MODES = [
    { value: "offline", label: "Offline" },
    { value: "online", label: "Online" },
    { value: "hybrid", label: "Hybrid" },
] as const;

const TIMEZONES = [
    "Asia/Kolkata",
    "America/New_York",
    "America/Chicago",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Asia/Dubai",
    "Australia/Sydney",
    "UTC",
];

export function SessionModal({
    open,
    onClose,
    conferenceId,
    days,
    tracks,
    editSession,
    defaultDayId,
    defaultTrackId,
    onRefresh,
}: SessionModalProps) {
    const isEdit = !!editSession;

    const [loading, setLoading] = useState(false);
    const [conflicts, setConflicts] = useState<ConflictResult[]>([]);
    const [papers, setPapers] = useState<{ id: string; title: string }[]>([]);
    const [members, setMembers] = useState<
        { user_id: string; profiles: { id: string; full_name: string; email: string } }[]
    >([]);

    const [form, setForm] = useState<SessionFormData>({
        day_id: "",
        track_id: "",
        title: "",
        session_type: "technical",
        mode: "offline",
        start_time: "",
        end_time: "",
        venue: "",
        room: "",
        platform: "",
        meeting_link: "",
        timezone: "",
        chairperson_id: "",
        coordinator_id: "",
        paper_ids: [],
    });

    // Load papers and members on open
    useEffect(() => {
        if (!open) return;

        async function loadData() {
            try {
                const [p, m] = await Promise.all([
                    getAcceptedPapers(conferenceId),
                    getConferenceMembers(conferenceId),
                ]);
                setPapers(p);
                setMembers(m);
            } catch {
                // Silent - these are optional
            }
        }
        loadData();

        // Set defaults
        if (editSession) {
            setForm({
                day_id: editSession.day_id,
                track_id: editSession.track_id,
                title: editSession.title,
                session_type: editSession.session_type,
                mode: editSession.mode,
                start_time: editSession.start_time.slice(0, 16),
                end_time: editSession.end_time.slice(0, 16),
                venue: editSession.venue || "",
                room: editSession.room || "",
                platform: editSession.platform || "",
                meeting_link: editSession.meeting_link || "",
                timezone: editSession.timezone || "",
                chairperson_id: editSession.chairperson_id || "",
                coordinator_id: editSession.coordinator_id || "",
                paper_ids: editSession.presentations?.map((p) => p.paper_id) || [],
            });
        } else {
            setForm({
                day_id: defaultDayId || days[0]?.id || "",
                track_id: defaultTrackId || tracks[0]?.id || "",
                title: "",
                session_type: "technical",
                mode: "offline",
                start_time: "",
                end_time: "",
                venue: "",
                room: "",
                platform: "",
                meeting_link: "",
                timezone: "",
                chairperson_id: "",
                coordinator_id: "",
                paper_ids: [],
            });
        }
        setConflicts([]);
    }, [open, editSession, conferenceId, defaultDayId, defaultTrackId, days, tracks]);

    function updateField<K extends keyof SessionFormData>(
        key: K,
        value: SessionFormData[K]
    ) {
        setForm((f) => ({ ...f, [key]: value }));
    }

    function togglePaper(paperId: string) {
        setForm((f) => ({
            ...f,
            paper_ids: f.paper_ids?.includes(paperId)
                ? f.paper_ids.filter((id) => id !== paperId)
                : [...(f.paper_ids || []), paperId],
        }));
    }

    async function handleCheckConflicts() {
        try {
            const results = await detectAllConflicts(
                conferenceId,
                form,
                editSession?.id
            );
            setConflicts(results);
            return results;
        } catch {
            return [];
        }
    }

    async function handleSubmit() {
        if (!form.title || !form.day_id || !form.track_id || !form.start_time || !form.end_time) {
            toast.error("Please fill all required fields");
            return;
        }

        setLoading(true);
        try {
            const conflictResults = await handleCheckConflicts();
            if (conflictResults.length > 0) {
                setLoading(false);
                toast.warning("Conflicts detected — review before saving");
                return;
            }

            if (isEdit) {
                await updateSession(editSession.id, form);
                toast.success("Session updated");
            } else {
                await createSession(conferenceId, form);
                toast.success("Session created");
            }

            // Send notifications (fire and forget)
            try {
                const day = days.find((d) => d.id === form.day_id);
                const sessionPapers = papers.filter((p) =>
                    form.paper_ids?.includes(p.id)
                );

                if (sessionPapers.length || form.chairperson_id) {
                    const speakers = sessionPapers
                        .map((paper) => {
                            // We don't have speaker info per paper here, so skip detailed speaker emails
                            return null;
                        })
                        .filter(Boolean);

                    const chairperson = form.chairperson_id
                        ? members.find((m) => m.user_id === form.chairperson_id)
                        : null;

                    await fetch("/api/send-schedule-notification", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            conference: "Conference",
                            session_title: form.title,
                            datetime: `${day?.date || ""} ${form.start_time}`,
                            mode: form.mode,
                            venue: form.venue,
                            meeting_link: form.meeting_link,
                            speakers: speakers,
                            chairperson: chairperson
                                ? {
                                    name: chairperson.profiles.full_name,
                                    email: chairperson.profiles.email,
                                }
                                : undefined,
                        }),
                    });
                }
            } catch {
                // Notification failure shouldn't block session creation
            }

            onRefresh();
            onClose();
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to save session"
            );
        } finally {
            setLoading(false);
        }
    }

    const showOfflineFields = form.mode === "offline" || form.mode === "hybrid";
    const showOnlineFields = form.mode === "online" || form.mode === "hybrid";

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Edit Session" : "Create New Session"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Conflict warnings */}
                    {conflicts.length > 0 && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1">
                            <div className="flex items-center gap-2 text-amber-700 font-medium text-sm">
                                <AlertTriangle className="h-4 w-4" />
                                {conflicts.length} conflict(s) detected
                            </div>
                            {conflicts.map((c, i) => (
                                <p key={i} className="text-xs text-amber-600 ml-6">
                                    • {c.message}
                                </p>
                            ))}
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 ml-6 text-xs"
                                onClick={() => {
                                    setConflicts([]);
                                    handleSubmit();
                                }}
                            >
                                Save Anyway
                            </Button>
                        </div>
                    )}

                    {/* Row 1: Day + Track */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs font-medium">Day *</Label>
                            <Select
                                value={form.day_id}
                                onValueChange={(v) => updateField("day_id", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select day" />
                                </SelectTrigger>
                                <SelectContent>
                                    {days.map((d) => (
                                        <SelectItem key={d.id} value={d.id}>
                                            Day {d.day_number} — {d.date}
                                            {d.label ? ` (${d.label})` : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs font-medium">Track *</Label>
                            <Select
                                value={form.track_id}
                                onValueChange={(v) => updateField("track_id", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select track" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tracks.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>
                                            <span className="flex items-center gap-2">
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full inline-block"
                                                    style={{ backgroundColor: t.color_code }}
                                                />
                                                {t.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Row 2: Title */}
                    <div>
                        <Label className="text-xs font-medium">Session Title *</Label>
                        <Input
                            value={form.title}
                            onChange={(e) => updateField("title", e.target.value)}
                            placeholder="Enter session title"
                        />
                    </div>

                    {/* Row 3: Session Type + Mode */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs font-medium">Session Type *</Label>
                            <Select
                                value={form.session_type}
                                onValueChange={(v) =>
                                    updateField("session_type", v as SessionFormData["session_type"])
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SESSION_TYPES.map((st) => (
                                        <SelectItem key={st.value} value={st.value}>
                                            {st.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs font-medium">Mode *</Label>
                            <Select
                                value={form.mode}
                                onValueChange={(v) =>
                                    updateField("mode", v as SessionFormData["mode"])
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {MODES.map((m) => (
                                        <SelectItem key={m.value} value={m.value}>
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Row 4: Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs font-medium">Start Time *</Label>
                            <Input
                                type="datetime-local"
                                value={form.start_time}
                                onChange={(e) => updateField("start_time", e.target.value)}
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-medium">End Time *</Label>
                            <Input
                                type="datetime-local"
                                value={form.end_time}
                                onChange={(e) => updateField("end_time", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Dynamic: Offline fields */}
                    {showOfflineFields && (
                        <div className="grid grid-cols-2 gap-4 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                            <div>
                                <Label className="text-xs font-medium">Venue *</Label>
                                <Input
                                    value={form.venue}
                                    onChange={(e) => updateField("venue", e.target.value)}
                                    placeholder="Conference Center"
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-medium">Room *</Label>
                                <Input
                                    value={form.room}
                                    onChange={(e) => updateField("room", e.target.value)}
                                    placeholder="Hall A"
                                />
                            </div>
                        </div>
                    )}

                    {/* Dynamic: Online fields */}
                    {showOnlineFields && (
                        <div className="space-y-3 rounded-lg border border-green-100 bg-green-50/50 p-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs font-medium">Meeting Link *</Label>
                                    <Input
                                        value={form.meeting_link}
                                        onChange={(e) =>
                                            updateField("meeting_link", e.target.value)
                                        }
                                        placeholder="https://zoom.us/j/..."
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-medium">Platform</Label>
                                    <Input
                                        value={form.platform}
                                        onChange={(e) => updateField("platform", e.target.value)}
                                        placeholder="Zoom / Teams / Meet"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs font-medium">Timezone *</Label>
                                <Select
                                    value={form.timezone}
                                    onValueChange={(v) => updateField("timezone", v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select timezone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIMEZONES.map((tz) => (
                                            <SelectItem key={tz} value={tz}>
                                                {tz}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* Chairperson + Coordinator */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs font-medium">Chairperson</Label>
                            <Select
                                value={form.chairperson_id || "none"}
                                onValueChange={(v) =>
                                    updateField("chairperson_id", v === "none" ? "" : v)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select chairperson" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {members.map((m) => (
                                        <SelectItem key={m.user_id} value={m.user_id}>
                                            {m.profiles.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs font-medium">Coordinator</Label>
                            <Select
                                value={form.coordinator_id || "none"}
                                onValueChange={(v) =>
                                    updateField("coordinator_id", v === "none" ? "" : v)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select coordinator" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {members.map((m) => (
                                        <SelectItem key={m.user_id} value={m.user_id}>
                                            {m.profiles.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Papers */}
                    {papers.length > 0 && (
                        <div>
                            <Label className="text-xs font-medium">
                                Assign Papers ({form.paper_ids?.length || 0} selected)
                            </Label>
                            <div className="mt-2 max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1">
                                {papers.map((paper) => {
                                    const selected = form.paper_ids?.includes(paper.id);
                                    return (
                                        <button
                                            key={paper.id}
                                            type="button"
                                            onClick={() => togglePaper(paper.id)}
                                            className={`w-full text-left text-sm px-2 py-1.5 rounded transition ${selected
                                                    ? "bg-indigo-50 text-indigo-700 font-medium"
                                                    : "hover:bg-gray-50"
                                                }`}
                                        >
                                            <span className="mr-2">{selected ? "✓" : "○"}</span>
                                            {paper.title}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleCheckConflicts}
                            disabled={loading}
                        >
                            Check Conflicts
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                            {isEdit ? "Update Session" : "Create Session"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
