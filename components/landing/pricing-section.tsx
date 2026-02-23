import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    description: "Perfect for first-time conference organizers",
    price: "₹0",
    period: "to get started",
    features: [
      "Create 1 conference",
      "Manage submissions & reviews",
      "Basic participant management",
      "Email support",
    ],
    cta: "Start Free",
    link: "/signup?role=organizer",
    popular: false,
  },
  {
    name: "Conference Plan",
    description: "Ideal for college & departmental conferences",
    price: "₹500",
    period: "per conference",
    features: [
      "Unlimited participants",
      "Paper submission & peer review",
      "Integrated payment collection",
      "Digital certificate generation",
      "Priority support",
    ],
    cta: "Host a Conference",
    link: "/signup?role=organizer",
    popular: true,
  },
  {
    name: "Institution Plan",
    description: "Best for universities & recurring events",
    price: "Custom",
    period: "pricing",
    features: [
      "Multiple conferences",
      "Institution branding",
      "Dedicated onboarding",
      "Advanced reports & insights",
      "Training & priority assistance",
    ],
    cta: "Contact Us",
    link: "/#footer",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="bg-slate-50 px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">

          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Plans & Pricing
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Start Free. Upgrade When You Host.
          </h2>

          <p className="mt-4 text-lg text-gray-600">
            Try AcadFlow at no cost. Pay only when you run your conference.
          </p>

        </div>

        {/* Plans */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3">

          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border bg-white p-8 shadow-sm transition hover:shadow-lg ${
                plan.popular
                  ? "border-indigo-600 shadow-md scale-[1.02]"
                  : "border-gray-200"
              }`}
            >

              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white shadow">
                  MOST USED
                </div>
              )}

              {/* Plan Info */}
              <div className="text-center">

                <h3 className="text-xl font-semibold text-gray-900">
                  {plan.name}
                </h3>

                <p className="mt-1 text-sm text-gray-600">
                  {plan.description}
                </p>

                <div className="mt-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-500">
                    {" "} / {plan.period}
                  </span>
                </div>

              </div>

              {/* Features */}
              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3"
                  >
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                    <span className="text-gray-600 leading-relaxed">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
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

        {/* Trust Note */}
        <div className="mt-12 text-center text-sm text-gray-500">
          No hidden fees. No subscriptions.  
          Institutions & universities can request custom plans at{" "}
          <span className="font-medium text-indigo-600">
            acadflow.platform@gmail.com
          </span>
        </div>

      </div>
    </section>
  );
}