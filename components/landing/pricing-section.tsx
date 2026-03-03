import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    description: "Perfect for exploring AcadFlow features",
    price: "₹0",
    period: "forever",
    features: [
      "Create 1 conference",
      "Paper submission & review workflow",
      "Basic participant management",
      "No payment collection",
      "Email support",
    ],
    cta: "Start Free",
    link: "/signup?role=organizer",
    popular: false,
  },
  {
    name: "Conference Plan",
    description: "Best for academic conferences collecting fees",
    price: "7%",
    period: "per registration payment",
    features: [
      "Unlimited participants",
      "Integrated Razorpay payments",
      "Automatic organizer payouts",
      "Digital certificate generation",
      "Transparent fee breakdown",
      "Priority support",
    ],
    cta: "Host a Conference",
    link: "/signup?role=organizer",
    popular: true,
  },
  {
    name: "Institution Plan",
    description: "For universities & recurring conferences",
    price: "Custom %",
    period: "based on volume",
    features: [
      "Multiple conferences",
      "Reduced platform fee",
      "Institution branding",
      "Advanced analytics & reports",
      "Dedicated onboarding",
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

        {/* ── Hero Pricing Header ── */}
        <div className="mx-auto max-w-3xl text-center">

          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Simple &amp; Transparent Pricing
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Collect Conference Fees With Ease
            <span className="block text-indigo-600 mt-1">
              — Just 7% Platform Fee
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-600">
            Smooth, secure conference payments. Collect, transfer and manage
            registration fees effortlessly. Zero setup cost.
          </p>

        </div>

        {/* ── Big Pricing Highlight Block ── */}
        <div className="mx-auto mt-14 max-w-xl">
          <div className="relative rounded-2xl border border-indigo-100 bg-white p-8 sm:p-10 text-center shadow-lg">

            {/* Subtle glow */}
            <div className="absolute inset-0 -z-10 rounded-2xl bg-[radial-gradient(ellipse_at_center,rgba(79,70,229,0.06),transparent_70%)]" />

            <p className="text-sm font-medium text-gray-500">
              Start collecting fees at just
            </p>

            <p className="mt-4 text-7xl font-extrabold tracking-tight text-indigo-600 sm:text-8xl">
              7%
            </p>

            <p className="mt-2 text-base font-medium text-gray-700">
              Platform fee per registration payment<span className="text-gray-400">*</span>
            </p>

            <p className="mt-3 text-xs text-gray-400">
              *Payment gateway charges &amp; 18% GST applicable
            </p>

            <p className="mt-6 text-sm leading-relaxed text-gray-500 max-w-sm mx-auto">
              Access seamless checkout, automated payouts &amp; transparent reporting.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup?role=organizer">
                <Button className="px-8 h-11 text-sm font-semibold">
                  Start Hosting for Free
                </Button>
              </Link>
              <Link
                href="/#footer"
                className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
              >
                Contact Sales →
              </Link>
            </div>

          </div>
        </div>

        {/* ── Plan Cards (commented out) ── */}
        {/*
        <div className="mt-20 grid gap-8 lg:grid-cols-3">

          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border bg-white p-8 shadow-sm transition hover:shadow-lg ${plan.popular
                  ? "border-indigo-600 shadow-md scale-[1.02]"
                  : "border-gray-200"
                }`}
            >

              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white shadow">
                  MOST USED
                </div>
              )}

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
        */}

        {/* Trust Note */}
        <div className="mt-12 text-center text-sm text-gray-500">
          No hidden charges. Transparent 7% platform fee. Payment gateway charges may apply.
          Institutions &amp; universities can request custom plans at{" "}
          <span className="font-medium text-indigo-600">
            acadflow.platform@gmail.com
          </span>
        </div>

      </div>
    </section>
  );
}