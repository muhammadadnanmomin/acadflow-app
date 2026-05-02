import { Brain, Search, UserCheck, Sparkles } from "lucide-react";

const aiFeatures = [
  {
    icon: UserCheck,
    emoji: "🤖",
    title: "Smart Reviewer Assignment",
    description: "Match papers with the best reviewers instantly",
  },
  {
    icon: Brain,
    emoji: "🧠",
    title: "AI Paper Analysis",
    description: "Get summary, strengths, weaknesses, and decision",
  },
  {
    icon: Search,
    emoji: "🔍",
    title: "AI Similarity Detection",
    description: "Identify patterns and potential risks",
  },
];

export function AIFeaturesSection() {
  return (
    <section
      id="ai-features"
      className="relative overflow-hidden bg-gradient-to-b from-gray-950 to-gray-900 px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      {/* Background accents */}
      <div className="absolute inset-0 -z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(147,51,234,0.1),transparent)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08),transparent_60%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-sm font-medium text-purple-300">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Intelligence
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            ✨ AI-Powered Features
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-400">
            Let AI handle the heavy lifting — from reviewing papers to assigning
            the right reviewers and detecting issues.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {aiFeatures.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/80 p-8 transition-all duration-300 hover:border-purple-500/40 hover:bg-gray-900 hover:shadow-xl hover:shadow-purple-500/5"
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="relative">
                {/* Icon */}
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 transition-all group-hover:bg-purple-500/20 group-hover:scale-110">
                  <feature.icon className="h-7 w-7" />
                </div>

                {/* Title */}
                <h3 className="mt-6 text-xl font-bold text-white">
                  {feature.emoji} {feature.title}
                </h3>

                {/* Description */}
                <p className="mt-3 text-base leading-relaxed text-gray-400">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
