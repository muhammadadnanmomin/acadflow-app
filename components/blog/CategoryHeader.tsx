import { cn } from "@/lib/utils";
import type { BlogCategoryValue } from "@/lib/blog/types";

interface CategoryHeaderProps {
  category: BlogCategoryValue;
  title: string;
  categoryLabel: string;
}

/**
 * CategoryHeader — Renders a unique, themed header for each blog category.
 * Each category has distinct gradients, patterns, and visual treatment.
 */
export function CategoryHeader({
  category,
  title,
  categoryLabel,
}: CategoryHeaderProps) {
  return (
    <div className={cn("relative overflow-hidden", headerStyles[category].bg)}>
      {/* Pattern overlay */}
      <div className={cn("absolute inset-0", headerStyles[category].pattern)} />

      {/* Animated accent shapes */}
      {headerStyles[category].shapes}

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        {/* Category pill */}
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm",
            headerStyles[category].badge
          )}
        >
          {headerStyles[category].icon}
          {categoryLabel}
        </span>

        {/* Title */}
        <h1
          className={cn(
            "mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl lg:leading-tight",
            headerStyles[category].title
          )}
        >
          {title}
        </h1>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
}

// ─── Per-category style configs ─────────────────────────────────────────────

const headerStyles: Record<
  BlogCategoryValue,
  {
    bg: string;
    pattern: string;
    badge: string;
    title: string;
    icon: React.ReactNode;
    shapes: React.ReactNode;
  }
> = {
  // ── AI — Futuristic gradient with mesh lines ──
  ai: {
    bg: "bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-950 min-h-[320px]",
    pattern:
      "bg-[linear-gradient(rgba(139,92,246,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.07)_1px,transparent_1px)] bg-[size:40px_40px]",
    badge:
      "bg-violet-500/20 text-violet-200 border border-violet-400/30",
    title: "text-white",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    shapes: (
      <>
        <div className="absolute top-10 right-10 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-indigo-500/5 blur-3xl" />
      </>
    ),
  },

  // ── Conferences — Structured with step indicators ──
  conferences: {
    bg: "bg-gradient-to-br from-indigo-50 via-blue-50 to-white min-h-[320px]",
    pattern:
      "bg-[radial-gradient(circle_at_1px_1px,rgba(99,102,241,0.08)_1px,transparent_0)] bg-[size:24px_24px]",
    badge:
      "bg-indigo-100 text-indigo-700 border border-indigo-200",
    title: "text-gray-900",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    shapes: (
      <>
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute bottom-10 -left-10 h-60 w-60 rounded-full bg-blue-100/40 blur-3xl" />
      </>
    ),
  },

  // ── Research — Clean academic with paper-like feel ──
  research: {
    bg: "bg-gradient-to-b from-stone-50 via-slate-50 to-white min-h-[320px]",
    pattern:
      "bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:1px_28px]",
    badge:
      "bg-teal-100 text-teal-700 border border-teal-200",
    title: "text-gray-900 font-serif",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    shapes: (
      <>
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-teal-50/80 blur-3xl" />
        {/* Decorative rule lines */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-24 border-t-2 border-stone-200/60" />
      </>
    ),
  },

  // ── Productivity — Minimal and warm ──
  productivity: {
    bg: "bg-gradient-to-br from-amber-50 via-orange-50/30 to-white min-h-[320px]",
    pattern: "bg-transparent",
    badge:
      "bg-amber-100 text-amber-700 border border-amber-200",
    title: "text-gray-900",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    shapes: (
      <>
        <div className="absolute top-10 right-20 h-40 w-40 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-52 w-52 rounded-full bg-orange-100/40 blur-3xl" />
      </>
    ),
  },

  // ── Tech — Dark developer-style ──
  tech: {
    bg: "bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 min-h-[320px]",
    pattern:
      "bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:32px_32px]",
    badge:
      "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30",
    title: "text-white",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    shapes: (
      <>
        <div className="absolute top-0 right-0 h-72 w-72 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-sky-500/5 blur-3xl" />
        {/* Terminal cursor blink effect */}
        <div className="absolute top-6 left-6 flex items-center gap-1.5 opacity-40">
          <div className="h-3 w-3 rounded-full bg-red-500/60" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
          <div className="h-3 w-3 rounded-full bg-green-500/60" />
        </div>
      </>
    ),
  },
};
