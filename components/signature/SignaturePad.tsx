"use client";

import React, { useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { RotateCcw, Save, Eraser } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface SignaturePadHandle {
  clear: () => void;
  isEmpty: () => boolean;
  getDataUrl: () => string | null;
}

interface SignaturePadProps {
  /** Called with trimmed high-res PNG data URL on successful save */
  onSave: (dataUrl: string) => void;
  /** Optional callback when canvas is cleared */
  onClear?: () => void;
  /** Whether to disable all controls (e.g. while parent is uploading) */
  disabled?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ onSave, onClear, disabled = false }, ref) => {
    const sigRef = useRef<SignatureCanvas>(null);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [hasDrawn, setHasDrawn] = useState(false);

    /* Expose imperative handle */
    useImperativeHandle(ref, () => ({
      clear: handleClear,
      isEmpty: () => sigRef.current?.isEmpty() ?? true,
      getDataUrl: () =>
        sigRef.current && !sigRef.current.isEmpty()
          ? sigRef.current.getTrimmedCanvas().toDataURL("image/png")
          : null,
    }));

    const handleClear = useCallback(() => {
      sigRef.current?.clear();
      setError(null);
      setPreview(null);
      setHasDrawn(false);
      onClear?.();
    }, [onClear]);

    const handleEndStroke = useCallback(() => {
      if (!sigRef.current || sigRef.current.isEmpty()) return;
      setHasDrawn(true);
      setError(null);
      // Instant preview
      const url = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
      setPreview(url);
    }, []);

    const handleSave = useCallback(() => {
      if (!sigRef.current || sigRef.current.isEmpty()) {
        setError("Signature cannot be empty. Please draw your signature first.");
        return;
      }
      setError(null);
      const url = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
      onSave(url);
    }, [onSave]);

    return (
      <div className="space-y-3">
        {/* Canvas */}
        <div
          className={`relative rounded-xl border-2 overflow-hidden bg-white transition-colors ${
            error
              ? "border-red-400 shadow-sm shadow-red-100"
              : "border-gray-300 shadow-sm"
          } ${disabled ? "opacity-60 pointer-events-none" : ""}`}
        >
          {/* Hint text (disappears after drawing) */}
          {!hasDrawn && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-300 pointer-events-none select-none">
              Draw signature here
            </p>
          )}

          <SignatureCanvas
            ref={sigRef}
            penColor="#1a1a2e"
            canvasProps={{
              width: 560,
              height: 160,
              className: "w-full h-full touch-none",
              style: { display: "block" },
            }}
            onEnd={handleEndStroke}
            velocityFilterWeight={0.7}
            minWidth={1.2}
            maxWidth={3}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <span className="font-medium">Error:</span> {error}
          </p>
        )}

        {/* Instant preview */}
        {preview && hasDrawn && (
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-2 flex items-center gap-3">
            <img
              src={preview}
              alt="Signature preview"
              className="h-10 object-contain"
              style={{ maxWidth: 200 }}
            />
            <p className="text-xs text-indigo-600">Preview — looks good?</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={disabled || !hasDrawn}
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Save className="h-3.5 w-3.5" />
            {disabled ? "Uploading…" : "Save Signature"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
            className="gap-1.5"
          >
            <Eraser className="h-3.5 w-3.5" />
            Clear
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
            className="gap-1.5 text-gray-500"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Redraw
          </Button>
        </div>
      </div>
    );
  }
);

SignaturePad.displayName = "SignaturePad";
export default SignaturePad;
