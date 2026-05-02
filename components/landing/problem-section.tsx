import { AlertTriangle, FileSpreadsheet, Mail, CreditCard, Award } from "lucide-react";
import { ArrowDown } from "lucide-react";

const painPoints = [
  {
    icon: FileSpreadsheet,
    pain: "Google Forms + Excel = Lost Papers",
    description:
      "You create a Google Form, then copy responses into Excel by hand. 200+ papers scattered across tabs. Which reviewer has which paper? Who replied? You don't know — because the spreadsheet doesn't tell you.",
    trigger: "Sound familiar?",
    quote: "I spent more time fixing spreadsheets than reading papers.",
  },
  {
    icon: Mail,
    pain: "Your Inbox Is Not a Dashboard",
    description:
      "BCC 300 participants. Forward PDFs to reviewers one by one. Search Gmail for \"did they confirm?\" Forget who you already replied to. Important messages get buried under 50 unread threads.",
    trigger: "You've been there.",
    quote: "I was CC'd on 400 emails in one week. I stopped reading them.",
  },
  {
    icon: CreditCard,
    pain: "Payments? Good Luck Tracking Those.",
    description:
      "Some pay via UPI, some via bank transfer, some not at all. You open yet another spreadsheet to match names to transaction IDs. Three participants claim they paid. You can't verify any of them.",
    trigger: "Every. Single. Conference.",
    quote: "Reconciling payments took longer than the event itself.",
  },
  {
    icon: Award,
    pain: "Certificates: 3 Days of Copy-Paste",
    description:
      "The conference is over. Now you spend the next week creating certificates in Word or Canva. 200 names. One-by-one. Spell-check each one. Export as PDF. Email individually. Pray there are no typos.",
    trigger: "You know this pain.",
    quote: "A participant emailed me about a typo — two months later.",
  },
];

export function ProblemSection() {
  return (
    <section id="problem" className="relative bg-gray-950 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">

      {/* Background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08),transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl">

        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-sm font-medium text-red-400">
            <AlertTriangle className="h-4 w-4" />
            The Problem
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            You&apos;re Spending Weeks on Admin{" "}
            <span className="text-red-400">Instead of Research</span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-400">
            Google Forms for submissions. Excel for tracking. Gmail for communication.
            A separate app for payments. And certificates? That&apos;s a weekend project.{" "}
            <span className="text-gray-300">Five tools. None of them built for conferences.</span>
          </p>

        </div>

        {/* Pain Point Cards */}
        <div className="mt-16 grid gap-6 md:grid-cols-2">

          {painPoints.map((point) => (
            <div
              key={point.pain}
              className="group rounded-xl border border-gray-800 bg-gray-900/80 p-8 transition-all duration-200 hover:border-gray-600 hover:bg-gray-900 hover:shadow-lg hover:shadow-red-500/5"
            >

              {/* Icon + Title */}
              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400 transition group-hover:bg-red-500/20">
                  <point.icon className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {point.pain}
                  </h3>

                  <p className="mt-3 text-[0.938rem] leading-relaxed text-gray-400">
                    {point.description}
                  </p>

                  {/* Micro-trigger */}
                  <p className="mt-3 text-sm font-medium text-red-400/80">
                    {point.trigger}
                  </p>

                  {/* Quote */}
                  <p className="mt-3 border-l-2 border-red-500/30 pl-4 text-sm italic text-gray-500">
                    &ldquo;{point.quote}&rdquo;
                  </p>
                </div>

              </div>

            </div>
          ))}

        </div>

        {/* Bottom Transition — Bridge to Solution */}
        <div className="mt-20 text-center">

          <p className="text-xl font-semibold text-gray-300 sm:text-2xl">
            You didn&apos;t sign up to be a{" "}
            <span className="text-white">spreadsheet operator</span>.
          </p>

          <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-gray-500">
            You signed up to run an academic event that matters.
            The admin work? That should take minutes, not months.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-400">
            <ArrowDown className="h-4 w-4 animate-bounce" />
            There is a better way — and it starts with AI.
          </div>

        </div>

      </div>
    </section>
  );
}
