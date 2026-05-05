"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { DemoModal } from "./DemoModal";

/* ------------------------------------------------------------------ */
/*  Context                                                           */
/* ------------------------------------------------------------------ */

interface DemoContextValue {
  /** Open the demo booking modal and fire tracking event. */
  openDemo: () => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

/**
 * useDemoModal — Hook to open the global demo modal from anywhere.
 *
 * When used outside <DemoProvider> (e.g. on /contact, /terms), returns
 * a no-op so the Header can render without crashing.
 */
export function useDemoModal() {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    return { openDemo: () => {} };
  }
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Provider                                                          */
/* ------------------------------------------------------------------ */

/**
 * DemoProvider — Wraps the app and renders a single DemoModal instance.
 *
 * All "Book a Demo" buttons share this modal via the `useDemoModal` hook.
 */
export function DemoProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openDemo = useCallback(() => {
    // --- tracking ---
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "demo_cta_clicked");
    }
    setIsOpen(true);
    // fire open event after state update
    setTimeout(() => {
      if (typeof window !== "undefined" && typeof window.gtag === "function") {
        window.gtag("event", "demo_modal_opened");
      }
    }, 0);
  }, []);

  const closeDemo = useCallback(() => setIsOpen(false), []);

  return (
    <DemoContext.Provider value={{ openDemo }}>
      {children}
      <DemoModal open={isOpen} onClose={closeDemo} />
    </DemoContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Global type augmentation for gtag                                 */
/* ------------------------------------------------------------------ */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
