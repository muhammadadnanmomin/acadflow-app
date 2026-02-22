export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">

      <h1 className="text-3xl font-bold text-gray-900">
        Privacy Policy
      </h1>

      <p className="mt-4 text-gray-600">
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <div className="mt-8 space-y-6 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-semibold text-gray-900">
            1. Information We Collect
          </h2>

          <p>
            We collect basic personal information such as name, email
            address, institution name, and submitted documents when you
            use our platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">
            2. How We Use Your Data
          </h2>

          <p>
            Your information is used to manage registrations, paper
            submissions, reviews, payments, and certificates.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">
            3. Data Security
          </h2>

          <p>
            We use industry-standard security measures and Supabase
            infrastructure to protect your data from unauthorized access.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">
            4. Payments
          </h2>

          <p>
            Payments are processed securely through Razorpay. We do not
            store your card or banking information on our servers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">
            5. Data Sharing
          </h2>

          <p>
            We do not sell or rent your personal data. Information is only
            shared with authorized organizers and payment providers when
            necessary.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900">
            6. Contact
          </h2>

          <p>
            For privacy-related questions, contact us at:
            support@acadflow.in
          </p>
        </section>

      </div>

    </main>
  );
}
