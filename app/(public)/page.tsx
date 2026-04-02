import type { Metadata } from "next";

import { HeroSection } from "@/components/landing/hero-section";
import { ProblemSection } from "@/components/landing/problem-section";
import { SolutionSection } from "@/components/landing/solution-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works";
import { PricingSection } from "@/components/landing/pricing-section";
import { ComparisonSection } from "@/components/landing/comparison-section";
// import { SocialProofSection } from "@/components/landing/social-proof-section";


export const metadata: Metadata = {
  title: "AcadFlow — Manage Academic Conferences Without the Admin Chaos",
  description:
    "AcadFlow replaces Google Forms, Excel, Gmail, and manual certificate tools with one platform. Manage paper submissions, peer reviews, payments, and certificates in minutes. Free to start.",
  keywords: [
    "academic conference management",
    "paper submission portal",
    "peer review system",
    "conference management software",
    "certificate generation",
    "research conference platform",
    "AcadFlow",
  ],
  openGraph: {
    title: "AcadFlow — Manage Academic Conferences Without the Admin Chaos",
    description:
      "One platform to manage submissions, reviews, payments, and certificates. Free to start. Built for professors and conference organizers.",
    type: "website",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* 1. Hero — Headline + CTA + Trust */}
      <HeroSection />

      {/* 2. Problem — Current pain points */}
      <ProblemSection />

      {/* 3. Solution — Before → After transformation */}
      <SolutionSection />

      {/* 4. Features — Grouped into 5 modules */}
      <FeaturesSection />

      {/* 5. How It Works — 5 clear steps */}
      <HowItWorksSection />

      {/* 6. Pricing — Free-first positioning */}
      <PricingSection />

      {/* 7. Comparison — AcadFlow vs traditional */}
      <ComparisonSection />

      {/* 8. Social Proof — Testimonials + Use Cases */}
      {/* <SocialProofSection /> */}

    </main>
  );
}
