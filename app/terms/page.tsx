import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">

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
              By accessing or using AcadFlow, you agree to comply with and be
              bound by these Terms & Conditions. If you do not agree with these
              terms, you should discontinue use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              2. Platform Purpose
            </h2>

            <p>
              AcadFlow provides a software platform designed to help academic
              conference organizers manage submissions, peer reviews,
              registrations, payments, schedules, and certifications.
            </p>

            <p className="mt-2">
              AcadFlow acts solely as a technology provider and does not
              organize or operate conferences directly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              3. User Accounts
            </h2>

            <p>
              Users must provide accurate information when creating an account.
              You are responsible for maintaining the confidentiality of your
              login credentials and for all activities that occur under your
              account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              4. Conference Organizer Responsibilities
            </h2>

            <p>
              Conference organizers are fully responsible for managing their
              conferences, including:
            </p>

            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Setting conference fees</li>
              <li>Managing paper submissions and review decisions</li>
              <li>Communicating with authors and participants</li>
              <li>Handling refunds and financial policies</li>
            </ul>

            <p className="mt-2">
              AcadFlow does not control or influence academic review outcomes
              or conference decisions.
            </p>
          </section>

<section>
  <h2 className="text-xl font-semibold text-gray-900">
    5. Conference Organizer Plans & Billing
  </h2>

  <p>
    AcadFlow may offer different plans and pricing options for conference
    organizers. Certain features of the platform may require payment of a
    conference management fee.
  </p>

  <p className="mt-2">
    Organizers may be charged a per-conference platform fee depending on
    the selected plan. Pricing and plan details are displayed on the
    AcadFlow website and may be updated periodically.
  </p>

  <p className="mt-2">
    Organizer plan fees are non-refundable once a conference has been
    created or platform services have been used.
  </p>
</section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              6. Payments & Platform Processing Fee
            </h2>

            <p>
              Payments made through the AcadFlow platform may include a
              platform processing fee. This fee helps support payment
              infrastructure, platform maintenance, and transaction processing.
            </p>

            <p className="mt-2">
              Conference fees belong to the respective conference organizer.
              AcadFlow may deduct a platform processing fee before settlement
              where applicable.
            </p>

            <p className="mt-2">
              Payments are processed securely through third-party payment
              providers such as Razorpay.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              7. Refund Policy
            </h2>

            <p>
              Refund policies are determined by the respective conference
              organizers. Participants should contact the conference organizer
              directly regarding refund requests.
            </p>

            <p className="mt-2">
              AcadFlow does not guarantee refunds for conference payments
              unless required by applicable law or payment gateway policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              8. Platform Availability
            </h2>

            <p>
              While we strive to maintain reliable and uninterrupted service,
              AcadFlow does not guarantee that the platform will always be
              available without interruptions, delays, or technical errors.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              9. Intellectual Property
            </h2>

            <p>
              Authors retain ownership of their research papers and submitted
              content. AcadFlow does not claim ownership of academic content
              but may store and process it to provide platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              10. Limitation of Liability
            </h2>

            <p>
              AcadFlow is not responsible for conference outcomes, review
              decisions, payment disputes between participants and organizers,
              or issues caused by third-party services such as payment
              providers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              11. Changes to Terms
            </h2>

            <p>
              AcadFlow may update these Terms & Conditions periodically.
              Continued use of the platform after updates indicates acceptance
              of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">
              12. Contact Information
            </h2>

            <p>
              For legal inquiries regarding these terms, please contact us at:
              <br />
              <span className="font-medium text-indigo-600">
                acadflow.platform@gmail.com
              </span>
            </p>
          </section>

        </div>

      </section>

      <Footer />

    </main>
  );
}