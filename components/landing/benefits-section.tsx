import { CheckCircle2 } from "lucide-react";

const benefits = [
  {
    title: "For Organizers",
    items: [
      "Centralized management for all conferences",
      "Easy creation and publishing tools",
      "Automated participant and paper tracking",
      "Secure role-based access control",
    ],
  },
  {
    title: "For Professors & Reviewers",
    items: [
      "Simple paper review workflow",
      "Clear evaluation criteria",
      "Organized reviewer assignments",
      "Transparent decision process",
    ],
  },
  {
    title: "For Students & Authors",
    items: [
      "Easy registration and submission",
      "Real-time submission status",
      "Digital certificates",
      "Secure document storage",
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
            Designed for Every Academic Role
          </h2>

          <p className="mt-4 text-lg text-indigo-100">
            AcadFlow supports organizers, reviewers, and participants
            with tools built for academic excellence.
          </p>

        </div>

        {/* Benefit Cards */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3">

          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="
                rounded-xl bg-white/10 p-8
                backdrop-blur-sm border border-white/20
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

                    <span className="text-indigo-50">
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
            for reliable conference management.
          </p>

        </div>

      </div>
    </section>
  );
}
