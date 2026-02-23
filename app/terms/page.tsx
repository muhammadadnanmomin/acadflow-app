import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* Header */}
      <Header />

      <section className="mx-auto max-w-4xl px-4 py-16">

        <h1 className="text-3xl font-bold">
          Terms & Conditions
        </h1>

        <p className="mt-4 text-gray-600">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="mt-10 space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              1. Acceptance of Terms
            </h2>

            <p>
              By accessing or using AcadFlow, you agree to comply with and
              be bound by these Terms & Conditions. If you do not agree,
              please discontinue use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              2. Platform Purpose
            </h2>

            <p>
              AcadFlow provides a digital platform for managing academic
              conferences, including submissions, peer reviews,
              registrations, payments, and certification.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              3. User Responsibilities
            </h2>

            <p>
              Users are responsible for ensuring that all submitted
              information, documents, and research content are accurate,
              lawful, and do not violate intellectual property rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              4. Account Security
            </h2>

            <p>
              You are responsible for maintaining the confidentiality of
              your login credentials and for all activities that occur
              under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              5. Organizer Responsibilities
            </h2>

            <p>
              Conference organizers are solely responsible for managing
              event details, review decisions, payments, refunds, and
              communication with participants.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              6. Payments & Refunds
            </h2>

            <p>
              Payments are processed securely through third-party gateways
              such as Razorpay. Refund policies are determined by the
              respective conference organizers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              7. Platform Availability
            </h2>

            <p>
              While we strive to ensure reliable service, AcadFlow does
              not guarantee uninterrupted or error-free availability at
              all times.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              8. Intellectual Property
            </h2>

            <p>
              Users retain ownership of their submitted research content.
              AcadFlow does not claim ownership but may store and process
              content to provide platform services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              9. Limitation of Liability
            </h2>

            <p>
              AcadFlow is not liable for losses resulting from misuse of
              the platform, conference decisions, payment disputes, or
              external service failures.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              10. Modifications to Terms
            </h2>

            <p>
              We may update these Terms from time to time. Continued use
              of the platform after updates constitutes acceptance of the
              revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              11. Contact Us
            </h2>

            <p>
              For legal inquiries or concerns regarding these terms,
              contact us at:
              <br />
              <span className="font-medium text-indigo-600">
                acadflow.platform@gmail.com
              </span>
            </p>
          </section>

        </div>

      </section>

      {/* Footer */}
      <Footer />

    </main>
  );
}