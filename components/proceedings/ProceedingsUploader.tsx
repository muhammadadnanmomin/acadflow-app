"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react";

interface Props {
  conferenceId: string;
  /** Called after a successful upload */
  onUploaded?: () => void;
  /** Existing proceedings info (if replacing) */
  existingTitle?: string;
}

export default function ProceedingsUploader({
  conferenceId,
  onUploaded,
  existingTitle,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState(existingTitle || "");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);

  function handleFileChoice(f: File | null) {
    if (!f) return;
    if (f.type !== "application/pdf") {
      setErrorMsg("Only PDF files are allowed.");
      setStatus("error");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setErrorMsg("File must be under 50 MB.");
      setStatus("error");
      return;
    }
    setFile(f);
    setStatus("idle");
    setErrorMsg("");
    if (!title) setTitle(f.name.replace(/\.pdf$/i, ""));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    handleFileChoice(f || null);
  }

  async function handleUpload() {
    if (!file || !title.trim()) return;
    setUploading(true);
    setStatus("idle");
    setErrorMsg("");

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("conferenceId", conferenceId);
      fd.append("title", title.trim());
      if (description.trim()) fd.append("description", description.trim());

      const res = await fetch("/api/proceedings/upload", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error || "Upload failed");
        setStatus("error");
        return;
      }

      setStatus("success");
      onUploaded?.();
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Upload className="h-5 w-5 text-indigo-600" />
        {existingTitle ? "Replace Proceedings" : "Upload Proceedings"}
      </h3>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragOver
            ? "border-indigo-400 bg-indigo-50"
            : file
              ? "border-green-300 bg-green-50"
              : "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => handleFileChoice(e.target.files?.[0] || null)}
        />

        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="h-8 w-8 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900 text-sm">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="ml-2 p-1 rounded hover:bg-gray-200"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              Drag & drop a PDF here, or <span className="text-indigo-600 font-medium">browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF, max 50 MB</p>
          </>
        )}
      </div>

      {/* Title */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. ICML 2026 Conference Proceedings"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
        />
      </div>

      {/* Description */}
      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description..."
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
        />
      </div>

      {/* Status */}
      {status === "error" && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {status === "success" && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Proceedings uploaded and published successfully!
        </div>
      )}

      {/* Upload button */}
      <Button
        onClick={handleUpload}
        disabled={!file || !title.trim() || uploading}
        className="mt-4 w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
      >
        {uploading ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Uploading…
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            {existingTitle ? "Replace & Publish" : "Upload & Publish"}
          </>
        )}
      </Button>
    </Card>
  );
}
