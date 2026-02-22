export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">

      <h1 className="text-3xl font-bold text-gray-900">
        Terms & Conditions
      </h1>

      <p className="mt-4 text-gray-600">
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <div className="mt-8 space-y-6 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-semibold text-gray-900">
            1. Acceptance of Terms
          </h2>

          <p>
            By using AcadFlow, you agree to comply with these Terms and
            Conditions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">
            2. User Responsibilities
          </h2>

          <p>
            Users are responsible for the accuracy of submitted
            information and uploaded content.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">
            3. Account Usage
          </h2>

          <p>
            You are responsible for maintaining the confidentiality of
            your account credentials.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">
            4. Payments & Refunds
          </h2>

          <p>
            Payments are processed via Razorpay. Refunds, if applicable,
            are subject to conference organizer policies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">
            5. Platform Availability
          </h2>

          <p>
            We strive to maintain uptime but do not guarantee
            uninterrupted access at all times.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">
            6. Limitation of Liability
          </h2>

          <p>
            AcadFlow is not responsible for losses arising from misuse of
            the platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">
            7. Contact
          </h2>

          <p>
            For legal queries, contact:
            support@acadflow.in
          </p>
        </section>

      </div>

    </main>
  );
}
