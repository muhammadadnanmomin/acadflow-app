import {
  FileText,
  Brain,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Zap,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export function AIDemoSection() {
  return (
    <section
      id="ai-demo"
      className="relative overflow-hidden bg-white px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      {/* Background accent */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_60%,rgba(147,51,234,0.05),transparent)]" />
      </div>

      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
            AI in Action
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            From Paper to Decision{" "}
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              in Seconds
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
            AcadFlow transforms raw research papers into structured insights —
            helping reviewers save time and improve accuracy.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* LEFT — Explanation */}
          <div className="space-y-8">
            {/* Problem → Solution strip */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-red-100 bg-red-50/50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-red-500 mb-2">
                  ❌ The Problem
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Manual paper review is slow, inconsistent, and time-consuming.
                  Reviewers spend hours reading each submission.
                </p>
              </div>
              <div className="rounded-xl border border-green-100 bg-green-50/50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-green-600 mb-2">
                  ✅ The Solution
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  AcadFlow AI delivers instant, structured insights for better
                  and faster decisions.
                </p>
              </div>
            </div>

            {/* How it works steps */}
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-gray-900">
                How AI Review Works
              </h3>

              {[
                {
                  icon: FileText,
                  step: "1",
                  title: "Upload Paper",
                  desc: "Authors submit PDF or DOCX files through the portal",
                },
                {
                  icon: Brain,
                  step: "2",
                  title: "AI Analyzes",
                  desc: "Our AI reads the paper, extracts key sections, and evaluates quality",
                },
                {
                  icon: Zap,
                  step: "3",
                  title: "Get Structured Results",
                  desc: "Receive summary, strengths, weaknesses, and a decision recommendation",
                },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4 group">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 font-bold text-sm transition group-hover:bg-purple-600 group-hover:text-white">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {item.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6">
              {[
                { icon: Clock, value: "<30s", label: "Average analysis time" },
                {
                  icon: CheckCircle2,
                  value: "6",
                  label: "Structured sections",
                },
                { icon: Sparkles, value: "AI", label: "Powered by advanced AI models" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                    <stat.icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <p className="text-[11px] text-gray-500">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/20 transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              <Sparkles className="h-4 w-4" />
              Try AI Review Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* RIGHT — Visual Preview */}
          <div className="relative">
            {/* Paper upload → Result flow */}
            <div className="space-y-4">
              {/* Uploaded paper card */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      research_paper_v3.pdf
                    </p>
                    <p className="text-xs text-gray-400">2.4 MB • PDF</p>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
                </div>
                <p className="text-[11px] text-green-600 mt-1.5 font-medium">
                  ✓ Uploaded successfully
                </p>
              </div>

              {/* Arrow connector */}
              <div className="flex justify-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-px h-4 bg-gradient-to-b from-gray-300 to-purple-300" />
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                    <Brain className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="text-[10px] font-medium text-purple-600">
                    AI Processing
                  </p>
                  <div className="w-px h-4 bg-gradient-to-b from-purple-300 to-gray-300" />
                </div>
              </div>

              {/* AI Result card */}
              <div className="rounded-xl border border-purple-200 bg-white p-5 shadow-lg shadow-purple-100/50 ring-1 ring-purple-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-semibold text-gray-700">
                      AI Review Result
                    </span>
                  </div>
                  <span className="text-[10px] tracking-wider uppercase font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                    Complete
                  </span>
                </div>

                {/* Mini sections */}
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] font-semibold text-gray-600 mb-1">
                      📄 Summary
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      A novel deep learning framework for medical image
                      segmentation achieving 94.2% Dice score on cardiac MRI
                      datasets...
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50/50 rounded-lg p-3">
                      <p className="text-[11px] font-semibold text-green-700 mb-1">
                        ✅ Strengths
                      </p>
                      <p className="text-[11px] text-gray-500">
                        • Novel architecture
                      </p>
                      <p className="text-[11px] text-gray-500">
                        • Rigorous evaluation
                      </p>
                    </div>
                    <div className="bg-orange-50/50 rounded-lg p-3">
                      <p className="text-[11px] font-semibold text-orange-700 mb-1">
                        ⚠️ Weaknesses
                      </p>
                      <p className="text-[11px] text-gray-500">
                        • Limited datasets
                      </p>
                      <p className="text-[11px] text-gray-500">
                        • No ablation study
                      </p>
                    </div>
                  </div>

                  {/* Decision */}
                  <div className="flex items-center justify-between bg-green-50 rounded-lg p-3 border border-green-200">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                        Decision
                      </p>
                      <span className="inline-flex items-center px-2.5 py-0.5 mt-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        Minor Revision
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                        Confidence
                      </p>
                      <p className="text-lg font-bold text-gray-900">82%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-bl from-purple-100/30 to-transparent rounded-full blur-2xl -z-10" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-tr from-indigo-100/30 to-transparent rounded-full blur-2xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
