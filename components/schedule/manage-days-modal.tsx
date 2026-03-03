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
import type { ConferenceDay } from "@/lib/schedule/types";
import {
    createConferenceDay,
    updateConferenceDay,
    deleteConferenceDay,
} from "@/lib/schedule/actions";

interface ManageDaysModalProps {
    open: boolean;
    onClose: () => void;
    conferenceId: string;
    days: ConferenceDay[];
    onRefresh: () => void;
}

export function ManageDaysModal({
    open,
    onClose,
    conferenceId,
    days,
    onRefresh,
}: ManageDaysModalProps) {
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ day_number: "", date: "", label: "" });

    function resetForm() {
        setForm({ day_number: "", date: "", label: "" });
        setEditingId(null);
    }

    function startEdit(day: ConferenceDay) {
        setEditingId(day.id);
        setForm({
            day_number: String(day.day_number),
            date: day.date,
            label: day.label || "",
        });
    }

    async function handleSave() {
        if (!form.day_number || !form.date) {
            toast.error("Day number and date are required");
            return;
        }

        setLoading(true);
        try {
            if (editingId) {
                await updateConferenceDay(editingId, {
                    day_number: parseInt(form.day_number),
                    date: form.date,
                    label: form.label || undefined,
                });
                toast.success("Day updated");
            } else {
                await createConferenceDay(conferenceId, {
                    day_number: parseInt(form.day_number),
                    date: form.date,
                    label: form.label || undefined,
                });
                toast.success("Day added");
            }
            resetForm();
            onRefresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to save day");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(dayId: string) {
        if (!confirm("Delete this day? All sessions on this day will be removed."))
            return;

        setLoading(true);
        try {
            await deleteConferenceDay(dayId);
            toast.success("Day deleted");
            onRefresh();
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to delete day"
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Manage Conference Days</DialogTitle>
                </DialogHeader>

                {/* Existing days */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {days.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No days configured yet.
                        </p>
                    )}
                    {days.map((day) => (
                        <div
                            key={day.id}
                            className="flex items-center justify-between rounded-lg border px-3 py-2"
                        >
                            <div>
                                <span className="font-medium text-sm">Day {day.day_number}</span>
                                <span className="text-muted-foreground text-sm ml-2">
                                    {day.date}
                                </span>
                                {day.label && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                        ({day.label})
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-1">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => startEdit(day)}
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-red-500 hover:text-red-700"
                                    onClick={() => handleDelete(day.id)}
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
                        {editingId ? "Edit Day" : "Add New Day"}
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <Label className="text-xs">Day #</Label>
                            <Input
                                type="number"
                                min={1}
                                value={form.day_number}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, day_number: e.target.value }))
                                }
                                placeholder="1"
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Date</Label>
                            <Input
                                type="date"
                                value={form.date}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, date: e.target.value }))
                                }
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Label</Label>
                            <Input
                                value={form.label}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, label: e.target.value }))
                                }
                                placeholder="Opening Day"
                            />
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
                            {editingId ? "Update" : "Add Day"}
                        </Button>
                        {editingId && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetForm}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
