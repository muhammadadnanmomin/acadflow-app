"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-slate-50 px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">

      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(79,70,229,0.08),transparent_60%)]" />

      <div className="mx-auto max-w-7xl">

        {/* Main Content */}
        <div className="mx-auto max-w-3xl text-center">

          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm text-indigo-700">
            🚀 Built for Colleges & Universities
          </div>

          {/* Heading */}
          <h1 className="text-balance text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">

            Manage Academic Conferences
            <span className="block text-indigo-600">
              Faster. Smarter. Easier.
            </span>

          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl">

            AcadFlow helps institutions manage submissions, reviews,
            registrations, and certificates — all in one secure platform.

          </p>

          {/* CTA */}
          <div className="flex flex-wrap gap-4 justify-center mt-6">

  <Link
    href="/signup?role=organizer"
    className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
  >
    🎯 Organize Conference
  </Link>

  <Link
    href="/conferences"
    className="px-6 py-3 rounded-lg border font-medium hover:bg-gray-50"
  >
    📚 Browse Conferences
  </Link>

  <Link
    href="/signup?role=reviewer"
    className="px-6 py-3 rounded-lg border font-medium hover:bg-gray-50"
  >
    📝 Become Reviewer
  </Link>

</div>


        </div>

        {/* Preview Mock */}
        <div className="mt-16 sm:mt-20">

          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-xl border bg-white shadow-xl">

            {/* Browser Bar */}
            <div className="flex h-8 items-center gap-2 border-b bg-gray-100 px-4">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
            </div>

            {/* Dashboard Preview */}
            <div className="aspect-[16/9] bg-gradient-to-br from-indigo-50 to-white p-6 sm:p-8">

              <div className="grid h-full gap-4 sm:grid-cols-3">

                {/* Sidebar Preview */}
                <div className="rounded-lg bg-white p-4 shadow">

                  <div className="mb-3 h-2 w-24 rounded bg-indigo-200" />

                  <div className="space-y-2">
                    <div className="h-2 w-full rounded bg-gray-200" />
                    <div className="h-2 w-3/4 rounded bg-gray-200" />
                    <div className="h-2 w-1/2 rounded bg-gray-200" />
                  </div>

                </div>

                {/* Main Preview */}
                <div className="hidden rounded-lg bg-white p-4 shadow sm:col-span-2 sm:block">

                  <div className="mb-3 flex items-center justify-between">
                    <div className="h-2 w-32 rounded bg-indigo-200" />
                    <div className="h-6 w-20 rounded-full bg-indigo-100" />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">

                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="rounded-lg border bg-gray-50 p-3"
                      >
                        <div className="mb-2 h-2 w-16 rounded bg-gray-300" />
                        <div className="h-8 w-full rounded bg-gray-200" />
                      </div>
                    ))}

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}
