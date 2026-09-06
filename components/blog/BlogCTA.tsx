import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * BlogCTA — Conversion-focused call-to-action section.
 * "Start managing your conferences with Confairo"
 * Placed after blog content, before related posts.
 */
export function BlogCTA() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 px-6 py-12 text-center shadow-xl sm:px-10 sm:py-16">
      {/* Decorative shapes */}
      <div className="absolute -top-10 -right-10 h-52 w-52 rounded-full bg-white/5 blur-2xl" />
      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-violet-400/10 blur-3xl" />

      {/* Content */}
      <div className="relative z-10">
        {/* <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-indigo-100 backdrop-blur-sm">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
            />
          </svg>
          Trusted by 500+ conferences worldwide
        </div> */}

        <h2 className="mx-auto mt-6 max-w-xl text-2xl font-extrabold text-white sm:text-3xl">
          Start managing your conferences with Confairo
        </h2>

        <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-indigo-100/80">
          From paper submissions to certificate generation — automate your
          entire conference workflow and save dozens of hours.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3
                       text-sm font-semibold text-indigo-700 shadow-lg shadow-indigo-900/20
                       transition-all hover:bg-indigo-50 hover:shadow-xl hover:-translate-y-0.5"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/#pricing"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-6 py-3
                       text-sm font-semibold text-white backdrop-blur-sm
                       transition-all hover:bg-white/10"
          >
            View Pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
