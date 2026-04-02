import { Check, X } from "lucide-react";

const rows = [
  {
    feature: "Paper submissions",
    traditional: "Google Forms + copy-paste into Excel",
    acadflow: "All submissions organized automatically — no spreadsheets",
  },
  {
    feature: "Reviewer management",
    traditional: "Emailing PDFs, hoping reviewers reply",
    acadflow: "Assign, track, and collect reviews from one screen",
  },
  {
    feature: "Payment collection",
    traditional: "Chasing bank transfers, matching UPI screenshots",
    acadflow: "Participants pay online — every rupee tracked for you",
  },
  {
    feature: "Communication",
    traditional: "BCC emails nobody reads, WhatsApp chaos",
    acadflow: "Notify all participants at once from your dashboard",
  },
  {
    feature: "Certificates",
    traditional: "Days of Word/Canva copy-paste, one by one",
    acadflow: "Generated in one click — QR-verified, ready to download",
  },
  {
    feature: "Progress tracking",
    traditional: "Scattered across 5 spreadsheets and tabs",
    acadflow: "One dashboard — papers, reviews, payments, all live",
  },
  {
    feature: "Access control",
    traditional: "Shared Google Drive links anyone can edit",
    acadflow: "Secure roles for organizers, reviewers, and participants",
  },
  {
    feature: "Setup time",
    traditional: "Days of back-and-forth coordination",
    acadflow: "Under 5 minutes — guided setup, no tech skills needed",
  },
];

export function ComparisonSection() {
  return (
    <section id="comparison" className="bg-white px-4 py-20 sm:px-6 sm:py-28 lg:px-8">

      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">

          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Why Switch?
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Replace the Chaos with{" "}
            <span className="text-indigo-600">One Simple Platform</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-600">
            Google Forms for submissions. Excel for tracking. Gmail for updates.
            A separate app for payments. Sound familiar?{" "}
            <strong className="text-gray-900">Here&apos;s what changes with AcadFlow.</strong>
          </p>

          {/* Micro hook */}
          <p className="mt-4 text-sm font-medium text-indigo-600">
            Replace 5 tools with 1 platform.
          </p>

        </div>

        {/* Comparison Table */}
        <div className="mt-14 overflow-hidden rounded-2xl border border-gray-200">

          {/* Header row */}
          <div className="grid grid-cols-3 bg-gray-50 px-6 py-4">
            <span className="text-sm font-semibold text-gray-500">Feature</span>
            <span className="text-sm font-bold uppercase tracking-wider text-red-500 text-center">
              Without AcadFlow
            </span>
            <span className="text-sm font-bold uppercase tracking-wider text-emerald-600 text-center">
              With AcadFlow
            </span>
          </div>

          {/* Data rows */}
          {rows.map((row, index) => (
            <div
              key={row.feature}
              className={`grid grid-cols-3 items-center px-6 py-4 ${
                index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
              } ${index < rows.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <span className="text-sm font-semibold text-gray-900">
                {row.feature}
              </span>

              <div className="flex items-center justify-center gap-2 text-center">
                <X className="hidden h-4 w-4 shrink-0 text-red-400 sm:block" />
                <span className="text-sm text-gray-500">{row.traditional}</span>
              </div>

              <div className="flex items-center justify-center gap-2 text-center">
                <Check className="hidden h-4 w-4 shrink-0 text-emerald-500 sm:block" />
                <span className="text-sm font-semibold text-gray-800">{row.acadflow}</span>
              </div>
            </div>
          ))}

        </div>

        {/* Bottom closing line */}
        <div className="mt-10 text-center">
          <p className="text-lg font-semibold text-gray-900">
            Stop managing tools.{" "}
            <span className="text-indigo-600">Start managing your conference.</span>
          </p>
        </div>

      </div>
    </section>
  );
}
