import { CheckCircle2 } from "lucide-react";

const benefits = [
  {
    title: "For Organizers",
    items: [
      "Manage multiple conferences from one centralized workspace",
      "Publish events and manage timelines with ease",
      "Track participants, submissions, and payments in real time",
      "Secure role-based permissions for team collaboration",
    ],
  },
  {
    title: "For Professors & Reviewers",
    items: [
      "Streamlined peer review workflow",
      "Structured evaluation and feedback tools",
      "Organized reviewer assignments and workload management",
      "Transparent and fair decision-making process",
    ],
  },
  {
    title: "For Students & Authors",
    items: [
      "Simple registration and paper submission process",
      "Real-time updates on submission status",
      "Instant access to verified digital certificates",
      "Secure storage for research documents",
    ],
  },
];

export function BenefitsSection() {
  return (
    <section
      id="benefits"
      className="bg-indigo-600 px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">

          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-200">
            Benefits
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Built for Every Role in Academic Conferences
          </h2>

          <p className="mt-4 text-lg text-indigo-100">
            AcadFlow empowers organizers, reviewers, and participants
            with tools designed to simplify academic workflows.
          </p>

        </div>

        {/* Benefit Cards */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3">

          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="
                rounded-xl bg-white/10 p-8
                backdrop-blur-md border border-white/20
                transition hover:bg-white/15
              "
            >

              <h3 className="text-xl font-semibold">
                {benefit.title}
              </h3>

              <ul className="mt-6 space-y-4">

                {benefit.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3"
                  >

                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-200" />

                    <span className="text-indigo-50 leading-relaxed">
                      {item}
                    </span>

                  </li>
                ))}

              </ul>

            </div>
          ))}

        </div>

        {/* Bottom Note */}
        <div className="mt-16 text-center">

          <p className="text-sm text-indigo-200">
            Trusted by academic institutions and independent organizers
            to deliver reliable, professional conference experiences.
          </p>

        </div>

      </div>
    </section>
  );
}