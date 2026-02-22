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
    title: "Paper Submission & Review",
    description:
      "Manage paper submissions, reviewer assignments, and evaluations in one secure workflow.",
  },
  {
    icon: Users,
    title: "Participant Management",
    description:
      "Handle registrations, payments, and participant records with automated tracking.",
  },
  {
    icon: Calendar,
    title: "Conference Scheduling",
    description:
      "Organize sessions, timelines, and important deadlines from a central dashboard.",
  },
  {
    icon: BarChart3,
    title: "Organizer Dashboard",
    description:
      "Monitor submissions, reviews, and registrations with real-time status updates.",
  },
  {
    icon: Shield,
    title: "Secure Authentication",
    description:
      "Role-based access for organizers, reviewers, and participants with strong security.",
  },
  {
    icon: Award,
    title: "Digital Certificates",
    description:
      "Generate and distribute verified participation and presentation certificates.",
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
            Features
          </p>

          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything You Need to Run Academic Conferences
          </h2>

          <p className="mt-4 text-lg text-gray-600">
            AcadFlow provides essential tools for managing conferences
            efficiently — from submission to certification.
          </p>

        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">

          {features.map((feature) => (
            <div
              key={feature.title}
              className="
                group rounded-xl border bg-white p-8
                transition hover:shadow-md
              "
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
