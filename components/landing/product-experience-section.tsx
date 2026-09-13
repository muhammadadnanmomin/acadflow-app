import {
  FileText,
  Users,
  CreditCard,
  Calendar,
  Award,
  LayoutDashboard,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Product preview data — real modules from the Confairo platform     */
/* ------------------------------------------------------------------ */

const sidebarItems = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Submissions", icon: FileText, active: false },
  { label: "Reviews", icon: Users, active: false },
  { label: "Payments", icon: CreditCard, active: false },
  { label: "Schedule", icon: Calendar, active: false },
  { label: "Certificates", icon: Award, active: false },
];

const dashboardCards = [
  { icon: FileText, label: "Submissions", desc: "Collect papers" },
  { icon: Users, label: "Peer Review", desc: "Assign reviewers" },
  { icon: CreditCard, label: "Payments", desc: "Track fees" },
  { icon: Award, label: "Certificates", desc: "Generate & verify" },
];

const workflowSteps = ["Create", "Submit", "Review", "Decide", "Certify"];

export function ProductExperienceSection() {
  return (
    <section
      id="product"
      className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      style={{ backgroundColor: "var(--lp-surface-subtle)" }}
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--lp-ink)] sm:text-3xl">
            Built around the way conferences actually run.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--lp-ink-secondary)]">
            Give organizers a clear view of submissions, reviews, payments,
            schedules, and certificates from one workspace.
          </p>
        </div>

        {/*
         * Temporary illustrative preview.
         * Replace with verified product screenshot after landing page completion.
         * The preview below uses real module names from the Confairo application
         * but does not contain actual user data.
         */}

        {/* Desktop product preview */}
        <div className="mx-auto mt-12 max-w-4xl">
          <div
            className="hidden sm:block overflow-hidden rounded-lg border border-[var(--lp-border)]"
            style={{
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.04), 0 6px 24px rgba(0,0,0,0.04)",
            }}
          >
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 border-b border-[var(--lp-border)] bg-[var(--lp-surface-muted)] px-4 py-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[var(--lp-border-strong)]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[var(--lp-border-strong)]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[var(--lp-border-strong)]" />
              <span className="ml-3 text-xs font-medium text-[var(--lp-ink-tertiary)]">
                Conference Dashboard — Confairo
              </span>
            </div>

            <div className="flex bg-white">
              {/* Sidebar */}
              <div className="hidden md:block w-44 shrink-0 border-r border-[var(--lp-border)] bg-[var(--lp-surface-subtle)] p-3 space-y-0.5">
                {sidebarItems.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium ${
                      item.active
                        ? "bg-[var(--lp-accent-light)] text-[var(--lp-accent)]"
                        : "text-[var(--lp-ink-tertiary)]"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Content area */}
              <div className="flex-1 p-6">
                {/* Title */}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-[var(--lp-ink)]">
                    Conference Overview
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--lp-ink-tertiary)]">
                    Manage your entire conference workflow
                  </p>
                </div>

                {/* Module cards */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {dashboardCards.map((card) => (
                    <div
                      key={card.label}
                      className="rounded-md border border-[var(--lp-border)] p-3"
                    >
                      <card.icon className="h-4 w-4 text-[var(--lp-ink-tertiary)]" />
                      <p className="mt-2 text-xs font-semibold text-[var(--lp-ink-secondary)]">
                        {card.label}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[var(--lp-ink-tertiary)]">
                        {card.desc}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Workflow strip */}
                <div className="mt-4 rounded-md border border-[var(--lp-border)] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--lp-ink-tertiary)] mb-2.5">
                    Conference Workflow
                  </p>
                  <div className="flex items-center gap-1 text-xs font-medium">
                    {workflowSteps.map((step, i) => (
                      <div key={step} className="flex items-center gap-1">
                        <span
                          className={`rounded px-2 py-0.5 ${
                            i === 0
                              ? "bg-[var(--lp-accent-light)] text-[var(--lp-accent)]"
                              : "text-[var(--lp-ink-tertiary)]"
                          }`}
                        >
                          {step}
                        </span>
                        {i < workflowSteps.length - 1 && (
                          <span className="text-[var(--lp-border-strong)]">→</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile product preview */}
          <div className="sm:hidden">
            <div className="rounded-lg border border-[var(--lp-border)] bg-white p-4">
              <p className="text-xs font-semibold text-[var(--lp-ink)] mb-1">
                Conference Dashboard
              </p>
              <p className="text-[10px] text-[var(--lp-ink-tertiary)] mb-4">
                Manage your entire conference workflow
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {dashboardCards.map((card) => (
                  <div
                    key={card.label}
                    className="rounded-md border border-[var(--lp-border)] bg-[var(--lp-surface-subtle)] p-3 text-center"
                  >
                    <card.icon className="mx-auto h-4 w-4 text-[var(--lp-ink-tertiary)]" />
                    <p className="mt-1.5 text-[11px] font-semibold text-[var(--lp-ink-secondary)]">
                      {card.label}
                    </p>
                    <p className="mt-0.5 text-[9px] text-[var(--lp-ink-tertiary)]">
                      {card.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Mobile workflow */}
              <div className="mt-3 flex items-center justify-center gap-1 text-[10px] font-medium text-[var(--lp-ink-tertiary)]">
                {workflowSteps.map((step, i) => (
                  <span key={step} className="flex items-center gap-1">
                    <span>{step}</span>
                    {i < workflowSteps.length - 1 && <span>→</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
