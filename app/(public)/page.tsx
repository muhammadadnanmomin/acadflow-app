import type { Metadata } from "next";

import { HeroSection } from "@/components/landing/hero-section";
import { ProblemSection } from "@/components/landing/problem-section";
import { SolutionSection } from "@/components/landing/solution-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { AIDemoSection } from "@/components/landing/ai-demo-section";
import { HowItWorksSection } from "@/components/landing/how-it-works";
import { AIFeaturesSection } from "@/components/landing/ai-features-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { ComparisonSection } from "@/components/landing/comparison-section";
import { FinalCTASection } from "@/components/landing/final-cta-section";
import { MidPageDemoCTA } from "@/components/landing/mid-page-demo-cta";
// import { SocialProofSection } from "@/components/landing/social-proof-section";


export const metadata: Metadata = {
  title: "Confairo — Academic Conference Management Platform",
  description:
    "Manage paper submissions, peer reviews, registration, payments, scheduling, and certificates for academic conferences — all in one platform. Free to start.",
  keywords: [
    "academic conference management",
    "paper submission portal",
    "peer review system",
    "conference management software",
    "certificate generation",
    "research conference platform",
    "Confairo",
  ],
  openGraph: {
    title: "Confairo — Academic Conference Management Platform",
    description:
      "Manage paper submissions, peer reviews, payments, and certificates for academic conferences. One platform, free to start.",
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

      {/* 4. Features — Grouped into modules */}
      <FeaturesSection />

      {/* 4.25 Mid-page CTA — Book a Demo */}
      <MidPageDemoCTA />

      {/* 4.5 AI Demo — Prove the AI capability */}
      <AIDemoSection />

      {/* 5. How It Works — 5 clear steps */}
      <HowItWorksSection />

      {/* 6. AI Features Spotlight — Before pricing */}
      <AIFeaturesSection />

      {/* 7. Pricing — Free-first positioning */}
      <PricingSection />

      {/* 8. Comparison — Confairo vs traditional */}
      <ComparisonSection />

      {/* 9. Social Proof — Testimonials + Use Cases */}
      {/* <SocialProofSection /> */}

      {/* 10. Final CTA — Before footer */}
      <FinalCTASection />

    </main>
  );
}
