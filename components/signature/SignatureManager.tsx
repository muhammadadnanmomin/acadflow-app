"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import SignaturePad from "./SignaturePad";
import { uploadSignature, deleteSignatureByUrl } from "@/lib/signature/uploadSignature";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  PenLine,
  AlertTriangle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface SignatureRecord {
  name?: string;
  role: string;
  image_url: string;
  type: "drawn" | "uploaded";
}

interface SignatureManagerProps {
  conferenceId: string;
}

const MIN_REQUIRED = 2;
const MAX_ALLOWED = 3;

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function SignatureManager({ conferenceId }: SignatureManagerProps) {
  const [signatures, setSignatures] = useState<SignatureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Stores the drawn data URL before upload
  const drawnDataUrlRef = useRef<string | null>(null);

  /* ---------------------------------------------------------------- */
  /*  Load                                                             */
  /* ---------------------------------------------------------------- */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/organizer/signatures/${conferenceId}`);
      const json = await res.json();
      setSignatures(json.signatures ?? []);
    } catch {
      toast.error("Failed to load signatures");
    } finally {
      setLoading(false);
    }
  }, [conferenceId]);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------------------------------------------------------------- */
  /*  Open dialog helpers                                              */
  /* ---------------------------------------------------------------- */
  function openAdd() {
    setEditIndex(null);
    setName("");
    setRole("");
    setFormError(null);
    drawnDataUrlRef.current = null;
    setDialogOpen(true);
  }

  function openEdit(index: number) {
    const sig = signatures[index];
    setEditIndex(index);
    setName(sig.name ?? "");
    setRole(sig.role);
    setFormError(null);
    drawnDataUrlRef.current = null;
    setDialogOpen(true);
  }

  /* ---------------------------------------------------------------- */
  /*  SignaturePad callback                                            */
  /* ---------------------------------------------------------------- */
  function handlePadSave(dataUrl: string) {
    drawnDataUrlRef.current = dataUrl;
    setFormError(null);
  }

  /* ---------------------------------------------------------------- */
  /*  Save (Add or Edit)                                              */
  /* ---------------------------------------------------------------- */
  async function handleSave() {
    setFormError(null);

    if (!role.trim()) {
      setFormError("Role is required.");
      return;
    }

    const isEdit = editIndex !== null;

    // On add: a drawing is mandatory. On edit: pad is optional (keep old image).
    if (!isEdit && !drawnDataUrlRef.current) {
      setFormError("Please draw a signature before saving.");
      return;
    }

    setUploading(true);
    try {
      let image_url: string;
      const slotIndex = isEdit ? editIndex! : signatures.length;

      if (drawnDataUrlRef.current) {
        // Determine old path to delete (for cache-busting on edit)
        const oldUrl = isEdit ? signatures[editIndex!].image_url : undefined;
        const oldPath = oldUrl ? extractStoragePath(oldUrl) : undefined;

        image_url = await uploadSignature(
          conferenceId,
          drawnDataUrlRef.current,
          slotIndex,
          oldPath
        );
      } else {
        // Edit without redrawing — keep existing URL
        image_url = signatures[editIndex!].image_url;
      }

      const endpoint = `/api/organizer/signatures/${conferenceId}`;
      const method = isEdit ? "PATCH" : "POST";
      const body = isEdit
        ? { index: editIndex, name: name.trim() || undefined, role: role.trim(), image_url, type: "drawn" }
        : { name: name.trim() || undefined, role: role.trim(), image_url, type: "drawn" };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Failed to save signature");
      }

      const json = await res.json();
      setSignatures(json.signatures);
      setDialogOpen(false);
      toast.success(isEdit ? "Signature updated successfully" : "Signature saved successfully");
    } catch (err: any) {
      setFormError(err.message ?? "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Delete                                                           */
  /* ---------------------------------------------------------------- */
  async function handleDelete(index: number) {
    const sig = signatures[index];
    if (!confirm(`Delete the "${sig.role}" signature? This cannot be undone.`)) return;

    // Best-effort cleanup from storage
    deleteSignatureByUrl(sig.image_url);

    try {
      const res = await fetch(`/api/organizer/signatures/${conferenceId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSignatures(json.signatures);
      toast.success("Signature removed");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete signature");
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading signatures…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-sm text-gray-600">
            {signatures.length} / {MAX_ALLOWED} signatures configured
            {signatures.length < MIN_REQUIRED && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600 text-xs font-medium">
                <AlertTriangle className="h-3 w-3" />
                At least {MIN_REQUIRED} required for PDF certificates
              </span>
            )}
          </p>
        </div>

        <Button
          size="sm"
          onClick={openAdd}
          disabled={signatures.length >= MAX_ALLOWED}
          className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Signature
        </Button>
      </div>

      {/* Signature cards */}
      {signatures.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
            <PenLine className="h-5 w-5 text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">No signatures yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Add at least {MIN_REQUIRED} signatures to enable dynamic PDF signing.
          </p>
          <Button
            size="sm"
            className="mt-4 gap-1.5 bg-indigo-600 hover:bg-indigo-700"
            onClick={openAdd}
          >
            <Plus className="h-3.5 w-3.5" />
            Add First Signature
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {signatures.map((sig, i) => (
            <Card key={i} className="p-4 space-y-3">
              {/* Signature image */}
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-2 flex items-center justify-center h-16 overflow-hidden">
                <img
                  src={sig.image_url}
                  alt={`${sig.role} signature`}
                  className="max-h-full max-w-full object-contain"
                  style={{ imageRendering: "crisp-edges" }}
                />
              </div>

              {/* Meta */}
              <div>
                {sig.name && (
                  <p className="text-sm font-semibold text-gray-900 truncate">{sig.name}</p>
                )}
                <p className="text-xs text-gray-500">{sig.role}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-0.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1 h-7 text-xs"
                  onClick={() => openEdit(i)}
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1 h-7 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  onClick={() => handleDelete(i)}
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => !uploading && setDialogOpen(v)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editIndex !== null ? "Edit Signature" : "Add Signature"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="sig-name" className="text-sm">
                Name <span className="text-gray-400">(optional)</span>
              </Label>
              <Input
                id="sig-name"
                placeholder="e.g. Dr. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={uploading}
              />
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label htmlFor="sig-role" className="text-sm">
                Role <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sig-role"
                placeholder="e.g. Convener, Principal, Director"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={uploading}
              />
            </div>

            {/* Signature Pad */}
            <div className="space-y-1.5">
              <Label className="text-sm">
                {editIndex !== null
                  ? "Redraw Signature (leave blank to keep existing)"
                  : "Draw Signature"}
                {editIndex === null && <span className="text-red-500 ml-1">*</span>}
              </Label>

              {/* Show existing on edit */}
              {editIndex !== null && signatures[editIndex] && !drawnDataUrlRef.current && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 mb-2 flex items-center gap-3">
                  <img
                    src={signatures[editIndex].image_url}
                    alt="Current signature"
                    className="h-10 object-contain"
                    style={{ maxWidth: 160 }}
                  />
                  <p className="text-xs text-gray-400">Current — draw below to replace</p>
                </div>
              )}

              <SignaturePad
                onSave={handlePadSave}
                onClear={() => { drawnDataUrlRef.current = null; }}
                disabled={uploading}
              />
            </div>

            {/* Form-level error */}
            {formError && (
              <p className="text-sm text-red-600 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {formError}
              </p>
            )}

            {/* Submit */}
            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleSave}
                disabled={uploading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                {uploading ? "Uploading…" : editIndex !== null ? "Update Signature" : "Save Signature"}
              </Button>

              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper — extract Supabase storage path from public URL            */
/* ------------------------------------------------------------------ */
function extractStoragePath(url: string): string | undefined {
  const marker = "/object/public/signatures/";
  const idx = url.indexOf(marker);
  if (idx === -1) return undefined;
  return url.slice(idx + marker.length);
}
