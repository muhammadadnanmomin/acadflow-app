"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Calendar } from "lucide-react";
import { openDemo } from "@/components/demo/openDemo";

export function FinalCTASection() {
  const router = useRouter();
  const supabase = createClient();

  const handleGetStarted = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push("/dashboard/onboarding/organization");
    } else {
      router.push("/signup");
    }
  };

  return (
    <section
      className="px-4 py-14 sm:px-6 sm:py-18 lg:px-8"
      style={{ backgroundColor: "white" }}
    >
      <div className="mx-auto max-w-2xl text-center">

        <h2 className="text-2xl font-bold tracking-tight text-[var(--lp-ink)] sm:text-3xl">
          Ready to simplify your next conference?
        </h2>

        <p className="mt-3 text-base leading-relaxed text-[var(--lp-ink-secondary)]">
          Set up your conference and manage submissions, reviews, registrations,
          schedules, and certificates from one place.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--lp-accent)] px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--lp-accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-accent)]"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={openDemo}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--lp-border)] px-6 py-2.5 text-sm font-medium text-[var(--lp-ink-secondary)] transition-colors duration-200 hover:border-[var(--lp-border-strong)] hover:text-[var(--lp-ink)]"
          >
            <Calendar className="h-4 w-4" />
            Book a Demo
          </button>
        </div>

        <p className="mt-5 text-sm text-[var(--lp-ink-tertiary)]">
          No credit card required
        </p>

      </div>
    </section>
  );
}
