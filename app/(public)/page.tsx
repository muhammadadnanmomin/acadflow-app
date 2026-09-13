import type { Metadata } from "next";

import { HeroSection } from "@/components/landing/hero-section";
import { ProblemSection } from "@/components/landing/problem-section";
import { SolutionSection } from "@/components/landing/solution-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { ProductExperienceSection } from "@/components/landing/product-experience-section";
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

      {/* 2. Problem — Conference management fragmentation */}
      <ProblemSection />

      {/* 3. Platform — One workflow, seven steps */}
      <SolutionSection />

      {/* 4. Core Capabilities — Six modules */}
      <FeaturesSection />

      {/* 5. Product Experience — Dashboard preview */}
      <ProductExperienceSection />

      {/* 5.5 Mid-page CTA — Book a Demo */}
      <MidPageDemoCTA />

      {/* 6. AI Demo — Prove the AI capability */}
      <AIDemoSection />

      {/* 7. How It Works — 5 clear steps */}
      <HowItWorksSection />

      {/* 8. AI Features Spotlight — Before pricing */}
      <AIFeaturesSection />

      {/* 9. Pricing — Free-first positioning */}
      <PricingSection />

      {/* 10. Comparison — Confairo vs traditional */}
      <ComparisonSection />

      {/* 11. Social Proof — Testimonials + Use Cases */}
      {/* <SocialProofSection /> */}

      {/* 12. Final CTA — Before footer */}
      <FinalCTASection />

    </main>
  );
}

