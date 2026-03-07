const steps = [
  {
    step: "01",
    title: "Create Your Conference",
    description:
      "Define your conference details, set submission deadlines, and open registrations — all in one setup flow.",
  },
  {
    step: "02",
    title: "Collect Submissions",
    description:
      "Authors register and submit research papers through a clean, guided interface. You see every submission in real time.",
  },
  {
    step: "03",
    title: "Run the Review Process",
    description:
      "Assign reviewers, collect structured evaluations, and make accept/reject decisions with full visibility.",
  },
  {
    step: "04",
    title: "Publish Results & Issue Certificates",
    description:
      "Notify authors of decisions and generate verified digital certificates automatically. No manual formatting.",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="bg-white px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">

          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            How It Works
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            From Setup to Certificates in Four Steps
          </h2>

          <p className="mt-4 text-lg text-gray-600">
            Every conference follows the same lifecycle. AcadFlow automates each stage
            so you can focus on academic quality, not logistics.
          </p>

        </div>

        {/* Steps */}
        <div className="relative mt-16">

          {/* Vertical Line (Desktop) */}
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gray-200 lg:block" />

          <div className="space-y-12">

            {steps.map((step, index) => (
              <div
                key={step.step}
                className="relative lg:grid lg:grid-cols-2 lg:gap-12"
              >

                {/* Content */}
                <div
                  className={`lg:py-6 ${index % 2 === 0
                      ? "lg:pr-12 lg:text-right"
                      : "lg:order-2 lg:pl-12"
                    }`}
                >

                  <div
                    className={`flex items-start gap-6 ${index % 2 === 0 ? "lg:flex-row-reverse" : ""
                      }`}
                  >

                    {/* Step Number */}
                    <div
                      className="
                        flex h-14 w-14 shrink-0 items-center justify-center
                        rounded-xl bg-indigo-600 text-lg font-bold text-white
                        shadow-md
                      "
                    >
                      {step.step}
                    </div>

                    {/* Text */}
                    <div className="pt-1">

                      <h3 className="text-xl font-semibold text-gray-900">
                        {step.title}
                      </h3>

                      <p className="mt-2 leading-relaxed text-gray-600">
                        {step.description}
                      </p>

                    </div>

                  </div>

                </div>

                {/* Timeline Dot */}
                <div
                  className={`hidden lg:block ${index % 2 === 0 ? "lg:order-2" : ""
                    }`}
                >
                  <div className="absolute left-1/2 top-6 h-4 w-4 -translate-x-1/2 rounded-full border-4 border-indigo-600 bg-white" />
                </div>

              </div>
            ))}

          </div>

        </div>

      </div>
    </section>
  );
}