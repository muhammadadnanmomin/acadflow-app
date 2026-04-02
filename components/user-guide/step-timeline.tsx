"use client";

import { useState } from "react";
import Link from "next/link";
import { type LucideIcon, ChevronDown, ExternalLink } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */

export interface TimelineStep {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: { label: string; variant: "tip" | "important" | "new" };
  link?: { label: string; href: string };
}

interface StepTimelineProps {
  steps: TimelineStep[];
  color: "indigo" | "amber" | "emerald" | "violet";
}

/* ─── Color Maps ────────────────────────────────────────── */

const lineColors = {
  indigo: "from-indigo-600 via-indigo-300 to-transparent",
  amber: "from-amber-500 via-amber-300 to-transparent",
  emerald: "from-emerald-600 via-emerald-300 to-transparent",
  violet: "from-violet-600 via-violet-300 to-transparent",
};

const circleColors = {
  indigo: "border-indigo-600 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
  amber: "border-amber-500 text-amber-600 group-hover:bg-amber-500 group-hover:text-white",
  emerald: "border-emerald-600 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
  violet: "border-violet-600 text-violet-600 group-hover:bg-violet-600 group-hover:text-white",
};

const cardHoverColors = {
  indigo: "group-hover:border-indigo-100 group-hover:bg-indigo-50/30",
  amber: "group-hover:border-amber-100 group-hover:bg-amber-50/30",
  emerald: "group-hover:border-emerald-100 group-hover:bg-emerald-50/30",
  violet: "group-hover:border-violet-100 group-hover:bg-violet-50/30",
};

const linkColors = {
  indigo: "text-indigo-600 hover:text-indigo-700",
  amber: "text-amber-600 hover:text-amber-700",
  emerald: "text-emerald-600 hover:text-emerald-700",
  violet: "text-violet-600 hover:text-violet-700",
};

const badgeStyles = {
  tip: "bg-emerald-100 text-emerald-700",
  important: "bg-rose-100 text-rose-700",
  new: "bg-cyan-100 text-cyan-700",
};

/* ─── Component ─────────────────────────────────────────── */

export function StepTimeline({ steps, color }: StepTimelineProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0]));

  function toggleStep(idx: number) {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  return (
    <div className="relative">
      {/* Connector line */}
      <div
        className={`absolute left-[23px] top-0 h-full w-px bg-gradient-to-b ${lineColors[color]} sm:left-[27px]`}
      />

      <div className="space-y-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isOpen = expandedSteps.has(idx);

          return (
            <div key={idx} className="group relative flex gap-4 sm:gap-6">
              {/* Step number circle */}
              <div
                className={`
                  relative z-10 flex h-12 w-12 shrink-0 items-center justify-center
                  rounded-xl border-2 bg-white text-sm font-bold shadow-sm
                  transition-all duration-300 sm:h-14 sm:w-14
                  ${circleColors[color]}
                `}
              >
                {String(idx + 1).padStart(2, "0")}
              </div>

              {/* Content card */}
              <div
                className={`
                  flex-1 rounded-xl border border-gray-100 bg-gray-50/50 transition-all duration-300
                  ${cardHoverColors[color]}
                `}
              >
                {/* Header (always visible, toggles) */}
                <button
                  type="button"
                  onClick={() => toggleStep(idx)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left sm:p-5"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0 text-gray-400" />
                    <h4 className="text-[0.938rem] font-semibold text-gray-900 sm:text-base">
                      {step.title}
                    </h4>
                    {step.badge && (
                      <span
                        className={`hidden rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold sm:inline-flex ${badgeStyles[step.badge.variant]}`}
                      >
                        {step.badge.label}
                      </span>
                    )}
                  </div>

                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Expandable content */}
                <div
                  className={`
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${isOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"}
                  `}
                >
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
                    <p className="text-sm leading-relaxed text-gray-600">
                      {step.description}
                    </p>

                    {step.link && (
                      <Link
                        href={step.link.href}
                        className={`mt-3 inline-flex items-center gap-1.5 text-sm font-medium transition ${linkColors[color]}`}
                      >
                        {step.link.label}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
