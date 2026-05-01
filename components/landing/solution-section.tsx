import { ArrowRight, X, Check } from "lucide-react";
import Link from "next/link";

const comparisons = [
  {
    label: "Paper Submissions",
    before: "Copy-pasting from Google Forms into Excel",
    after: "All submissions organized automatically — no spreadsheets",
  },
  {
    label: "Reviewer Assignment",
    before: "Emailing PDFs one by one, hoping for replies",
    after: "Assign reviewers in one click, track every review",
  },
  {
    label: "Payment Collection",
    before: "Chasing bank transfers, matching names to UPI screenshots",
    after: "Participants pay online — every payment tracked instantly",
  },
  {
    label: "Communication",
    before: "BCC emails that nobody reads, WhatsApp chaos",
    after: "Notify all participants at once — from your dashboard",
  },
  {
    label: "Certificates",
    before: "3 days of Word/Canva copy-paste, praying for no typos",
    after: "Generated in seconds — for every participant, with one click",
  },
  {
    label: "Overall Tracking",
    before: "Scattered across 5+ tools — nothing connected",
    after: "One dashboard. Every paper, payment, and review in one view.",
  },
];

export function SolutionSection() {
  return (
    <section id="solution" className="relative bg-white px-4 py-20 sm:px-6 sm:py-28 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">

          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            The Solution
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Submissions, Reviews, Payments, Certificates —{" "}
            <span className="text-indigo-600">One Platform</span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
            You no longer have to switch between Google Forms, Excel, Gmail, and
            payment apps to run a conference. AcadFlow handles submissions, peer reviews,
            fee collection, and certificate generation —{" "}
            <strong className="text-gray-900">all from a single dashboard</strong>.
          </p>

        </div>

        {/* Before → After Comparison */}
        <div className="mx-auto mt-16 max-w-4xl">

          {/* Column Headers */}
          <div className="mb-3 grid grid-cols-[1fr_1fr_1fr] gap-4 px-4 sm:px-6">
            <span className="hidden sm:block" />
            <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-red-500">
              <X className="h-4 w-4" />
              Before
            </span>
            <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-600">
              <Check className="h-4 w-4" />
              With AcadFlow
            </span>
          </div>

          {/* Rows */}
          <div className="space-y-1.5">

            {comparisons.map((item, index) => (
              <div
                key={item.label}
                className={`grid grid-cols-[1fr_1fr_1fr] items-center gap-4 rounded-xl px-4 py-4 sm:px-6 transition-colors ${index % 2 === 0
                    ? "bg-gray-50 hover:bg-gray-100/70"
                    : "bg-white hover:bg-gray-50/70"
                  }`}
              >
                <span className="text-sm font-semibold text-gray-900">
                  {item.label}
                </span>
                <span className="text-sm text-red-400/90 line-through decoration-red-300/60">
                  {item.before}
                </span>
                <span className="text-sm font-medium text-gray-800">
                  {item.after}
                </span>
              </div>
            ))}

          </div>

        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5"
          >
            Run Your Conference Free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="mt-3 text-sm text-gray-500">
            No credit card. No setup fee. Your conference can be live in 5 minutes.
          </p>
        </div>

      </div>
    </section>
  );
}
