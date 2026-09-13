"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  FileText,
  Users,
  CreditCard,
  Calendar,
  Award,
  LayoutDashboard,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Product preview data — real modules from the Confairo platform     */
/* ------------------------------------------------------------------ */

const sidebarModules = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Submissions", icon: FileText },
  { label: "Reviews", icon: Users },
  { label: "Payments", icon: CreditCard },
  { label: "Schedule", icon: Calendar },
  { label: "Certificates", icon: Award },
];

const moduleCards = [
  { icon: FileText, label: "Submissions", desc: "Collect papers" },
  { icon: Users, label: "Peer Review", desc: "Assign reviewers" },
  { icon: CreditCard, label: "Payments", desc: "Track fees" },
  { icon: Award, label: "Certificates", desc: "Generate & verify" },
];

const workflowSteps = ["Create", "Submit", "Review", "Decide", "Certify"];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function HeroSection() {
  const router = useRouter();
  const supabase = createClient();

  const handleGetStarted = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push("/dashboard/participant/overview");
    } else {
      router.push("/signup");
    }
  };

  const handleOrganizerSetup = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push("/dashboard/onboarding/organization");
    } else {
      router.push("/signup");
    }
  };

  return (
    <section
      id="hero"
      className="bg-white px-4 pt-14 pb-14 sm:px-6 sm:pt-20 sm:pb-20 lg:px-8 lg:pt-24 lg:pb-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 items-center">

          {/* ── Left — Text Content ── */}
          <div className="mx-auto max-w-xl text-center lg:text-left lg:mx-0">

            {/* Eyebrow */}
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--lp-accent)]">
              Academic Conference Management
            </p>

            {/* Heading */}
            <h1 className="mt-4 text-balance text-[2rem] font-bold tracking-tight text-[var(--lp-ink)] sm:text-[2.5rem] sm:leading-[1.2] lg:text-[3rem] lg:leading-[1.15]">
              Manage your academic conference from submission to certificate.
            </h1>

            {/* Description */}
            <p className="mt-6 max-w-lg text-base leading-relaxed text-[var(--lp-ink-secondary)] sm:text-[1.0625rem] sm:leading-7 lg:mx-0 mx-auto">
              Paper submissions, peer review, registration, payments, scheduling,
              and certificates — organized in one platform built for academia.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start sm:justify-center">
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center gap-2 rounded-md bg-[var(--lp-accent)] px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--lp-accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-accent)]"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </button>

              <Link
                href="/#how-it-works"
                className="inline-flex items-center gap-2 rounded-md border border-[var(--lp-border)] px-6 py-2.5 text-sm font-medium text-[var(--lp-ink-secondary)] transition-colors duration-200 hover:border-[var(--lp-border-strong)] hover:text-[var(--lp-ink)]"
              >
                See How It Works
              </Link>
            </div>

            {/* Organizer link */}
            <p className="mt-5 text-sm text-[var(--lp-ink-tertiary)] lg:text-left text-center">
              Already organizing a conference?{" "}
              <button
                onClick={handleOrganizerSetup}
                className="font-medium text-[var(--lp-accent)] transition-colors duration-200 hover:text-[var(--lp-accent-hover)] hover:underline"
              >
                Set up your organizer workspace →
              </button>
            </p>

            {/* Trust indicators */}
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-[var(--lp-ink-tertiary)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[var(--lp-positive)]" />
                Built for academic conferences
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[var(--lp-positive)]" />
                Submission-to-certificate workflow
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[var(--lp-positive)]" />
                Organizer, reviewer & participant access
              </span>
            </div>

          </div>

          {/* ── Right — Product Preview ── */}
          <div>

            {/* Desktop preview — full window mockup */}
            <div
              className="hidden lg:block overflow-hidden rounded-lg border border-[var(--lp-border)]"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)" }}
            >
              {/* Window chrome */}
              <div className="flex items-center gap-1.5 border-b border-[var(--lp-border)] bg-[var(--lp-surface-subtle)] px-4 py-2">
                <div className="h-2 w-2 rounded-full bg-[var(--lp-border-strong)]" />
                <div className="h-2 w-2 rounded-full bg-[var(--lp-border-strong)]" />
                <div className="h-2 w-2 rounded-full bg-[var(--lp-border-strong)]" />
                <span className="ml-3 text-[11px] font-medium text-[var(--lp-ink-tertiary)]">
                  Conference Dashboard
                </span>
              </div>

              <div className="flex">
                {/* Sidebar */}
                <div className="w-[140px] shrink-0 border-r border-[var(--lp-border)] bg-[var(--lp-surface-subtle)] p-2.5 space-y-0.5">
                  {sidebarModules.map((mod, i) => (
                    <div
                      key={mod.label}
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-medium ${i === 0
                        ? "bg-[var(--lp-accent-light)] text-[var(--lp-accent)]"
                        : "text-[var(--lp-ink-tertiary)]"
                        }`}
                    >
                      <mod.icon className="h-3.5 w-3.5" />
                      {mod.label}
                    </div>
                  ))}
                </div>

                {/* Content area */}
                <div className="flex-1 p-4 bg-white">
                  <p className="text-xs font-semibold text-[var(--lp-ink)]">
                    Conference Overview
                  </p>
                  <p className="text-[10px] mt-0.5 text-[var(--lp-ink-tertiary)]">
                    Manage your entire conference workflow
                  </p>

                  {/* Module cards */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {moduleCards.map((card) => (
                      <div
                        key={card.label}
                        className="rounded-md border border-[var(--lp-border)] p-2.5"
                      >
                        <card.icon className="h-3.5 w-3.5 text-[var(--lp-ink-tertiary)]" />
                        <p className="mt-1.5 text-[10px] font-semibold text-[var(--lp-ink-secondary)]">
                          {card.label}
                        </p>
                        <p className="text-[9px] text-[var(--lp-ink-tertiary)]">
                          {card.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Workflow strip */}
                  <div className="mt-3 rounded-md border border-[var(--lp-border)] p-2.5">
                    <p className="text-[10px] font-medium text-[var(--lp-ink-tertiary)] mb-2">
                      Conference Workflow
                    </p>
                    <div className="flex items-center gap-0.5 text-[9px] font-medium">
                      {workflowSteps.map((step, i) => (
                        <div key={step} className="flex items-center gap-0.5">
                          <span
                            className={`rounded px-1.5 py-0.5 ${i === 0
                              ? "bg-[var(--lp-accent-light)] text-[var(--lp-accent)]"
                              : "text-[var(--lp-ink-tertiary)]"
                              }`}
                          >
                            {step}
                          </span>
                          {i < workflowSteps.length - 1 && (
                            <span className="text-[var(--lp-border-strong)]">→</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile / tablet preview — simplified module grid */}
            <div className="lg:hidden mt-2">
              <div className="rounded-lg border border-[var(--lp-border)] bg-[var(--lp-surface-subtle)] p-4">
                <p className="text-xs font-medium text-[var(--lp-ink-tertiary)] mb-3 text-center">
                  One platform for your entire conference
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {sidebarModules.map((mod) => (
                    <div
                      key={mod.label}
                      className="flex flex-col items-center gap-1.5 rounded-md bg-white border border-[var(--lp-border)] py-2.5 px-1"
                    >
                      <mod.icon className="h-4 w-4 text-[var(--lp-ink-tertiary)]" />
                      <span className="text-[10px] font-medium text-[var(--lp-ink-secondary)]">
                        {mod.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}