"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Brain, Sparkles, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/* ------------------------------------------------------------------ */
/*  Plan data                                                          */
/* ------------------------------------------------------------------ */

const plans = [
  {
    name: "Free",
    description: "Run your entire conference — free, with limited AI-powered insights.",
    price: "₹0",
    period: "forever",
    badge: "Start here",
    aiBadge: null,
    valueHighlight: null,
    features: [
      "1 conference",
      "Up to 150 submissions",
      "Paper submission & review system",
      "Reviewer assignment",
      "Participant management",
      "Email notifications",
      "Certificate generation",
      "Schedule management",
      "Payment collection enabled",
    ],
    aiFeatures: [
      "🧠 5 AI-powered paper analyses",
      "🤖 AI Reviewer Suggestions (limited)",
      "↳ Try AI-powered reviewer matching",
    ],
    cta: "Run Your First Conference Free",
    link: "/dashboard/onboarding/organization",
    popular: false,
    microCopy: null,
  },
  {
    name: "Pro",
    description: "For conferences that need faster reviews, smarter decisions, and unlimited scale.",
    price: "₹2,999",
    period: "per conference",
    badge: null,
    aiBadge: "🚀 AI-Powered Pro",
    valueHighlight: "Manage unlimited submissions with AI-powered review intelligence.",
    features: [
      "Unlimited submissions",
      "Full conference workflow",
      "Bulk email communication",
      "Analytics dashboard",
      "Priority support",
    ],
    aiFeatures: [
      "🤖 Smart AI Reviewer Assignment",
      "↳ Automatically matches papers with the best reviewers",
      "🧠 100 AI-powered analyses included",
      "➕ Add more AI analyses anytime",
    ],
    cta: "Start Your Conference with AI",
    link: "/dashboard/organizer",
    popular: true,
    microCopy: "Includes 100 AI analyses. Need more? Add additional analyses anytime.",
  },
  {
    name: "Institutional",
    description:
      "For universities and institutions running multiple conferences with advanced AI-powered workflows.",
    price: "Custom",
    period: "pricing",
    badge: null,
    aiBadge: null,
    valueHighlight: null,
    features: [
      "Unlimited conferences",
      "Unlimited submissions",
      "Institutional branding",
      "Dedicated onboarding & support",
    ],
    aiFeatures: [
      "🤖 Advanced AI Reviewer Assignment",
      "↳ High-accuracy reviewer matching at scale",
      "🧠 High-volume AI-powered analyses (custom limits)",
    ],
    cta: "Contact",
    link: "/contact",
    popular: false,
    microCopy: null,
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PricingSection() {
  const router = useRouter();
  const supabase = createClient();

  const handlePlanClick = async (plan: (typeof plans)[number]) => {
    // Institutional → always go to contact page
    if (plan.name === "Institutional") {
      router.push("/contact");
      return;
    }

    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push("/signup");
      return;
    }

    // Check if user has an organization
    const { data } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", session.user.id)
      .limit(1)
      .maybeSingle();

    if (!data) {
      router.push("/dashboard/onboarding/organization");
    } else {
      router.push("/dashboard/organizer");
    }
  };
  return (
    <section
      id="pricing"
      className="bg-gray-50 px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">

          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Simple, Honest Pricing
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Start for Free.{" "}
            <span className="text-indigo-600">Scale with AI When You&apos;re Ready.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
            Run your conference end-to-end for free. Upgrade when you need
            AI-powered insights and scale.{" "}
            <strong className="text-gray-900">No subscriptions, no hidden fees.</strong>
          </p>

          <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500">
            We only charge a small 4% fee on payments collected through the platform.
          </p>

        </div>

        {/* Pricing Cards */}
        <div className="mt-20 grid gap-8 md:grid-cols-3 items-start">

          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition hover:shadow-lg ${plan.popular
                ? "border-2 border-indigo-600 shadow-lg ring-1 ring-indigo-600/20 scale-[1.03]"
                : "border-gray-200"
                }`}
            >

              {/* MOST POPULAR badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-5 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-md">
                  Most Popular
                </div>
              )}

              <div className="text-center">

                {/* Plan name + AI badge */}
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    {plan.name}
                  </h3>
                  {plan.aiBadge && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      <Brain className="h-3 w-3" />
                      {plan.aiBadge}
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {plan.description}
                </p>

                {/* In-card badge */}
                {plan.badge && (
                  <div className="mt-3 inline-block rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-medium text-emerald-700">
                    {plan.badge}
                  </div>
                )}

                <div className="mt-6">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-sm text-gray-500">
                    {" "}/ {plan.period}
                  </span>
                </div>

                {/* Value highlight */}
                {plan.valueHighlight && (
                  <p className="mt-2 text-xs font-medium text-indigo-600">
                    {plan.valueHighlight}
                  </p>
                )}

              </div>

              {/* Standard features */}
              <ul className="mt-8 flex-1 space-y-3.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                    <span className="text-sm leading-relaxed text-gray-600">
                      {feature}
                    </span>
                  </li>
                ))}

                {/* AI features — visually distinct */}
                {plan.aiFeatures.map((feature) => {
                  // Subtext lines (prefixed with ↳) render as small gray helper text
                  if (feature.startsWith("↳")) {
                    return (
                      <li key={feature} className="flex items-start gap-3 -mt-1.5 ml-8">
                        <span className="text-xs leading-relaxed text-gray-400">
                          {feature.slice(2)}
                        </span>
                      </li>
                    );
                  }
                  return (
                    <li key={feature} className="flex items-start gap-3">
                      <Zap className="mt-0.5 h-5 w-5 shrink-0 text-purple-500" />
                      <span className="text-sm leading-relaxed font-medium text-purple-700">
                        {feature}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* Upgrade hint for Free plan */}
              {plan.name === "Free" && (
                <p className="mt-2 text-center text-xs text-gray-500">
                  Upgrade anytime to unlock more AI-powered analyses
                </p>
              )}

              <Button
                onClick={() => handlePlanClick(plan)}
                className={`mt-8 w-full ${plan.popular
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : ""
                  }`}
                variant={plan.popular ? "default" : "outline"}
                size="lg"
              >
                {plan.cta}
                {plan.popular && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>

              {/* Micro copy */}
              {plan.microCopy && (
                <p className="mt-3 text-center text-xs text-gray-400">
                  {plan.microCopy}
                </p>
              )}

            </div>
          ))}

        </div>

        {/* AI insight line */}
        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-500">
          <Sparkles className="h-3.5 w-3.5 text-purple-500" />
          ⚡ Reduce review time by up to 70% with AI-powered insights
        </p>

        {/* Bottom notes */}
        <div className="mt-10 space-y-2.5 text-center">
          <p className="text-sm text-gray-500">
            Pro pricing may increase as the platform grows. Lock in your rate today.
          </p>
          <p className="text-sm text-gray-500">
            Running multiple conferences per year?{" "}
            <Link href="/contact" className="font-medium text-indigo-600 hover:text-indigo-700">
              Get custom institutional pricing →
            </Link>
          </p>
        </div>

      </div>
    </section>
  );
}