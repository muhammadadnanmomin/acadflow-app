"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  Clock,
  FileText,
  Shield,
  Sparkles,
  Brain,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { BookDemoButton } from "@/components/demo/BookDemoButton";

export function HeroSection() {
  const router = useRouter();
  const supabase = createClient();


  const handleGetStarted = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push("/dashboard/participant/overview");
    } else {
      router.push("/signup");
    }
  };

  const handleOrganizerSetup = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push("/dashboard/onboarding/organization");
    } else {
      router.push("/signup");
    }
  };

  return (
    <section id="hero" className="relative overflow-hidden bg-white px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28 lg:px-8 lg:pt-28 lg:pb-32">

      {/* Subtle background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.06),transparent_70%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl">

        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 items-center">

          {/* Left — Text Content */}
          <div className="mx-auto max-w-2xl text-center lg:text-left lg:mx-0">

            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50/80 px-4 py-1.5 text-sm font-medium text-purple-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Conference Management
            </div>

            {/* Heading */}
            <h1 className="text-balance text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.15]">
              Run Your Conference with{" "}
              <span className="relative">
                <span className="relative z-10 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  AI-Powered Precision
                </span>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl sm:leading-8">
              Automate reviews, assign the right reviewers, and detect issues instantly —{" "}
              <strong className="text-gray-900">all from one platform.</strong>
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start sm:justify-center">

              {/* Primary CTA */}
              <button
                onClick={handleGetStarted}
                className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:shadow-xl hover:shadow-indigo-600/30 hover:-translate-y-0.5"
              >
                <Sparkles className="h-4 w-4" />
                Start Free Conference
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>

              {/* Secondary CTA — Book Demo */}
              <BookDemoButton variant="secondary" />

            </div>

            {/* Organizer link */}
            <p className="mt-5 text-sm text-gray-500 lg:text-left text-center">
              Already organizing a conference?{" "}
              <button
                onClick={handleOrganizerSetup}
                className="font-medium text-indigo-600 transition hover:text-indigo-700 hover:underline"
              >
                Set up your organizer workspace →
              </button>
            </p>

            {/* Trust indicators */}
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-3 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-500" />
                No credit card required
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-indigo-500" />
                Live in under 5 minutes
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-amber-500" />
                Free for up to 150 submissions
              </span>
            </div>

          </div>

          {/* Right — AI Review Preview Mock */}
          <div className="relative hidden lg:block">
            <div className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl shadow-gray-200/60">

              {/* Mock header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-700">🧠 AI Paper Reviewer</span>
                </div>
                <span className="text-[10px] tracking-wider uppercase font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  AI Analysis Result
                </span>
              </div>

              {/* Decision + Score */}
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">🧾 Final Decision</p>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700 ring-2 ring-green-400/30">
                      Accept
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">📊 Confidence</p>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2.5 bg-white rounded-full overflow-hidden border border-gray-200/50">
                        <div className="h-full w-[87%] bg-green-500 rounded-full" />
                      </div>
                      <span className="text-sm font-bold text-gray-700">87%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <FileText className="h-3 w-3 text-blue-500" /> 📄 Summary
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  This paper presents a novel approach to federated learning with differential privacy guarantees, achieving state-of-the-art results on benchmark datasets...
                </p>
              </div>

              {/* Strengths */}
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" /> ✅ Strengths
                </p>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 flex items-start gap-1.5">
                    <span className="text-gray-300 mt-0.5">•</span> Strong theoretical foundation with formal proofs
                  </p>
                  <p className="text-xs text-gray-500 flex items-start gap-1.5">
                    <span className="text-gray-300 mt-0.5">•</span> Comprehensive experimental evaluation
                  </p>
                </div>
              </div>

              {/* Weaknesses */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <BarChart3 className="h-3 w-3 text-orange-500" /> ⚠️ Weaknesses
                </p>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 flex items-start gap-1.5">
                    <span className="text-gray-300 mt-0.5">•</span> Limited discussion on computational overhead
                  </p>
                </div>
              </div>

              {/* Decorative gradient overlay */}
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-tl from-purple-100/40 to-transparent rounded-full blur-2xl -z-10" />
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-indigo-100/40 to-transparent rounded-full blur-2xl -z-10" />
            </div>

            {/* Floating label */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-full px-4 py-1.5 shadow-md text-xs font-medium text-gray-600 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-purple-500" />
              Analyzed in 12 seconds
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}