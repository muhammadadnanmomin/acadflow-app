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
          About Confairo
        </h1>

        <p className="mt-6 text-lg text-gray-600">
          Confairo is a modern platform designed to simplify how academic
          conferences are organized, reviewed, and managed.
        </p>

        {/* Content */}
        <div className="mt-10 space-y-6 text-gray-700 leading-relaxed">

          <p>
            Organizing an academic conference often involves multiple
            disconnected tools — emails for communication, spreadsheets for
            tracking submissions, manual reviewer assignments, and separate
            systems for certificates and participant records. These fragmented
            workflows create unnecessary administrative burden for organizers
            and slow down the entire process.
          </p>

          <p>
            Confairo was created to solve this challenge by bringing the
            entire conference lifecycle into a single, streamlined platform.
            From paper submissions and peer review to registrations,
            scheduling, and certificate generation, Confairo helps academic
            communities manage conferences with clarity and efficiency.
          </p>

          <p>
            The platform is designed specifically for academic environments,
            supporting organizers, reviewers, professors, and researchers
            through structured workflows, role-based dashboards, and secure
            collaboration tools.
          </p>

          <p>
            By automating repetitive administrative tasks and providing
            real-time visibility into conference activities, Confairo allows
            organizers to focus more on research collaboration and less on
            manual coordination.
          </p>

          <p>
            Confairo continues to evolve through feedback from educators,
            researchers, and conference organizers, ensuring that the
            platform remains aligned with real academic needs.
          </p>

        </div>

        {/* Mission Section */}
        <div className="mt-12 rounded-xl border bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Our Mission
          </h2>

          <p className="mt-3 text-gray-700 leading-relaxed">
            To simplify academic conference management by providing a reliable,
            secure, and easy-to-use platform that supports the entire research
            event lifecycle.
          </p>
        </div>

        {/* Vision Section */}
        <div className="mt-8 rounded-xl border bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Our Vision
          </h2>

          <p className="mt-3 text-gray-700 leading-relaxed">
            To become a trusted digital infrastructure for academic conferences
            worldwide, helping institutions run professional, transparent,
            and well-organized research events that strengthen collaboration
            across the global academic community.
          </p>
        </div>

      </section>

      {/* Footer */}
      <Footer />

    </main>
  );
}