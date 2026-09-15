import {
  Users,
  FileSearch,
  CopyCheck,
  FileText,
  Brain,
  UserCheck,
  CheckCircle2,
} from "lucide-react";

const aiCapabilities = [
  {
    icon: Users,
    title: "Reviewer Suggestions",
    description:
      "Get AI-assisted suggestions for matching submissions with reviewers.",
  },
  {
    icon: FileSearch,
    title: "Paper Analysis",
    description:
      "Use AI to analyze papers and surface structured review insights.",
  },
  {
    icon: CopyCheck,
    title: "Similarity Detection",
    description:
      "Identify potential overlap between submissions for further review.",
  },
];

const workflowSteps = [
  { icon: FileText, label: "Submission" },
  { icon: Brain, label: "AI Assistance" },
  { icon: UserCheck, label: "Review Insights" },
  { icon: CheckCircle2, label: "Human Decision" },
];

export function AIDemoSection() {
  return (
    <section
      id="ai-assistance"
      className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      style={{ backgroundColor: "var(--lp-surface)" }}
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--lp-ink)] sm:text-3xl">
            AI assistance where it actually helps.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--lp-ink-secondary)]">
            Use AI to assist with reviewer selection, paper analysis, and
            similarity checks — while keeping people in control.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-5xl grid gap-8 lg:grid-cols-[1fr_auto] lg:gap-12 items-start">

          {/* Left — capability cards */}
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {aiCapabilities.map((cap) => (
              <div
                key={cap.title}
                className="flex items-start gap-3.5 rounded-lg border border-[var(--lp-border)] bg-[var(--lp-surface-subtle)] p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--lp-border)] bg-white">
                  <cap.icon className="h-4 w-4 text-[var(--lp-accent)]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--lp-ink)]">
                    {cap.title}
                  </h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--lp-ink-tertiary)]">
                    {cap.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right — AI workflow visual */}
          <div className="hidden lg:flex flex-col items-center">
            <div
              className="rounded-lg border border-[var(--lp-border)] bg-[var(--lp-surface-subtle)] px-6 py-5"
              style={{ width: "200px" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--lp-ink-tertiary)] text-center mb-4">
                AI in the workflow
              </p>
              <div className="flex flex-col items-center gap-1">
                {workflowSteps.map((step, i) => (
                  <div key={step.label} className="flex flex-col items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-md border"
                        style={{
                          borderColor:
                            i === 1
                              ? "var(--lp-accent)"
                              : "var(--lp-border)",
                          backgroundColor:
                            i === 1
                              ? "var(--lp-accent-light)"
                              : "white",
                        }}
                      >
                        <step.icon
                          className="h-3.5 w-3.5"
                          style={{
                            color:
                              i === 1
                                ? "var(--lp-accent)"
                                : "var(--lp-ink-tertiary)",
                          }}
                        />
                      </div>
                      <span
                        className="text-[11px] font-medium"
                        style={{
                          color:
                            i === 1
                              ? "var(--lp-accent)"
                              : "var(--lp-ink-tertiary)",
                        }}
                      >
                        {step.label}
                      </span>
                    </div>
                    {i < workflowSteps.length - 1 && (
                      <div
                        className="h-3 w-px"
                        style={{ backgroundColor: "var(--lp-border-strong)" }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Mobile AI workflow — horizontal strip */}
        <div className="mt-6 lg:hidden">
          <div className="rounded-lg border border-[var(--lp-border)] bg-[var(--lp-surface-subtle)] px-4 py-3">
            <div className="flex items-center justify-center gap-1 text-[10px] font-medium">
              {workflowSteps.map((step, i) => (
                <span
                  key={step.label}
                  className="flex items-center gap-1"
                >
                  <span
                    style={{
                      color:
                        i === 1
                          ? "var(--lp-accent)"
                          : "var(--lp-ink-tertiary)",
                    }}
                  >
                    {step.label}
                  </span>
                  {i < workflowSteps.length - 1 && (
                    <span className="text-[var(--lp-border-strong)]">→</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mx-auto mt-6 max-w-lg text-center text-xs leading-relaxed text-[var(--lp-ink-tertiary)] opacity-70">
          AI provides suggestions and analysis to assist reviewers. All academic
          decisions remain with the conference organizers and review committee.
        </p>

      </div>
    </section>
  );
}
