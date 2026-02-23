import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* Header */}
      <Header />

      <section className="mx-auto max-w-4xl px-4 py-16">

        <h1 className="text-3xl font-bold">
          Privacy Policy
        </h1>

        <p className="mt-4 text-gray-600">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="mt-10 space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              1. Information We Collect
            </h2>

            <p>
              AcadFlow collects information necessary to provide conference
              management services. This may include your name, email address,
              institution details, and documents submitted through the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              2. How We Use Your Information
            </h2>

            <p>
              Your information is used to manage registrations, paper
              submissions, peer reviews, payments, communications, and
              certificate generation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              3. Data Security
            </h2>

            <p>
              We implement industry-standard security measures to protect your
              data. AcadFlow uses secure cloud infrastructure and access
              controls to prevent unauthorized access or misuse.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              4. Payments & Financial Data
            </h2>

            <p>
              Payments are processed securely via third-party payment gateways
              such as Razorpay. AcadFlow does not store your card or banking
              information on its servers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              5. Data Sharing
            </h2>

            <p>
              We do not sell or rent personal data. Information may be shared
              with authorized conference organizers and payment providers only
              when necessary to deliver services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              6. Cookies & Authentication
            </h2>

            <p>
              AcadFlow uses secure session cookies and authentication tools
              to maintain login sessions and improve user experience.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              7. Your Rights
            </h2>

            <p>
              You may request correction or deletion of your personal data by
              contacting us. We will respond to such requests in accordance
              with applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              8. Policy Updates
            </h2>

            <p>
              We may update this Privacy Policy from time to time. Continued
              use of the platform indicates acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              9. Contact Us
            </h2>

            <p>
              For privacy-related questions or concerns, contact us at:
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