"use client";

import { useState } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { StepTimeline, type TimelineStep } from "./step-timeline";

/* ─── Types ─────────────────────────────────────────────── */

export interface GuideSection {
  title: string;
  icon: LucideIcon;
  steps: TimelineStep[];
}

interface GuideAccordionProps {
  sections: GuideSection[];
  color: "indigo" | "amber" | "emerald" | "violet";
}

/* ─── Color Maps ────────────────────────────────────────── */

const sectionColors = {
  indigo: {
    activeBg: "bg-indigo-50/50",
    activeBorder: "border-indigo-200",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    hoverBg: "hover:bg-indigo-50/30",
  },
  amber: {
    activeBg: "bg-amber-50/50",
    activeBorder: "border-amber-200",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    hoverBg: "hover:bg-amber-50/30",
  },
  emerald: {
    activeBg: "bg-emerald-50/50",
    activeBorder: "border-emerald-200",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    hoverBg: "hover:bg-emerald-50/30",
  },
  violet: {
    activeBg: "bg-violet-50/50",
    activeBorder: "border-violet-200",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    hoverBg: "hover:bg-violet-50/30",
  },
};

/* ─── Component ─────────────────────────────────────────── */

export function GuideAccordion({ sections, color }: GuideAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const c = sectionColors[color];

  function toggle(idx: number) {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  }

  return (
    <div className="space-y-3">
      {sections.map((section, idx) => {
        const Icon = section.icon;
        const isOpen = openIndex === idx;

        return (
          <div
            key={idx}
            className={`
              rounded-2xl border transition-all duration-300
              ${isOpen ? `${c.activeBg} ${c.activeBorder}` : `bg-white border-gray-200 ${c.hoverBg}`}
            `}
          >
            {/* Section header */}
            <button
              type="button"
              onClick={() => toggle(idx)}
              className="flex w-full items-center justify-between gap-4 p-5 text-left"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center rounded-lg p-2 ${c.iconBg}`}
                >
                  <Icon className={`h-4 w-4 ${c.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-[0.938rem] font-semibold text-gray-900 sm:text-base">
                    {section.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {section.steps.length} step{section.steps.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <ChevronDown
                className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Expandable body */}
            <div
              className={`
                overflow-hidden transition-all duration-400 ease-in-out
                ${isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}
              `}
            >
              <div className="border-t border-gray-100 px-5 py-6">
                <StepTimeline steps={section.steps} color={color} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
