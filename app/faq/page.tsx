import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

const faqs = [
  {
    question: "What is AcadFlow?",
    answer:
      "AcadFlow is an academic conference management platform that helps institutions manage submissions, peer reviews, registrations, payments, schedules, and certificate generation in one place.",
  },
  {
    question: "Who can use AcadFlow?",
    answer:
      "AcadFlow is designed for colleges, universities, conference organizers, professors, reviewers, and students participating in academic conferences and research events.",
  },
  {
    question: "How do I create a conference?",
    answer:
      "After signing up, you can create an organization from your dashboard. Once your organization is set up, you can create and publish conferences and start accepting submissions.",
  },
  {
    question: "How much does it cost to run a conference on AcadFlow?",
    answer:
      "AcadFlow offers a free plan for small conferences with essential features. For larger conferences, organizers can upgrade to a paid plan which currently costs ₹1,999 per conference and includes advanced conference management tools.",
  },
  {
    question: "How do participants submit papers?",
    answer:
      "Participants can register for a conference and upload their research papers directly through the conference submission portal provided by the organizer.",
  },
  {
    question: "How does the review process work?",
    answer:
      "Organizers assign reviewers to submitted papers. Reviewers evaluate the papers through their dashboard and provide recommendations such as acceptance, revision, or rejection.",
  },
  {
    question: "Can reviewers join through an invitation?",
    answer:
      "Yes. Organizers can send invitation links to reviewers. After accepting the invitation, reviewers gain access to their review dashboard.",
  },
  {
    question: "Are payments secure?",
    answer:
      "Yes. Payments are processed securely through trusted payment providers such as Razorpay. AcadFlow does not store card details or sensitive banking information.",
  },
  {
    question: "Why is there a platform processing fee on payments?",
    answer:
      "AcadFlow charges a small platform processing fee (currently 4%) on payments made through the platform. This helps cover payment infrastructure, gateway costs, and platform operations.",
  },
  {
    question: "Who receives the conference registration or submission fee?",
    answer:
      "Conference fees belong to the conference organizer. AcadFlow facilitates the payment process and transfers the conference fee to the organizer after deducting the platform processing fee where applicable.",
  },
  {
    question: "Can I request a refund for conference payments?",
    answer:
      "Refund policies are determined by the respective conference organizer. Participants should contact the conference organizer directly regarding refund requests.",
  },
  {
    question: "Is my research paper safe on AcadFlow?",
    answer:
      "Yes. AcadFlow uses secure infrastructure and access controls to protect submitted research papers and conference data.",
  },
  {
    question: "Can I generate certificates?",
    answer:
      "Yes. Organizers can generate and distribute digital certificates for participants, presenters, and reviewers through the platform.",
  },
  {
    question: "Can I use AcadFlow on mobile devices?",
    answer:
      "Yes. AcadFlow is fully responsive and works smoothly on desktops, tablets, and smartphones.",
  },
  {
    question: "What if I forget my password?",
    answer:
      "Use the 'Forgot Password' option on the login page to reset your password securely.",
  },
  {
    question: "How can I contact support?",
    answer:
      "You can contact us through the Contact page or email us at acadflow.platform@gmail.com.",
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* Header */}
      <Header />

      <section className="mx-auto max-w-4xl px-4 py-16">

        <h1 className="text-3xl font-bold">
          Frequently Asked Questions
        </h1>

        <p className="mt-4 text-gray-600">
          Find answers to common questions about using AcadFlow.
        </p>

        <div className="mt-10 space-y-6">

          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl border p-6 transition hover:shadow-sm"
            >
              <h3 className="font-semibold text-lg text-gray-900">
                {faq.question}
              </h3>

              <p className="mt-2 text-gray-600 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}

        </div>

      </section>

      {/* Footer */}
      <Footer />

    </main>
  );
}