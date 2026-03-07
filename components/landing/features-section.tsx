import {
  FileText,
  Users,
  Calendar,
  BarChart3,
  Shield,
  Award,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Submissions & Peer Review",
    description:
      "Authors submit papers online. You assign reviewers, collect evaluations, and communicate decisions — all from one dashboard.",
  },
  {
    icon: Users,
    title: "Registration & Payments",
    description:
      "Track registrations, collect payments, and manage participant records automatically — no manual spreadsheets.",
  },
  {
    icon: Calendar,
    title: "Schedules & Deadlines",
    description:
      "Set submission windows, review periods, and event dates. AcadFlow keeps everyone on track with automated reminders.",
  },
  {
    icon: BarChart3,
    title: "Organizer Dashboard",
    description:
      "See submissions, review progress, and payment status at a glance. Know exactly where your conference stands.",
  },
  {
    icon: Shield,
    title: "Role-Based Access Control",
    description:
      "Organizers, reviewers, and participants each see only what they need. Secure logins and permissions built in.",
  },
  {
    icon: Award,
    title: "Automatic Certificates",
    description:
      "Generate professional participation and presentation certificates the moment decisions are published. No manual work.",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="bg-slate-50 px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">

        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">

          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            What You Can Do
          </p>

          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            One Platform for the Entire Conference Lifecycle
          </h2>

          <p className="mt-4 text-lg text-gray-600">
            Stop juggling spreadsheets, email threads, and shared drives.
            AcadFlow brings submissions, reviews, scheduling, and certificates into one place.
          </p>

        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">

          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border bg-white p-8 transition hover:shadow-md hover:-translate-y-1"
            >

              {/* Icon */}
              <div
                className="
                  mb-5 flex h-12 w-12 items-center justify-center
                  rounded-lg bg-indigo-100 text-indigo-600
                  group-hover:bg-indigo-600 group-hover:text-white
                  transition
                "
              >
                <feature.icon className="h-6 w-6" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="mt-2 leading-relaxed text-gray-600">
                {feature.description}
              </p>

            </div>
          ))}

        </div>

      </div>
    </section>
  );
}