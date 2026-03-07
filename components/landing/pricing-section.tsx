import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { PRO_CONFERENCE_PRICE } from "@/lib/config/pricing";

/* ------------------------------------------------------------------ */
/*  Plan data                                                          */
/* ------------------------------------------------------------------ */

const plans = [
  {
    name: "Free",
    description:
      "Everything you need to run your first academic conference on AcadFlow.",
    price: "₹0",
    period: "forever",
    badge: "Great for small conferences",
    valueHighlight: null,
    features: [
      "1 conference",
      "Up to 150 paper submissions",
      "Paper submission portal",
      "Peer review workflow",
      "Reviewer assignment",
      "Participant management",
      "Email notifications",
      "Certificate generation",
      "Conference schedule management",
    ],
    cta: "Start Free",
    link: "/dashboard/onboarding/organization",
    popular: false,
  },
  {
    name: "Early Adopter",
    description:
      "The complete conference management workflow for growing academic events.",
    price: `₹${PRO_CONFERENCE_PRICE.toLocaleString("en-IN")}`,
    period: "per conference",
    badge: null,
    valueHighlight: "Perfect for conferences with 150+ submissions.",
    features: [
      "Unlimited submissions",
      "Full conference management workflow",
      "Advanced reviewer management",
      "Bulk email communication",
      "Submission reports and analytics",
      "Priority support",
    ],
    cta: "Start Conference",
    link: "/dashboard/billing/upgrade",
    popular: true,
  },
  {
    name: "Enterprise",
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
      "Advanced analytics dashboard",
      "Dedicated onboarding support",
      "Priority support",
    ],
    cta: "Contact Sales",
    link: "/contact",
    popular: false,
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="bg-slate-50 px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">

          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Simple &amp; Transparent Pricing
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Pricing Built for
            <span className="block text-indigo-600 mt-1">
              Academic Conferences
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-600">
            Manage submissions, peer reviews, schedules, and certificates in one
            modern platform designed for academic conferences.
          </p>

        </div>

        {/* Pricing Cards */}
        <div className="mt-20 grid gap-8 md:grid-cols-3">

          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border bg-white p-8 shadow-sm transition hover:shadow-lg ${plan.popular
                ? "border-indigo-600 shadow-md scale-[1.04]"
                : "border-gray-200"
                }`}
            >

              {/* MOST POPULAR badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white shadow">
                  MOST POPULAR
                </div>
              )}

              <div className="text-center">

                <h3 className="text-xl font-semibold text-gray-900">
                  {plan.name}
                </h3>

                <p className="mt-1 text-sm text-gray-600">
                  {plan.description}
                </p>

                {/* In-card badge (Free plan) */}
                {plan.badge && (
                  <div className="mt-3 inline-block rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-medium text-emerald-700">
                    {plan.badge}
                  </div>
                )}

                <div className="mt-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-500">
                    {" "} / {plan.period}
                  </span>
                </div>

                {/* Value highlight (Early Adopter) */}
                {plan.valueHighlight && (
                  <p className="mt-2 text-xs font-medium text-indigo-600">
                    {plan.valueHighlight}
                  </p>
                )}

              </div>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                    <span className="text-gray-600 leading-relaxed">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href={plan.link}>
                <Button
                  className="mt-8 w-full"
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </Link>

            </div>
          ))}

        </div>

        {/* Bottom notes */}
        <div className="mt-12 space-y-2 text-center text-sm text-gray-500">
          <p>
            ⏳ Early adopter pricing may increase as the platform grows.
          </p>
          <p>
            🎓 Universities and institutions can request custom plans at{" "}
            <span className="font-medium text-indigo-600">
              acadflow.platform@gmail.com
            </span>
          </p>
        </div>

      </div>
    </section>
  );
}