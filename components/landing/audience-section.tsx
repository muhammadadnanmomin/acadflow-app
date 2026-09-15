import { ClipboardList, Building2, BookOpen } from "lucide-react";

const audiences = [
  {
    icon: ClipboardList,
    label: "RUN CONFERENCES",
    title: "Conference Organizers",
    description:
      "Run submissions, reviews, registrations, schedules, and certificates.",
  },
  {
    icon: Building2,
    label: "MANAGE TEAMS",
    title: "Universities & Institutions",
    description:
      "Give teams a shared workspace for academic event management.",
  },
  {
    icon: BookOpen,
    label: "SUPPORT RESEARCH",
    title: "Academic Communities",
    description:
      "Manage research-focused conferences with structured workflows.",
  },
];

export function AudienceSection() {
  return (
    <section
      id="audience"
      className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      style={{ backgroundColor: "var(--lp-surface-subtle)" }}
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--lp-ink)] sm:text-3xl">
            Built for the people behind academic conferences.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--lp-ink-secondary)]">
            Whether you organize one event or manage conferences across an
            institution, Confairo keeps the work organized.
          </p>
        </div>

        {/* Audience cards */}
        <div className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-3">
          {audiences.map((aud) => (
            <div
              key={aud.title}
              className="rounded-lg border border-[var(--lp-border)] bg-white p-5 text-center"
            >
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-[var(--lp-border)] bg-[var(--lp-surface-subtle)]">
                <aud.icon className="h-5 w-5 text-[var(--lp-accent)]" />
              </div>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--lp-accent)]">
                {aud.label}
              </p>
              <h3 className="mt-1 text-sm font-semibold text-[var(--lp-ink)]">
                {aud.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--lp-ink-tertiary)]">
                {aud.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
