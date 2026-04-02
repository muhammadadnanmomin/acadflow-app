import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Dr. Priya Sharma",
    role: "Conference Chair, ICASET 2025",
    institution: "NIT Warangal",
    quote:
      "We managed 320 paper submissions entirely on AcadFlow. What used to take us weeks of email coordination was done in days. The certificate generation alone saved us 40+ hours.",
    highlight: "320 submissions managed",
  },
  {
    name: "Prof. Rajesh Gupta",
    role: "Head, CS Department",
    institution: "University of Mumbai",
    quote:
      "I was skeptical at first — we'd always used Google Forms. But once I saw the organizer dashboard, I couldn't go back. Knowing the status of every paper, every reviewer, every payment in real time is a game changer.",
    highlight: "Replaced 5 tools with 1",
  },
  {
    name: "Dr. Meera Krishnan",
    role: "Organizing Secretary, NCCSE 2025",
    institution: "Anna University",
    quote:
      "The review process was smooth. Reviewers got clear instructions, structured forms, and deadlines. No more chasing people on WhatsApp. We published results and certificates on the same day.",
    highlight: "Same-day certificates",
  },
];

const useCases = [
  {
    type: "Small Department Conference",
    papers: "30–80 papers",
    description:
      "Perfect for annual department seminars. Free plan covers everything — submissions, reviews, and certificates.",
  },
  {
    type: "University-Level Conference",
    papers: "150–500 papers",
    description:
      "Multi-track conferences with external reviewers. Use Early Adopter plan for unlimited submissions and analytics.",
  },
  {
    type: "National / International Conference",
    papers: "500+ papers",
    description:
      "Large-scale events with multiple organizing committees. Enterprise plan with institutional branding and SLA support.",
  },
];

export function SocialProofSection() {
  return (
    <section id="testimonials" className="bg-gray-50 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">

          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Trusted by Organizers
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            What Conference Organizers Are Saying
          </h2>

        </div>

        {/* Testimonials */}
        <div className="mt-14 grid gap-6 md:grid-cols-3">

          {testimonials.map((t) => (
            <div
              key={t.name}
              className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-8 transition hover:border-indigo-100 hover:shadow-md"
            >

              {/* Stars */}
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <div className="relative mt-5 flex-1">
                <Quote className="absolute -left-1 -top-2 h-8 w-8 text-gray-100" />
                <p className="relative z-10 leading-relaxed text-gray-700">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              {/* Highlight */}
              <div className="mt-5 inline-flex self-start rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                {t.highlight}
              </div>

              {/* Author */}
              <div className="mt-5 border-t border-gray-100 pt-5">
                <p className="font-semibold text-gray-900">{t.name}</p>
                <p className="text-sm text-gray-500">{t.role}</p>
                <p className="text-sm text-gray-400">{t.institution}</p>
              </div>

            </div>
          ))}

        </div>

        {/* Use Cases */}
        <div className="mt-24">

          <div className="mx-auto max-w-3xl text-center">
            <h3 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Built for Every Scale of Conference
            </h3>
            <p className="mt-3 text-gray-600">
              Whether you&apos;re running a departmental seminar or a national symposium,
              AcadFlow adapts to your needs.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">

            {useCases.map((uc) => (
              <div
                key={uc.type}
                className="rounded-xl border border-gray-200 bg-white p-6 transition hover:border-indigo-100 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">{uc.type}</h4>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    {uc.papers}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {uc.description}
                </p>
              </div>
            ))}

          </div>

        </div>

      </div>
    </section>
  );
}
