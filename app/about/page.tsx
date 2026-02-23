import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* Header */}
      <Header />

      <section className="mx-auto max-w-4xl px-4 py-16">

        {/* Title */}
        <h1 className="text-3xl font-bold">
          About AcadFlow
        </h1>

        <p className="mt-6 text-lg text-gray-600">
          AcadFlow is a modern academic conference management platform
          designed to help colleges, universities, and independent
          organizers manage conferences efficiently and professionally.
        </p>

        {/* Content */}
        <div className="mt-10 space-y-6 text-gray-700 leading-relaxed">

          <p>
            Our mission is to simplify the entire conference lifecycle —
            from paper submissions and peer review to registrations,
            payments, and certificate generation.
          </p>

          <p>
            Many institutions still rely on manual processes, spreadsheets,
            and scattered tools. AcadFlow brings everything into one secure,
            easy-to-use platform designed specifically for academic workflows.
          </p>

          <p>
            The platform is built with a strong focus on reliability,
            security, and academic integrity — ensuring that organizers,
            reviewers, and participants can collaborate seamlessly.
          </p>

          <p>
            AcadFlow continues to evolve based on real feedback from
            educators, researchers, and conference organizers across India.
          </p>

        </div>

        {/* Vision Section */}
        <div className="mt-12 rounded-xl border bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Our Vision
          </h2>

          <p className="mt-3 text-gray-700 leading-relaxed">
            To become the most trusted digital infrastructure for academic
            conferences — empowering institutions with tools that improve
            research collaboration, transparency, and academic excellence.
          </p>
        </div>

      </section>

      {/* Footer */}
      <Footer />

    </main>
  );
}