/**
 * openDemo — Opens the Calendly booking page in a new browser tab.
 *
 * Reads the URL from NEXT_PUBLIC_CALENDLY_URL. If the env variable is
 * missing, logs a descriptive error in development and silently no-ops
 * in production.
 *
 * Fires `demo_cta_clicked` via gtag before opening the tab.
 */
export function openDemo(): void {
  // --- analytics ---
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "demo_cta_clicked");
  }

  const url = process.env.NEXT_PUBLIC_CALENDLY_URL;

  if (!url) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[Confairo] NEXT_PUBLIC_CALENDLY_URL is not set. " +
          "Add it to .env.local to enable the Book a Demo button.",
      );
    }
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

/* ------------------------------------------------------------------ */
/*  Global type augmentation for gtag                                 */
/* ------------------------------------------------------------------ */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
