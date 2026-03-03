"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Track } from "@/lib/schedule/types";
import {
    createTrack,
    updateTrack,
    deleteTrack,
} from "@/lib/schedule/actions";

const PRESET_COLORS = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
    "#f97316", "#eab308", "#22c55e", "#14b8a6",
    "#06b6d4", "#3b82f6", "#64748b", "#a855f7",
];

interface ManageTracksModalProps {
    open: boolean;
    onClose: () => void;
    conferenceId: string;
    tracks: Track[];
    onRefresh: () => void;
}

export function ManageTracksModal({
    open,
    onClose,
    conferenceId,
    tracks,
    onRefresh,
}: ManageTracksModalProps) {
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: "",
        room_name: "",
        color_code: "#6366f1",
    });

    function resetForm() {
        setForm({ name: "", room_name: "", color_code: "#6366f1" });
        setEditingId(null);
    }

    function startEdit(track: Track) {
        setEditingId(track.id);
        setForm({
            name: track.name,
            room_name: track.room_name || "",
            color_code: track.color_code,
        });
    }

    async function handleSave() {
        if (!form.name.trim()) {
            toast.error("Track name is required");
            return;
        }

        setLoading(true);
        try {
            if (editingId) {
                await updateTrack(editingId, {
                    name: form.name,
                    room_name: form.room_name || undefined,
                    color_code: form.color_code,
                });
                toast.success("Track updated");
            } else {
                await createTrack(conferenceId, {
                    name: form.name,
                    room_name: form.room_name || undefined,
                    color_code: form.color_code,
                    sort_order: tracks.length,
                });
                toast.success("Track added");
            }
            resetForm();
            onRefresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to save track");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(trackId: string) {
        if (
            !confirm(
                "Delete this track? All sessions in this track will be removed."
            )
        )
            return;

        setLoading(true);
        try {
            await deleteTrack(trackId);
            toast.success("Track deleted");
            onRefresh();
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to delete track"
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Manage Tracks</DialogTitle>
                </DialogHeader>

                {/* Existing tracks */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {tracks.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No tracks configured yet.
                        </p>
                    )}
                    {tracks.map((track) => (
                        <div
                            key={track.id}
                            className="flex items-center justify-between rounded-lg border px-3 py-2"
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full shrink-0"
                                    style={{ backgroundColor: track.color_code }}
                                />
                                <span className="font-medium text-sm">{track.name}</span>
                                {track.room_name && (
                                    <span className="text-xs text-muted-foreground">
                                        ({track.room_name})
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-1">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => startEdit(track)}
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-red-500 hover:text-red-700"
                                    onClick={() => handleDelete(track.id)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add / Edit form */}
                <div className="border-t pt-4 space-y-3">
                    <p className="text-sm font-medium">
                        {editingId ? "Edit Track" : "Add New Track"}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs">Track Name</Label>
                            <Input
                                value={form.name}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, name: e.target.value }))
                                }
                                placeholder="Track A"
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Room (optional)</Label>
                            <Input
                                value={form.room_name}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, room_name: e.target.value }))
                                }
                                placeholder="Hall 1"
                            />
                        </div>
                    </div>

                    {/* Color picker */}
                    <div>
                        <Label className="text-xs">Color</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setForm((f) => ({ ...f, color_code: color }))}
                                    className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110"
                                    style={{
                                        backgroundColor: color,
                                        borderColor:
                                            form.color_code === color
                                                ? "var(--foreground)"
                                                : "transparent",
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={handleSave}
                            disabled={loading}
                            size="sm"
                            className="gap-1"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            {editingId ? "Update" : "Add Track"}
                        </Button>
                        {editingId && (
                            <Button variant="ghost" size="sm" onClick={resetForm}>
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
