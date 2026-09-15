import {
  FileText,
  Users,
  Scale,
  UserPlus,
  CreditCard,
  Calendar,
  Award,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";

/* Two logical groups in the conference lifecycle */
const topRow = [
  { icon: FileText, label: "Submission" },
  { icon: Users, label: "Review" },
  { icon: Scale, label: "Decision" },
];

const bottomRow = [
  { icon: UserPlus, label: "Registration" },
  { icon: CreditCard, label: "Payment" },
  { icon: Calendar, label: "Schedule" },
  { icon: Award, label: "Certificate" },
  { icon: BadgeCheck, label: "Verification" },
];

const allItems = [...topRow, ...bottomRow];

export function ComparisonSection() {
  return (
    <section
      id="comparison"
      className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      style={{ backgroundColor: "var(--lp-surface-subtle)" }}
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--lp-ink)] sm:text-3xl">
            Everything connected in one conference workspace.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--lp-ink-secondary)]">
            Instead of switching between separate tools for each stage,
            Confairo keeps the full workflow organized in one place.
          </p>
        </div>

        {/* Connected workflow visual */}
        <div className="mx-auto mt-10 max-w-3xl">
          <div className="rounded-lg border border-[var(--lp-border)] bg-white p-6 sm:p-8">

            {/* Desktop — two grouped rows with arrows */}
            <div className="hidden sm:block space-y-5">
              {/* Row 1: Submission → Review → Decision */}
              <div className="flex items-center justify-center gap-2">
                {topRow.map((item, i) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className="flex flex-col items-center text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--lp-border)] bg-[var(--lp-surface-subtle)]">
                        <item.icon className="h-5 w-5 text-[var(--lp-accent)]" />
                      </div>
                      <span className="mt-2 text-xs font-medium text-[var(--lp-ink-secondary)]">
                        {item.label}
                      </span>
                    </div>
                    {i < topRow.length - 1 && (
                      <ArrowRight className="h-3.5 w-3.5 text-[var(--lp-border-strong)] mb-4" />
                    )}
                  </div>
                ))}
              </div>

              {/* Vertical connector */}
              <div className="flex justify-center">
                <div
                  className="h-4 w-px"
                  style={{ backgroundColor: "var(--lp-border-strong)" }}
                />
              </div>

              {/* Row 2: Registration → Payment → Schedule → Certificate → Verification */}
              <div className="flex items-center justify-center gap-2">
                {bottomRow.map((item, i) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className="flex flex-col items-center text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--lp-border)] bg-[var(--lp-surface-subtle)]">
                        <item.icon className="h-5 w-5 text-[var(--lp-accent)]" />
                      </div>
                      <span className="mt-2 text-xs font-medium text-[var(--lp-ink-secondary)]">
                        {item.label}
                      </span>
                    </div>
                    {i < bottomRow.length - 1 && (
                      <ArrowRight className="h-3.5 w-3.5 text-[var(--lp-border-strong)] mb-4" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile — 2-column compact grid */}
            <div className="grid grid-cols-2 gap-2.5 sm:hidden">
              {allItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2.5 rounded-md border border-[var(--lp-border)] bg-[var(--lp-surface-subtle)] px-3 py-2.5"
                >
                  <item.icon className="h-4 w-4 shrink-0 text-[var(--lp-accent)]" />
                  <span className="text-xs font-medium text-[var(--lp-ink-secondary)]">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom statement */}
            <p className="mt-5 text-center text-sm text-[var(--lp-ink-tertiary)]">
              All connected through one conference workspace.
            </p>

          </div>
        </div>

      </div>
    </section>
  );
}
