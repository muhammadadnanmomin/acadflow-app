import { GitBranch, ShieldCheck, ClipboardCheck, BadgeCheck } from "lucide-react";

const trustSignals = [
  {
    icon: GitBranch,
    title: "Structured workflows",
    label: "Submission to certificate",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    label: "Organizers, reviewers & participants",
  },
  {
    icon: ClipboardCheck,
    title: "Review management",
    label: "Assignments, reviews & decisions",
  },
  {
    icon: BadgeCheck,
    title: "Certificate verification",
    label: "Generate and verify certificates",
  },
];

export function TrustSection() {
  return (
    <section
      id="trust"
      className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8"
      style={{ backgroundColor: "white" }}
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--lp-ink)] sm:text-3xl">
            Designed for academic conference workflows.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--lp-ink-secondary)]">
            Structured workflows, role-based access, review management,
            and certificate verification — built around
            the needs of conference teams.
          </p>
        </div>

        {/* Compact trust indicators — 2×2 grid */}
        <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-[var(--lp-border)] bg-white p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {trustSignals.map((signal) => (
              <div key={signal.title} className="flex items-start gap-3">
                <signal.icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--lp-accent)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--lp-ink)]">
                    {signal.title}
                  </p>
                  <p className="text-xs text-[var(--lp-ink-tertiary)]">
                    {signal.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
