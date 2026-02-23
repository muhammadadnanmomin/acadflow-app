import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export default function UserGuidePage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* Header */}
      <Header />

      <section className="mx-auto max-w-5xl px-4 py-16">

        <h1 className="text-3xl font-bold">
          AcadFlow User Guide
        </h1>

        <p className="mt-4 text-gray-600 max-w-2xl">
          Learn how to use AcadFlow to organize conferences,
          submit papers, review research, and manage academic events.
        </p>

        {/* ORGANIZERS */}
        <div className="mt-12 space-y-6">

          <h2 className="text-2xl font-semibold text-indigo-600">
            For Organizers
          </h2>

          <GuideCard
            title="1. Create an Organization"
            content="After signing in, create your organization to manage conferences and team members."
          />

          <GuideCard
            title="2. Create a Conference"
            content="Go to Organizer Dashboard → Create Conference. Add title, dates, fees, deadlines, and contact details."
          />

          <GuideCard
            title="3. Publish the Conference"
            content="Publish your conference to make it visible for participants and submissions."
          />

          <GuideCard
            title="4. Invite Reviewers"
            content="Generate invite links and share them with professors or experts for reviewing submissions."
          />

          <GuideCard
            title="5. Manage Submissions"
            content="Assign reviewers, track status, and accept or reject papers from your dashboard."
          />

          <GuideCard
            title="6. Generate Certificates"
            content="After the conference, generate digital certificates for participants and presenters."
          />

        </div>

        {/* PARTICIPANTS */}
        <div className="mt-16 space-y-6">

          <h2 className="text-2xl font-semibold text-indigo-600">
            For Participants & Authors
          </h2>

          <GuideCard
            title="1. Browse Conferences"
            content="Explore conferences and select events relevant to your field."
          />

          <GuideCard
            title="2. Register for a Conference"
            content="Complete registration and payment (if applicable) to participate."
          />

          <GuideCard
            title="3. Submit Research Paper"
            content="Upload your paper securely through the participant dashboard."
          />

          <GuideCard
            title="4. Track Submission Status"
            content="Monitor review status and updates from your dashboard."
          />

          <GuideCard
            title="5. Download Certificates"
            content="Download your digital certificates after acceptance or participation."
          />

        </div>

        {/* REVIEWERS */}
        <div className="mt-16 space-y-6">

          <h2 className="text-2xl font-semibold text-indigo-600">
            For Reviewers
          </h2>

          <GuideCard
            title="1. Accept Invitation"
            content="Click the invite link shared by the organizer and create your reviewer account."
          />

          <GuideCard
            title="2. Access Assigned Papers"
            content="View papers assigned to you from the reviewer dashboard."
          />

          <GuideCard
            title="3. Submit Reviews"
            content="Provide feedback and recommend acceptance or rejection."
          />

          <GuideCard
            title="4. Track Review History"
            content="View completed reviews and review status updates."
          />

        </div>

        {/* TIPS */}
        <div className="mt-16 rounded-xl bg-slate-50 p-8 border">
          <h2 className="text-xl font-semibold text-gray-900">
            Tips for Best Experience
          </h2>

          <ul className="mt-4 space-y-2 text-gray-600 list-disc list-inside">
            <li>Use a strong password and verify your email.</li>
            <li>Keep submission deadlines clear for participants.</li>
            <li>Assign reviewers early to avoid delays.</li>
            <li>Regularly check notifications for updates.</li>
            <li>Download certificates before conference closure.</li>
          </ul>
        </div>

      </section>

      {/* Footer */}
      <Footer />

    </main>
  );
}

/* Guide Card Component */
function GuideCard({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div className="rounded-xl border p-6 transition hover:shadow-sm">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-600 leading-relaxed">{content}</p>
    </div>
  );
}