"use client";

import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { openDemo } from "./openDemo";

/**
 * FloatingDemoButton — Sticky bottom-right CTA that appears after scroll.
 *
 * Hidden until the user scrolls 600 px to avoid cluttering the hero.
 * Sits above the chatbot widget (z-40 vs z-50 for chatbot).
 */
export function FloatingDemoButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // check immediately
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={openDemo}
      aria-label="Book a demo"
      className={`
        fixed bottom-24 right-6 z-40
        inline-flex items-center gap-2
        rounded-full bg-gradient-to-r from-indigo-600 to-purple-600
        px-5 py-3 text-sm font-semibold text-white
        shadow-lg shadow-indigo-600/30
        transition-all duration-300
        hover:shadow-xl hover:shadow-indigo-600/40 hover:-translate-y-0.5
        ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"}
      `}
    >
      <Calendar className="h-4 w-4" />
      <span className="hidden sm:inline">Book a Demo</span>
    </button>
  );
}
