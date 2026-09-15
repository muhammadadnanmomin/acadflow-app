import {
  Settings,
  LayoutDashboard,
  Award,
} from "lucide-react";

const steps = [
  {
    num: "01",
    icon: Settings,
    title: "Set up",
    description: "Create your conference and configure its workflow.",
  },
  {
    num: "02",
    icon: LayoutDashboard,
    title: "Run",
    description:
      "Manage submissions, reviewers, participants, payments, and schedules.",
  },
  {
    num: "03",
    icon: Award,
    title: "Finish",
    description: "Complete decisions, certificates, and conference records.",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="px-4 py-14 sm:px-6 sm:py-18 lg:px-8"
      style={{ backgroundColor: "var(--lp-surface-subtle)" }}
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--lp-ink)] sm:text-3xl">
            Set up your conference. Then manage it from one place.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--lp-ink-secondary)]">
            Confairo gives organizers the tools to manage each stage without
            switching between systems.
          </p>
        </div>

        {/* Desktop — horizontal connected 3-step */}
        <div className="mx-auto mt-10 hidden sm:block max-w-3xl">
          <div className="relative flex items-start justify-between">
            {/* Connecting line behind icons */}
            <div
              className="absolute top-6 left-[calc(16.67%+6px)] hidden sm:block"
              style={{
                width: "calc(66.66% - 12px)",
                height: "1px",
                backgroundColor: "var(--lp-border-strong)",
              }}
            />

            {steps.map((step) => (
              <div
                key={step.num}
                className="relative flex flex-col items-center text-center"
                style={{ width: "33.33%" }}
              >
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--lp-border)] bg-white">
                  <step.icon className="h-5 w-5 text-[var(--lp-accent)]" />
                </div>
                <p className="mt-3 text-xs font-bold text-[var(--lp-ink-tertiary)]">
                  {step.num}
                </p>
                <h3 className="mt-0.5 text-sm font-semibold text-[var(--lp-ink)]">
                  {step.title}
                </h3>
                <p className="mt-1 max-w-[180px] text-xs leading-relaxed text-[var(--lp-ink-tertiary)]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile — compact vertical */}
        <div className="mt-8 sm:hidden space-y-2.5">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className="flex items-center gap-3 rounded-lg border border-[var(--lp-border)] bg-white px-4 py-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--lp-border)] bg-white text-xs font-bold text-[var(--lp-accent)]">
                {step.num}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[var(--lp-ink)]">
                  {step.title}
                </h3>
                <p className="text-xs text-[var(--lp-ink-tertiary)] truncate">
                  {step.description}
                </p>
              </div>
              {i < steps.length - 1 && (
                <span className="ml-auto text-xs text-[var(--lp-border-strong)]">→</span>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}