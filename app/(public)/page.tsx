import type { Metadata } from "next";

import { HeroSection } from "@/components/landing/hero-section";
import { ProblemSection } from "@/components/landing/problem-section";
import { SolutionSection } from "@/components/landing/solution-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { ProductExperienceSection } from "@/components/landing/product-experience-section";
import { MidPageDemoCTA } from "@/components/landing/mid-page-demo-cta";
import { HowItWorksSection } from "@/components/landing/how-it-works";
import { AudienceSection } from "@/components/landing/audience-section";
import { AIDemoSection } from "@/components/landing/ai-demo-section";
import { TrustSection } from "@/components/landing/trust-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { ComparisonSection } from "@/components/landing/comparison-section";
import { FinalCTASection } from "@/components/landing/final-cta-section";
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

      {/* 6. Mid-page CTA — Book a Demo */}
      <MidPageDemoCTA />

      {/* 7. How It Works — Set up → Run → Finish */}
      <HowItWorksSection />

      {/* 8. Who It's For — Organizers, institutions, communities */}
      <AudienceSection />

      {/* 9. AI Assistance — Reviewer, analysis, similarity */}
      <AIDemoSection />

      {/* 10. Trust — Product-based credibility signals */}
      <TrustSection />

      {/* 11. Pricing — Free-first positioning */}
      <PricingSection />

      {/* 12. Comparison — Confairo vs traditional */}
      <ComparisonSection />

      {/* 13. Social Proof — Testimonials + Use Cases */}
      {/* <SocialProofSection /> */}

      {/* 14. Final CTA — Before footer */}
      <FinalCTASection />

    </main>
  );
}
