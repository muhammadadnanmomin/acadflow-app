import type { Metadata } from "next";

// import { Header } from "@/components/landing/header";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works";
import { BenefitsSection } from "@/components/landing/benefits-section";
// import { TestimonialsSection } from "@/components/testimonials-section";
import { PricingSection } from "@/components/landing/pricing-section";
// import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "AcadFlow — Academic Conference Management Platform",
  description:
    "AcadFlow helps colleges and universities manage academic conferences, submissions, reviews, and registrations in one place.",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* Header */}
      {/* <Header /> */}

      {/* Hero */}
      <HeroSection />

      {/* Features */}
      <FeaturesSection />

      {/* How it works */}
      <HowItWorksSection />

      {/* Benefits */}
      <BenefitsSection />

      {/* Testimonials */}
      {/* <TestimonialsSection /> */}

      {/* Pricing */}
      <PricingSection />

      {/* Footer */}
      {/* <Footer /> */}

    </main>
  );
}
