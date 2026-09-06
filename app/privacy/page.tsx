import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">

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
              Confairo collects information necessary to provide conference
              management services. This may include your name, email address,
              institution details, profile information, and documents submitted
              through the platform such as research papers or abstracts.
            </p>

            <p className="mt-2">
              Conference organizers may also provide organizational and
              banking details to enable payout processing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              2. How We Use Your Information
            </h2>

            <p>
              Your information is used to operate and improve the Confairo
              platform, including managing conference submissions, peer
              reviews, participant registrations, payment processing,
              certificate generation, and communications related to
              conferences.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              3. Payments & Financial Data
            </h2>

            <p>
              Payments made through Confairo are processed securely by
              third-party payment providers such as Razorpay.
            </p>

            <p className="mt-2">
              Confairo does not store credit card or debit card details on
              its servers. Payment data is handled directly by the payment
              provider according to their security and privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              4. Organizer Bank Details
            </h2>

            <p>
              Conference organizers may provide bank account details to
              receive payouts from conference registrations or submission
              fees. This information is stored securely and used solely
              for payment settlement and financial processing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              5. Data Sharing
            </h2>

            <p>
              Confairo does not sell or rent personal information.
            </p>

            <p className="mt-2">
              Information may be shared with conference organizers,
              reviewers, and authorized service providers only when
              necessary to deliver conference management services.
            </p>

            <p className="mt-2">
              Certain data may also be shared with payment processors
              such as Razorpay to facilitate secure financial transactions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              6. Cookies & Authentication
            </h2>

            <p>
              Confairo uses secure cookies and authentication mechanisms
              to maintain login sessions and ensure secure access to user
              accounts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              7. Data Security
            </h2>

            <p>
              We implement industry-standard security practices to protect
              user information. Confairo uses secure cloud infrastructure,
              encrypted connections (HTTPS), and access controls to help
              prevent unauthorized access or misuse of data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              8. Data Retention
            </h2>

            <p>
              Personal information is retained only for as long as necessary
              to provide services, comply with legal obligations, and resolve
              disputes related to conference activities.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              9. Your Rights
            </h2>

            <p>
              You may request access, correction, or deletion of your personal
              data by contacting us. We will respond to such requests in
              accordance with applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              10. Policy Updates
            </h2>

            <p>
              Confairo may update this Privacy Policy periodically to reflect
              improvements to the platform or changes in legal requirements.
              Continued use of the platform indicates acceptance of the
              updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              11. Contact Us
            </h2>

            <p>
              For privacy-related questions or concerns, contact us at:
              <br />
              <span className="font-medium text-indigo-600">
                Confairo.platform@gmail.com
              </span>
            </p>
          </section>

        </div>

      </section>

      <Footer />

    </main>
  );
}