import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Create Your Conference",
    description:
      "Fill in your conference details, set submission deadlines, and open registrations. The guided setup takes less than 5 minutes — no technical skills needed.",
    time: "Under 5 minutes",
    guideSection: "organizer",
  },
  {
    step: "02",
    title: "Collect Paper Submissions",
    description:
      "Share your conference link. Authors submit papers through a clean portal. Every submission appears on your dashboard instantly — with status, track, and file details.",
    time: "Open until your deadline",
    guideSection: "author",
  },
  {
    step: "03",
    title: "Run the Review Process",
    description:
      "Assign reviewers with one click. They evaluate papers using structured forms and submit scores. You see every review aggregated in one place — ready for decisions.",
    time: "Set your own timeline",
    guideSection: "reviewer",
  },
  {
    step: "04",
    title: "Publish Results & Collect Fees",
    description:
      "Accept or reject papers and notify authors instantly. Accepted participants register and pay online — every payment tracked automatically. No manual follow-ups.",
    time: "Instant notifications",
    guideSection: "organizer",
  },
  {
    step: "05",
    title: "Generate Certificates & Done",
    description:
      "One click generates certificates for every participant — participation, presentation, and best paper. QR-verified and ready to download. Your conference is complete.",
    time: "Done in seconds",
    guideSection: "organizer",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="bg-white px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">

          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            How It Works
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Your Conference, Live in{" "}
            <span className="text-indigo-600">5 Simple Steps</span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
            Create your event, collect submissions, run reviews, collect payments,
            and generate certificates — all from one dashboard.{" "}
            <strong className="text-gray-900">No spreadsheets. No back-and-forth emails.</strong>
          </p>

          <p className="mt-3 text-sm text-gray-500">
            New to AcadFlow?{" "}
            <Link
              href="/user-guide"
              className="font-medium text-indigo-600 transition hover:text-indigo-700 hover:underline"
            >
              View the full guide →
            </Link>
          </p>

        </div>

        {/* Steps */}
        <div className="relative mx-auto mt-16 max-w-3xl">

          {/* Vertical Line */}
          <div className="absolute left-[27px] top-0 h-full w-px bg-gradient-to-b from-indigo-600 via-indigo-300 to-transparent sm:left-[31px]" />

          <div className="space-y-8">

            {steps.map((step, index) => (
              <div
                key={step.step}
                className="group relative flex gap-6 sm:gap-8"
              >

                {/* Step Number Circle */}
                <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-indigo-600 bg-white text-sm font-bold text-indigo-600 shadow-sm transition group-hover:bg-indigo-600 group-hover:text-white">
                  {step.step}
                </div>

                {/* Content */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-6 transition group-hover:border-indigo-100 group-hover:bg-indigo-50/30 flex-1">

                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {step.title}
                    </h3>
                    <span className="shrink-0 rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-medium text-indigo-700">
                      {step.time}
                    </span>
                  </div>

                  <p className="mt-2 text-[0.938rem] leading-relaxed text-gray-600">
                    {step.description}
                  </p>

                  {step.guideSection && (
                    <Link
                      href={`/user-guide#${step.guideSection}`}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 opacity-0 transition-all duration-300 group-hover:opacity-100 hover:text-indigo-700"
                    >
                      Learn more
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}

                </div>

              </div>
            ))}

          </div>

        </div>

        {/* CTAs */}
        <div className="mt-16 flex flex-col items-center gap-4">
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:-translate-y-0.5"
          >
            Run Your First Conference Free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/user-guide"
            className="group inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <BookOpen className="h-4 w-4 text-gray-400 transition-colors group-hover:text-indigo-500" />
            Explore Full User Guide
          </Link>

          <p className="mt-1 text-xs text-gray-400">
            Not sure where to start? Follow our step-by-step guide.
          </p>
        </div>

      </div>
    </section>
  );
}