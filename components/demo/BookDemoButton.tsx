"use client";

import { Calendar } from "lucide-react";
import { openDemo } from "./openDemo";

type Variant = "primary" | "secondary" | "ghost" | "nav";

interface BookDemoButtonProps {
  variant?: Variant;
  className?: string;
  /** Optional callback fired before opening Calendly (e.g. close a menu). */
  onBeforeOpen?: () => void;
}

/**
 * BookDemoButton — Self-contained CTA that opens Calendly in a new tab.
 *
 * Variants:
 *  • primary   — gradient fill, hero/CTA-level
 *  • secondary — outline, supporting CTA
 *  • ghost     — minimal, for nav / inline
 *  • nav       — small, intended for the navbar
 */
export function BookDemoButton({
  variant = "primary",
  className = "",
  onBeforeOpen,
}: BookDemoButtonProps) {
  const label =
    variant === "secondary" ? "Book 15-Min Demo" : "Book a Demo";

  const base =
    "inline-flex items-center gap-2 font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer";

  const variants: Record<Variant, string> = {
    primary:
      "rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-7 py-3.5 text-base text-white shadow-lg shadow-indigo-600/25 hover:shadow-xl hover:shadow-indigo-600/30 hover:-translate-y-0.5",
    secondary:
      "rounded-lg border border-indigo-200 bg-indigo-50/60 px-6 py-3 text-sm text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300",
    ghost:
      "rounded-md px-4 py-2 text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50",
    nav:
      "rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm text-white shadow-sm hover:shadow-md hover:-translate-y-px",
  };

  const handleClick = () => {
    onBeforeOpen?.();
    openDemo();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${base} ${variants[variant]} ${className}`}
    >
      <Calendar className="h-4 w-4" />
      {label}
    </button>
  );
}
