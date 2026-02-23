import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

const faqs = [
  {
    question: "What is AcadFlow?",
    answer:
      "AcadFlow is an academic conference management platform that helps institutions manage submissions, reviews, registrations, payments, and certificates in one place.",
  },
  {
    question: "Who can use AcadFlow?",
    answer:
      "AcadFlow is designed for colleges, universities, conference organizers, professors, reviewers, and students participating in academic events.",
  },
  {
    question: "How do I create a conference?",
    answer:
      "Sign up or create an organization from your dashboard. Once your organization is set up, you can create and publish conferences.",
  },
  {
    question: "How do participants submit papers?",
    answer:
      "Participants can register for a conference and upload their research papers directly through the platform.",
  },
  {
    question: "How does the review process work?",
    answer:
      "Organizers assign reviewers to submitted papers. Reviewers evaluate submissions and recommend acceptance or rejection through their dashboard.",
  },
  {
    question: "Can reviewers join through an invitation?",
    answer:
      "Yes. Organizers can send invitation links to reviewers. After accepting the invitation, reviewers are redirected to their dashboard.",
  },
  {
    question: "Are payments secure?",
    answer:
      "Yes. Payments are processed securely through trusted payment gateways like Razorpay. AcadFlow does not store card or banking details.",
  },
  {
    question: "Can I generate certificates?",
    answer:
      "Yes. Organizers can generate and distribute digital certificates to participants and presenters.",
  },
  {
    question: "Is AcadFlow free to use?",
    answer:
      "AcadFlow offers a free trial with essential features. Advanced functionality may be available in paid plans.",
  },
  {
    question: "Can I use AcadFlow on mobile devices?",
    answer:
      "Yes. AcadFlow is fully responsive and works on desktops, tablets, and smartphones.",
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