"use client";

/**
 * CalendlyEmbed — Lazy-loaded Calendly inline widget.
 *
 * Renders an iframe pointing at the configured Calendly event URL.
 * The URL is read from `NEXT_PUBLIC_CALENDLY_URL` so it can be changed
 * per-environment without touching code.
 */

const CALENDLY_URL =
  process.env.NEXT_PUBLIC_CALENDLY_URL ||
  "https://calendly.com/YOUR_USERNAME/15min-demo";

export function CalendlyEmbed() {
  return (
    <div className="w-full flex-1 min-h-0">
      <iframe
        src={CALENDLY_URL}
        title="Book a demo with AcadFlow"
        width="100%"
        height="100%"
        frameBorder="0"
        loading="lazy"
        className="rounded-b-xl md:rounded-b-2xl"
        style={{ minHeight: 520 }}
      />
    </div>
  );
}
