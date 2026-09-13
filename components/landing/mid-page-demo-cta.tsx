"use client";

import { BookDemoButton } from "@/components/demo/BookDemoButton";

/**
 * MidPageDemoCTA — Conversion-focused CTA placed after the features section.
 *
 * Provides a visual break and prompts users who have scrolled past the
 * feature list to book a personalised demo.
 */
export function MidPageDemoCTA() {
  return (
    <section
      className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8"
      style={{ backgroundColor: "var(--lp-surface)" }}
    >
      <div className="mx-auto max-w-2xl text-center">

        <h2 className="text-xl font-bold tracking-tight text-[var(--lp-ink)] sm:text-2xl">
          Want a personalised walkthrough?
        </h2>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[var(--lp-ink-secondary)]">
          Book a free 15-minute demo and see how Confairo can simplify your
          next conference — from submissions to certificates.
        </p>

        <div className="mt-6 flex justify-center">
          <BookDemoButton variant="secondary" />
        </div>

      </div>
    </section>
  );
}
