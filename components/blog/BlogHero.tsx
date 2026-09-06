/**
 * BlogHero — Hero section for the blog listing page.
 * Matches the landing page hero style with radial gradient bg.
 */
export function BlogHero() {
  return (
    <section className="relative overflow-hidden px-4 pt-16 pb-12 sm:px-6 sm:pt-20 sm:pb-16 lg:px-8">
      {/* Background gradient (same pattern as landing hero) */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.1),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>

      <div className="mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-4 py-1.5 text-sm font-medium text-indigo-700">
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
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>
          Insights & Resources
        </div>

        {/* Title */}
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
          Confairo{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent">
            Blog
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl">
          Insights on AI, academic workflows, conferences, and productivity —
          helping you run better conferences and publish better research.
        </p>
      </div>
    </section>
  );
}
