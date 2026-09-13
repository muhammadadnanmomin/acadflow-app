import {
  FileText,
  Users,
  CreditCard,
  Calendar,
  Award,
  LayoutDashboard,
} from "lucide-react";

const capabilities = [
  {
    icon: FileText,
    title: "Paper Management",
    description: "Collect, organize, and track conference submissions.",
    flow: "Collect → Organize → Track",
  },
  {
    icon: Users,
    title: "Peer Review",
    description: "Assign reviewers and manage reviews through decision.",
    flow: "Assign → Review → Decide",
  },
  {
    icon: CreditCard,
    title: "Registration & Payments",
    description: "Manage participant registration and conference fees.",
    flow: "Register → Collect → Reconcile",
  },
  {
    icon: Calendar,
    title: "Scheduling",
    description: "Organize sessions, presentations, and conference schedules.",
    flow: "Sessions → Presentations → Agenda",
  },
  {
    icon: Award,
    title: "Certificates",
    description:
      "Generate and verify certificates for participants and contributors.",
    flow: "Generate → Issue → Verify",
  },
  {
    icon: LayoutDashboard,
    title: "Conference Operations",
    description: "Manage organizers, participants, communication, and access.",
    flow: "Organizers → Participants → Access",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      style={{ backgroundColor: "var(--lp-surface)" }}
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--lp-ink)] sm:text-3xl">
            Everything you need to run the conference.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--lp-ink-secondary)]">
            Manage the core workflows from one place.
          </p>
        </div>

        {/* Capability cards — 3×2 desktop, 2-col tablet, 1-col mobile */}
        <div className="mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((cap) => (
            <div
              key={cap.title}
              className="rounded-lg border border-[var(--lp-border)] bg-[var(--lp-surface-subtle)] p-6 transition-colors duration-200 hover:border-[var(--lp-border-strong)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--lp-border)] bg-white">
                <cap.icon className="h-5 w-5 text-[var(--lp-accent)]" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[var(--lp-ink)]">
                {cap.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--lp-ink-tertiary)]">
                {cap.description}
              </p>
              {/* Micro-label — visual workflow hint */}
              <p className="mt-3 text-[11px] font-medium text-[var(--lp-ink-tertiary)] opacity-60">
                {cap.flow}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}