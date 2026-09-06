import { CheckCircle2 } from "lucide-react";

const benefits = [
  {
    title: "For Organizers",
    items: [
      "Create and manage multiple conferences from one workspace",
      "Set deadlines, open registrations, and track progress in real time",
      "Monitor submissions, reviews, and payments from a single dashboard",
      "Control access with role-based permissions for your team",
    ],
  },
  {
    title: "For Professors & Reviewers",
    items: [
      "Receive review assignments with clear deadlines and instructions",
      "Evaluate papers using structured forms — no email back-and-forth",
      "See your workload at a glance and track completion",
      "Provide fair, consistent feedback through a guided workflow",
    ],
  },
  {
    title: "For Students & Authors",
    items: [
      "Register and submit papers in minutes — no confusing forms",
      "Get real-time updates on your submission status",
      "Download verified certificates the moment results are published",
      "Access your submissions and documents from a personal dashboard",
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
            Who It Helps
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Built for Organizers, Reviewers, and Researchers
          </h2>

          <p className="mt-4 text-lg text-indigo-100">
            Every role in a conference has different needs.
            Confairo gives each one a clear, focused experience.
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
            Designed for universities, research labs, and independent conference organizers.
          </p>

        </div>

      </div>
    </section>
  );
}