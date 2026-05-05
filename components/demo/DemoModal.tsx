"use client";

import { useEffect, useCallback } from "react";
import { X, Zap, FileText } from "lucide-react";
import { CalendlyEmbed } from "./CalendlyEmbed";

interface DemoModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * DemoModal — Full-screen / centred modal with Calendly embed.
 *
 * Close via:
 *   • ✕ button (top-right)
 *   • Click on backdrop
 *   • ESC key
 *
 * Calendly iframe is only mounted while the modal is open (lazy).
 */
export function DemoModal({ open, onClose }: DemoModalProps) {
  // ESC handler
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKey);
    // Prevent body scroll while modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, handleKey]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Book a demo"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative z-10 flex flex-col w-full h-full md:h-auto md:max-h-[90vh] md:w-[90%] md:max-w-[900px] bg-white md:rounded-2xl shadow-2xl animate-modal-in overflow-hidden">
        {/* Header */}
        <div className="relative shrink-0 px-6 pt-6 pb-4 border-b border-gray-100">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Book Your Demo
          </h2>
          <p className="mt-1 text-sm text-gray-500 sm:text-base">
            See how AcadFlow automates conference management using AI
          </p>

          {/* Trust signals */}
          <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-gray-500 sm:text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              15-minute setup walkthrough
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-indigo-500" />
              AI-powered paper review demo
            </span>
          </div>
        </div>

        {/* Calendly embed — only rendered when modal is open */}
        <CalendlyEmbed />
      </div>
    </div>
  );
}
