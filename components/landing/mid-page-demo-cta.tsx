"use client";

import { Sparkles } from "lucide-react";
import { BookDemoButton } from "@/components/demo/BookDemoButton";

/**
 * MidPageDemoCTA — Conversion-focused CTA placed after the features section.
 *
 * Provides a visual break and prompts users who have scrolled past the
 * feature list to book a personalised demo.
 */
export function MidPageDemoCTA() {


  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      {/* Decorative blobs */}
      <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-indigo-100/40 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-purple-100/40 blur-3xl" />

      <div className="relative mx-auto max-w-3xl text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-1.5 text-sm font-medium text-indigo-700 shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          See It in Action
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
          Want a Personalised Walkthrough?
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg">
          Book a free 15-minute demo and see how AcadFlow can simplify your
          next conference — from submissions to certificates.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <BookDemoButton variant="primary" />
        </div>
      </div>
    </section>
  );
}
