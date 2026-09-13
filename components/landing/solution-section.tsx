import {
  Plus,
  FileText,
  Users,
  Scale,
  UserPlus,
  Calendar,
  Award,
} from "lucide-react";

const workflowSteps = [
  {
    num: "01",
    icon: Plus,
    label: "Create",
    desc: "Set up your conference",
  },
  {
    num: "02",
    icon: FileText,
    label: "Submit",
    desc: "Collect papers",
  },
  {
    num: "03",
    icon: Users,
    label: "Review",
    desc: "Assign and manage peer review",
  },
  {
    num: "04",
    icon: Scale,
    label: "Decide",
    desc: "Track decisions",
  },
  {
    num: "05",
    icon: UserPlus,
    label: "Register",
    desc: "Manage participants and payments",
  },
  {
    num: "06",
    icon: Calendar,
    label: "Schedule",
    desc: "Organize sessions",
  },
  {
    num: "07",
    icon: Award,
    label: "Certify",
    desc: "Generate certificates",
  },
];

export function SolutionSection() {
  return (
    <section
      id="solution"
      className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      style={{ backgroundColor: "var(--lp-surface-subtle)" }}
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--lp-ink)] sm:text-3xl">
            One platform for the full conference workflow.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--lp-ink-secondary)]">
            Bring the essential parts of your conference into one organized workspace.
          </p>
        </div>

        {/* Desktop workflow — horizontal connected steps */}
        <div className="mt-14 hidden lg:block">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-start justify-between">
              {workflowSteps.map((step, i) => (
                <div key={step.label} className="flex items-start">
                  {/* Step */}
                  <div className="flex flex-col items-center text-center" style={{ width: "110px" }}>
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-lg border"
                      style={{
                        borderColor: i === 0 ? "var(--lp-accent)" : "var(--lp-border)",
                        backgroundColor: i === 0 ? "var(--lp-accent-light)" : "white",
                        color: i === 0 ? "var(--lp-accent)" : "var(--lp-ink-tertiary)",
                      }}
                    >
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className="mt-3 text-xs font-bold text-[var(--lp-ink-tertiary)]">
                      {step.num}
                    </span>
                    <span className="mt-0.5 text-sm font-semibold text-[var(--lp-ink)]">
                      {step.label}
                    </span>
                    <span className="mt-1 text-xs leading-snug text-[var(--lp-ink-tertiary)]">
                      {step.desc}
                    </span>
                  </div>

                  {/* Connector line */}
                  {i < workflowSteps.length - 1 && (
                    <div className="mt-5 flex items-center px-1">
                      <div
                        className="h-px w-6"
                        style={{ backgroundColor: "var(--lp-border-strong)" }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tablet workflow — 2-row grid */}
        <div className="mt-14 hidden sm:grid lg:hidden grid-cols-4 gap-4">
          {workflowSteps.map((step) => (
            <div
              key={step.label}
              className="flex flex-col items-center text-center rounded-lg border border-[var(--lp-border)] bg-white p-4"
            >
              <step.icon className="h-5 w-5 text-[var(--lp-ink-tertiary)]" />
              <span className="mt-2 text-xs font-bold text-[var(--lp-ink-tertiary)]">
                {step.num}
              </span>
              <span className="mt-0.5 text-sm font-semibold text-[var(--lp-ink)]">
                {step.label}
              </span>
              <span className="mt-1 text-xs leading-snug text-[var(--lp-ink-tertiary)]">
                {step.desc}
              </span>
            </div>
          ))}
        </div>

        {/* Mobile workflow — vertical list */}
        <div className="mt-10 sm:hidden space-y-3">
          {workflowSteps.map((step, i) => (
            <div
              key={step.label}
              className="flex items-center gap-4 rounded-lg border border-[var(--lp-border)] bg-white px-4 py-3"
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-xs font-bold"
                style={{
                  borderColor: i === 0 ? "var(--lp-accent)" : "var(--lp-border)",
                  backgroundColor: i === 0 ? "var(--lp-accent-light)" : "var(--lp-surface-subtle)",
                  color: i === 0 ? "var(--lp-accent)" : "var(--lp-ink-tertiary)",
                }}
              >
                {step.num}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--lp-ink)]">
                  {step.label}
                </p>
                <p className="text-xs text-[var(--lp-ink-tertiary)]">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom statement */}
        <p className="mx-auto mt-12 max-w-lg text-center text-sm leading-relaxed text-[var(--lp-ink-tertiary)]">
          From the first submission to the final certificate, Confairo keeps
          the workflow connected.
        </p>

      </div>
    </section>
  );
}
