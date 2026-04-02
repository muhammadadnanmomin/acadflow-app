"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/* ------------------------------------------------------------------ */
/*  Plan data                                                          */
/* ------------------------------------------------------------------ */

const plans = [
  {
    name: "Free",
    description: "Run your entire conference — free.",
    price: "₹0",
    period: "forever",
    badge: "Start here",
    valueHighlight: "Start and run your conference from submission to certificate — free",
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
    cta: "Run Your First Conference Free",
    link: "/dashboard/onboarding/organization",
    popular: false,
  },
  {
    name: "Pro",
    description: "For conferences scaling beyond 150 submissions.",
    price: "₹2,999",
    period: "per conference",
    badge: null,
    valueHighlight: "Scale your conference without losing control of submissions, reviews, and payments",
    features: [
      "Unlimited submissions",
      "Full conference workflow",
      "Bulk email communication",
      "Analytics dashboard",
      "Priority support",
    ],
    cta: "Start Your Conference",
    link: "/dashboard/organizer",
    popular: true,
  },
  {
    name: "Institutional",
    description:
      "For universities and institutions managing multiple conferences.",
    price: "Custom",
    period: "pricing",
    badge: null,
    valueHighlight: null,
    features: [
      "Unlimited conferences",
      "Unlimited submissions",
      "Institutional branding",
      "AI-powered features",
      "Dedicated onboarding & support",
    ],
    cta: "Contact",
    link: "/contact",
    popular: false,
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PricingSection() {
  const router = useRouter();
  const supabase = createClient();

  const handlePlanClick = async (plan: (typeof plans)[number]) => {
    // Enterprise → always go to contact page
    if (plan.name === "Enterprise") {
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
            <span className="text-indigo-600">Pay Only When You Scale.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
            Run your conference without upfront cost. Upgrade only when you
            need more scale.{" "}
            <strong className="text-gray-900">No subscriptions, no hidden fees.</strong>
          </p>

          <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500">
            We only charge a small 4% fee on payments collected through the platform.
          </p>

        </div>

        {/* Pricing Cards */}
        <div className="mt-20 grid gap-8 md:grid-cols-3">

          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition hover:shadow-lg ${plan.popular
                ? "border-indigo-600 shadow-md ring-1 ring-indigo-600 scale-[1.03]"
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

                <h3 className="text-xl font-bold text-gray-900">
                  {plan.name}
                </h3>

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

              <ul className="mt-8 flex-1 space-y-3.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                    <span className="text-sm leading-relaxed text-gray-600">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

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

            </div>
          ))}

        </div>

        {/* Bottom notes */}
        <div className="mt-14 space-y-2.5 text-center">
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