import Link from "next/link";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Create Your Conference",
    description:
      "Fill in your conference details, set submission deadlines, and open registrations. The guided setup takes less than 5 minutes — no technical skills needed.",
    time: "Under 5 minutes",
  },
  {
    step: "02",
    title: "Collect Paper Submissions",
    description:
      "Share your conference link. Authors submit papers through a clean portal. Every submission appears on your dashboard instantly — with status, track, and file details.",
    time: "Open until your deadline",
  },
  {
    step: "03",
    title: "Run the Review Process",
    description:
      "Assign reviewers with one click. They evaluate papers using structured forms and submit scores. You see every review aggregated in one place — ready for decisions.",
    time: "Set your own timeline",
  },
  {
    step: "04",
    title: "Publish Results & Collect Fees",
    description:
      "Accept or reject papers and notify authors instantly. Accepted participants register and pay online — every payment tracked automatically. No manual follow-ups.",
    time: "Instant notifications",
  },
  {
    step: "05",
    title: "Generate Certificates & Done",
    description:
      "One click generates certificates for every participant — participation, presentation, and best paper. QR-verified and ready to download. Your conference is complete.",
    time: "Done in seconds",
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

                </div>

              </div>
            ))}

          </div>

        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:-translate-y-0.5"
          >
            Run Your First Conference Free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

      </div>
    </section>
  );
}