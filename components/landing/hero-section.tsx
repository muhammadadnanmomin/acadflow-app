"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Clock, FileText, Shield } from "lucide-react";

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
    <section id="hero" className="relative overflow-hidden bg-white px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28 lg:px-8 lg:pt-28 lg:pb-32">

      {/* Subtle background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl">

        {/* Main Content */}
        <div className="mx-auto max-w-3xl text-center">

          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-4 py-1.5 text-sm font-medium text-indigo-700 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600" />
            </span>
            Built for academic conference organizers
          </div>

          {/* Heading */}
          <h1 className="text-balance text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.15]">
            Run Your Entire Conference —{" "}
            <span className="relative">
              <span className="relative z-10 bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">
                Without Spreadsheets, Emails, or Chaos
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl sm:leading-8">
            Collect registration fees, manage paper submissions, run peer reviews,
            and generate certificates —{" "}
            <strong className="text-gray-900">all in one place</strong>.
            No more juggling Google Forms, Excel sheets, and email threads.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">

            {/* Primary CTA */}
            <button
              onClick={handleGetStarted}
              className="group inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/30 hover:-translate-y-0.5"
            >
              Run Your First Conference Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>

            {/* Secondary CTA */}
            <Link
              href="/conferences"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-8 py-3.5 text-base font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50"
            >
              Browse Active Conferences
            </Link>

          </div>

          {/* Organizer link */}
          <p className="mt-5 text-sm text-gray-500">
            Already organizing a conference?{" "}
            <button
              onClick={handleOrganizerSetup}
              className="font-medium text-indigo-600 transition hover:text-indigo-700 hover:underline"
            >
              Set up your organizer workspace →
            </button>
          </p>

          {/* Trust indicators */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-emerald-500" />
              No credit card required
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-indigo-500" />
              Live in under 5 minutes
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-amber-500" />
              Free for up to 150 submissions
            </span>
          </div>

        </div>

        {/* Stats Bar */}
        {/* <div className="mx-auto mt-20 max-w-4xl">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">

            {[
              { number: "50+", label: "Conferences Managed" },
              { number: "5,000+", label: "Papers Submitted" },
              { number: "98%", label: "Organizer Satisfaction" },
              { number: "< 5min", label: "Setup Time" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="group rounded-xl border border-gray-100 bg-gray-50/50 p-5 text-center transition hover:border-indigo-100 hover:bg-indigo-50/30"
              >
                <div className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  {stat.number}
                </div>
                <div className="mt-1 text-xs font-medium text-gray-500 sm:text-sm">
                  {stat.label}
                </div>
              </div>
            ))}

          </div>
        </div> */}

      </div>
    </section>
  );
}