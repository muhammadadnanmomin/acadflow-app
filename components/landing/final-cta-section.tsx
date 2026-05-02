"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Sparkles, Shield } from "lucide-react";

export function FinalCTASection() {
  const router = useRouter();
  const supabase = createClient();

  const handleGetStarted = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push("/dashboard/onboarding/organization");
    } else {
      router.push("/signup");
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(255,255,255,0.08),transparent)]" />
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Start Your AI-Powered Conference Today
        </h2>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={handleGetStarted}
            className="group inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-base font-semibold text-indigo-700 shadow-xl shadow-black/10 transition-all hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-2xl"
          >
            <Sparkles className="h-4 w-4" />
            Get Started for Free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <p className="mt-5 inline-flex items-center gap-1.5 text-sm text-indigo-100">
          <Shield className="h-4 w-4" />
          No credit card required
        </p>
      </div>
    </section>
  );
}
