"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/* ------------------------------------------------------------------ */
/*  Plan data — approved pricing                                       */
/* ------------------------------------------------------------------ */

const plans = [
  {
    name: "Essential",
    price: "₹0",
    period: "forever",
    features: [
      "1 conference",
      "Up to 150 paper submissions",
      "Core conference management",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "₹1,999",
    period: "per conference",
    features: [
      "For conferences with 150+ submissions",
      "Unlimited submissions",
      "Full conference management",
    ],
    cta: "Get Started",
    highlighted: true,
  },
  {
    name: "Institutional",
    price: "Custom",
    period: "pricing",
    features: [
      "For institutions and larger requirements",
      "Custom requirements and support",
    ],
    cta: "Contact Us",
    highlighted: false,
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
      className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      style={{ backgroundColor: "var(--lp-surface)" }}
    >
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--lp-ink)] sm:text-3xl">
            Simple plans for every conference.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--lp-ink-secondary)]">
            Choose the plan that fits your event.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mt-10 grid gap-5 md:grid-cols-3 items-start">

          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-lg border bg-white p-6 ${
                plan.highlighted
                  ? "border-[var(--lp-accent)] ring-1 ring-[var(--lp-accent)]"
                  : "border-[var(--lp-border)]"
              }`}
            >

              {/* Plan name */}
              <h3 className="text-sm font-semibold text-[var(--lp-ink)]">
                {plan.name}
              </h3>

              {/* Price */}
              <div className="mt-3">
                <span className="text-3xl font-bold text-[var(--lp-ink)]">
                  {plan.price}
                </span>
                <span className="ml-1 text-sm text-[var(--lp-ink-tertiary)]">
                  / {plan.period}
                </span>
              </div>

              {/* Features */}
              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--lp-accent)]" />
                    <span className="text-sm text-[var(--lp-ink-secondary)]">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                onClick={() => handlePlanClick(plan)}
                className={`mt-6 w-full ${
                  plan.highlighted
                    ? "bg-[var(--lp-accent)] text-white hover:bg-[var(--lp-accent-hover)]"
                    : ""
                }`}
                variant={plan.highlighted ? "default" : "outline"}
              >
                {plan.cta}
                {plan.highlighted && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>

            </div>
          ))}

        </div>

        {/* Fee note */}
        <p className="mt-6 text-center text-xs text-[var(--lp-ink-tertiary)]">
          A 4% platform fee applies on payments collected through Confairo.
          No credit card required to start.
        </p>

      </div>
    </section>
  );
}