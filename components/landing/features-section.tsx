import {
  FileText,
  Users,
  CreditCard,
  BarChart3,
  Award,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Submission Management",
    tagline: "No more Google Forms + Excel combos",
    description:
      "Authors submit papers through a dedicated portal. Every submission is tracked automatically — no copying data between tools, no digging through shared drives.",
    outcomes: [
      "All submissions collected in one structured system — no spreadsheets",
      "Live status tracking: submitted → under review → accepted or rejected",
      "Organizers see every paper, file, and author detail in real time",
    ],
  },
  {
    icon: Users,
    title: "Peer Review Workflow",
    tagline: "Stop forwarding PDFs over email",
    description:
      "Assign papers to reviewers with one click. They evaluate using clear, structured forms. You see every score, comment, and recommendation — all in one view.",
    outcomes: [
      "Assign any reviewer to any paper — instantly, not via email",
      "Reviewers get structured forms with clear scoring criteria",
      "All reviews aggregated on one screen for faster decisions",
    ],
  },
  {
    icon: CreditCard,
    title: "Registration & Payments",
    tagline: "Every rupee tracked — automatically",
    description:
      "Participants register and pay in a single flow. Payments go through Razorpay and are reconciled automatically. You never have to match a name to a transaction ID again.",
    outcomes: [
      "Collect fees via UPI, cards, or netbanking — all tracked for you",
      "No manual reconciliation — payments are matched to participants instantly",
      "See who paid, who didn't, and how much — at a glance",
    ],
  },
  {
    icon: BarChart3,
    title: "Organizer Dashboard",
    tagline: "One screen to run your entire conference",
    description:
      "Papers, reviews, payments, registrations — everything on a single dashboard. Know exactly where your conference stands without opening five different tools.",
    outcomes: [
      "Live progress for submissions, reviews, and payments",
      "Revenue and collection tracking built in",
      "Role-based access so your team sees only what they need",
    ],
  },
  {
    icon: Award,
    title: "Automatic Certificates",
    tagline: "Generated in seconds — not days",
    description:
      "Publish decisions, and certificates are ready. Participation, presentation, best paper — all generated automatically from your conference data.",
    outcomes: [
      "One click to generate certificates for every participant",
      "Professional templates with QR-verified authenticity",
      "Bulk download — no more creating them one by one in Word",
    ],
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="bg-gray-50 px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">

        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">

          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            What You Get
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Everything You Need to Run a Conference —{" "}
            <span className="text-indigo-600">In One Place</span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
            Submissions, peer reviews, fee collection, and certificates — each
            handled by a dedicated module. No more switching between tools.
            No more manual work.{" "}
            <strong className="text-gray-900">Just a conference that runs smoothly.</strong>
          </p>

        </div>

        {/* Feature Cards */}
        <div className="mt-16 space-y-6">

          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group overflow-hidden rounded-2xl border bg-white transition hover:shadow-lg ${
                index === 0 ? "border-indigo-200 shadow-sm" : "border-gray-200"
              }`}
            >
              <div className="grid gap-6 p-8 lg:grid-cols-[1fr_1.2fr] lg:gap-12 lg:p-10">

                {/* Text */}
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                      {feature.tagline}
                    </span>
                  </div>

                  <h3 className="mt-4 text-2xl font-bold text-gray-900">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-[0.938rem] leading-relaxed text-gray-600">
                    {feature.description}
                  </p>
                </div>

                {/* Outcomes */}
                <div className="flex items-center">
                  <ul className="space-y-4">
                    {feature.outcomes.map((outcome) => (
                      <li key={outcome} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                          <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium leading-relaxed text-gray-700">{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}