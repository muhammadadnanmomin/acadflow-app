"use client";

import Link from "next/link";

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
            🎓 The Conference Management Platform for Academia
          </div>

          {/* Heading */}
          <h1 className="text-balance text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Run Academic Conferences
            <span className="block text-indigo-600">
              Without the Admin Chaos
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl">
            AcadFlow automates paper submissions, peer reviews, scheduling,
            and certificate generation — so organizers spend less time
            on admin and more time on research that matters.
          </p>

          {/* Trust line */}
          <p className="mt-3 text-sm text-gray-500">
            Used by university departments, research labs, and independent organizers.
          </p>

          {/* CTA */}
          {/* CTA */}
          <div className="flex flex-wrap gap-4 justify-center mt-8">

            {/* Primary CTA */}
            <Link
              href="/signup"
              className="px-7 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
            >
              Get Started Free
            </Link>

            {/* Secondary CTA */}
            <Link
              href="/conferences"
              className="px-7 py-3 rounded-lg border font-medium hover:bg-gray-50 transition"
            >
              Browse Conferences
            </Link>

          </div>

          {/* Organizer hint */}
          <p className="mt-4 text-sm text-gray-500">
            Planning a conference?{" "}
            <Link href="/signup?role=organizer" className="text-indigo-600 hover:underline">
              Set up your organizer workspace →
            </Link>
          </p>

          {/* Micro trust indicators */}
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <span>✔ Free to start — no credit card required</span>
            <span>✔ Built for academic workflows</span>
            <span>✔ Live in under 5 minutes</span>
          </div>

        </div>


        {/* Demo Video Section */}
        <section className="mt-20 sm:mt-24 lg:mt-28">

          <div className="relative mx-auto max-w-5xl">

            {/* soft glow background */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_70%)] blur-2xl" />

            {/* label */}
            <div className="text-center mb-6">
              <span className="inline-block rounded-full bg-indigo-50 text-indigo-700 px-4 py-1 text-sm font-medium border border-indigo-200">
                🎥 Product Demo
              </span>
            </div>

            {/* video card */}
            <div className="group relative overflow-hidden rounded-2xl border bg-black shadow-2xl transition duration-300 hover:shadow-indigo-200">

              <div className="aspect-video">

                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                  title="AcadFlow Demo Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />

              </div>

              {/* subtle overlay on hover */}
              <div className="pointer-events-none absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition" />

            </div>

            {/* caption */}
            <p className="text-center text-gray-500 mt-5 text-sm sm:text-base">
              Watch how a conference goes from setup to certificates in minutes.
            </p>

          </div>

        </section>


      </div>
    </section>
  );
}