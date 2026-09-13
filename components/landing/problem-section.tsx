import { FileText, Users, Settings } from "lucide-react";

const problemCards = [
  {
    icon: FileText,
    title: "Submissions",
    description:
      "Papers, authors, and files can end up across different tools.",
  },
  {
    icon: Users,
    title: "Peer Review",
    description:
      "Reviewer assignments and decisions are difficult to keep track of.",
  },
  {
    icon: Settings,
    title: "Administration",
    description:
      "Registration, payments, schedules, and certificates add more work.",
  },
];

export function ProblemSection() {
  return (
    <section
      id="problem"
      className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      style={{ backgroundColor: "var(--lp-surface)" }}
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--lp-ink)] sm:text-3xl">
            Conference management gets complicated fast.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--lp-ink-secondary)]">
            Submissions, reviews, registration, payments, schedules, and
            certificates often end up spread across different tools.
          </p>
        </div>

        {/* Cards */}
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
          {problemCards.map((card) => (
            <div
              key={card.title}
              className="rounded-lg border border-[var(--lp-border)] bg-[var(--lp-surface-subtle)] p-6 text-center"
            >
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-[var(--lp-border)] bg-white">
                <card.icon className="h-5 w-5 text-[var(--lp-ink-tertiary)]" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[var(--lp-ink)]">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--lp-ink-tertiary)]">
                {card.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
