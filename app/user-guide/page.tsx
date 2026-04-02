"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Megaphone,
  ClipboardCheck,
  GraduationCap,
  Globe2,
  Rocket,
  Settings,
  FileText,
  Users,
  Send,
  BarChart3,
  DollarSign,
  CalendarDays,
  Presentation,
  Award,
  BookOpen,
  MailOpen,
  Eye,
  Star,
  PenTool,
  UserCheck,
  FilePlus2,
  SearchCheck,
  CircleDot,
  UploadCloud,
  Wallet,
  ArrowRight,
  Lightbulb,
  Bell,
  ShieldCheck,
  Download,
  Sparkles,
} from "lucide-react";

import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { RoleCard } from "@/components/user-guide/role-card";
import { GuideAccordion, type GuideSection } from "@/components/user-guide/guide-accordion";
import { ConferenceLifecycle } from "@/components/user-guide/conference-lifecycle";

/* ═══════════════════════════════════════════════════════════
   ROLE DEFINITIONS
   ═══════════════════════════════════════════════════════════ */

interface RoleDef {
  id: string;
  title: string;
  description: string;
  icon: typeof Megaphone;
  color: "indigo" | "amber" | "emerald" | "violet";
  sections: GuideSection[];
}

const roles: RoleDef[] = [
  /* ── Organizer ─────────────────────────────────────── */
  {
    id: "organizer",
    title: "Organizer",
    description: "Create and manage academic conferences end-to-end",
    icon: Megaphone,
    color: "indigo",
    sections: [
      {
        title: "Getting Started",
        icon: Rocket,
        steps: [
          {
            title: "Create Your Organization",
            description:
              "Set up your organization profile with name, logo, website, and country. This is the parent entity under which all your conferences will live.",
            icon: Settings,
            badge: { label: "First Step", variant: "important" },
            link: {
              label: "Go to Organization Setup",
              href: "/dashboard/onboarding/organization",
            },
          },
          {
            title: "Select Your Plan",
            description:
              "Choose from Free (1 conference, 150 submissions), Early Adopter (slot-based ₹1,999/slot), or Enterprise (unlimited). You can start free and upgrade anytime.",
            icon: Star,
            link: { label: "View Pricing Plans", href: "/#pricing" },
          },
          {
            title: "Complete Onboarding",
            description:
              "Follow the guided onboarding wizard to set up your workspace. Add your co-organizers as team members so they can help manage the conference.",
            icon: UserCheck,
            badge: { label: "Tip", variant: "tip" },
          },
        ],
      },
      {
        title: "Conference Setup",
        icon: Settings,
        steps: [
          {
            title: "Create a New Conference",
            description:
              "Go to Organizer Dashboard → Create Conference. Fill in the title, short name, dates, mode (online/offline/hybrid), venue, and timezone.",
            icon: FilePlus2,
            link: {
              label: "Create Conference",
              href: "/dashboard/organizer",
            },
          },
          {
            title: "Configure Submissions & CFP",
            description:
              "Set your Call for Papers (CFP) — define submission deadline, topics, guidelines, and paper format requirements. Authors will see these on your public conference page.",
            icon: FileText,
            badge: { label: "Important", variant: "important" },
          },
          {
            title: "Set Up Fee Categories",
            description:
              "Define fee categories for different participant types: Student, Academic, Industry, and Listener. Each category can have different pricing for registration and presentation.",
            icon: DollarSign,
          },
          {
            title: "Publish Your Conference",
            description:
              "Toggle your conference from Draft to Published. This generates a public conference page with a shareable submission link that you can distribute.",
            icon: Globe2,
            badge: { label: "Important", variant: "important" },
            link: {
              label: "Browse Published Conferences",
              href: "/conferences",
            },
          },
        ],
      },
      {
        title: "Managing Submissions",
        icon: FileText,
        steps: [
          {
            title: "Monitor Incoming Submissions",
            description:
              "View all paper submissions in real-time on your organizer dashboard. Filter by status, track, and participant category. Search for specific papers or authors.",
            icon: BarChart3,
            link: {
              label: "Open Organizer Dashboard",
              href: "/dashboard/organizer",
            },
          },
          {
            title: "Track Submission Pipeline",
            description:
              "Every submission moves through a clear pipeline: Submitted → Under Review → Accepted/Rejected. Use bulk actions to update multiple submissions at once.",
            icon: CircleDot,
          },
        ],
      },
      {
        title: "Review Process",
        icon: ClipboardCheck,
        steps: [
          {
            title: "Invite Reviewers",
            description:
              "Send email invitations to domain experts and TPC members. They'll receive a link to join your conference as a reviewer — no separate account needed.",
            icon: Send,
            badge: { label: "Important", variant: "important" },
          },
          {
            title: "Assign Papers to Reviewers",
            description:
              "Manually assign specific papers to reviewers based on their expertise. Track which papers have been assigned and which still need reviewers.",
            icon: Users,
          },
          {
            title: "Track Review Progress",
            description:
              "Monitor which reviews are pending, in progress, or completed. Send reminder emails to reviewers who haven't submitted their reviews yet.",
            icon: Eye,
          },
          {
            title: "Make Accept / Reject Decisions",
            description:
              "Review aggregated scores and comments from all reviewers. Make your final accept/reject decisions for each paper based on the review data.",
            icon: CheckCircle,
          },
          {
            title: "Send Decision Emails",
            description:
              "Automatically send accept or reject notifications to all authors with a single click. Each author receives a personalized email with their paper's status.",
            icon: MailOpen,
          },
        ],
      },
      {
        title: "Post-Conference",
        icon: Award,
        steps: [
          {
            title: "Collect Author Fees & Payments",
            description:
              "Track which accepted authors have paid their conference fees. The built-in Razorpay integration handles all online payments with automatic receipts.",
            icon: Wallet,
            link: {
              label: "View Payment Dashboard",
              href: "/dashboard/organizer",
            },
          },
          {
            title: "Build Your Schedule",
            description:
              "Create a multi-day, multi-track schedule. Add sessions (Keynote, Technical, Workshop, Break, etc.), assign rooms, and set time slots with conflict detection.",
            icon: CalendarDays,
            badge: { label: "Tip", variant: "tip" },
          },
          {
            title: "Assign Papers to Sessions",
            description:
              "Map accepted papers to specific session presentation slots. Assign session chairs and coordinators. Mark papers as 'presented' during the event.",
            icon: Presentation,
          },
          {
            title: "Generate Certificates",
            description:
              "One click generates individual, QR-verified PDF certificates for every author. Supports Presentation certificates and Best Paper Awards with digital signatures.",
            icon: Award,
            badge: { label: "Key Feature", variant: "new" },
            link: {
              label: "Learn About Certificates",
              href: "/verify",
            },
          },
          {
            title: "Publish Proceedings",
            description:
              "Upload your compiled conference proceedings. Access is automatically gated — only accepted+paid+presented authors and paid attendees can download.",
            icon: BookOpen,
          },
          {
            title: "Request Payout",
            description:
              "Add your bank details and request a payout for collected conference fees. Track your payout status from the organizer dashboard.",
            icon: DollarSign,
          },
        ],
      },
    ],
  },

  /* ── Reviewer ──────────────────────────────────────── */
  {
    id: "reviewer",
    title: "Reviewer",
    description: "Evaluate research papers and provide expert feedback",
    icon: ClipboardCheck,
    color: "amber",
    sections: [
      {
        title: "Review Workflow",
        icon: SearchCheck,
        steps: [
          {
            title: "Receive & Accept Invitation",
            description:
              "You'll receive an email invitation from the conference organizer. Click the invitation link to accept and gain access to the reviewer dashboard for that conference.",
            icon: MailOpen,
            badge: { label: "First Step", variant: "important" },
          },
          {
            title: "View Assigned Papers",
            description:
              "Access your reviewer dashboard to see all papers assigned to you. Download the PDF of each paper to review — all files are stored securely.",
            icon: FileText,
            link: {
              label: "Open Reviewer Dashboard",
              href: "/dashboard/reviewer",
            },
          },
          {
            title: "Submit Your Review",
            description:
              "Evaluate each paper using the structured review form. Provide scores across multiple criteria, write detailed comments, and give your accept/reject recommendation.",
            icon: PenTool,
            badge: { label: "Important", variant: "important" },
          },
          {
            title: "Track Decisions",
            description:
              "After the organizer makes final decisions, you'll receive a notification with the outcomes. View the history of all your reviews from the dashboard.",
            icon: Eye,
            link: {
              label: "View Review History",
              href: "/dashboard/reviewer",
            },
          },
        ],
      },
    ],
  },

  /* ── Author / Participant ──────────────────────────── */
  {
    id: "author",
    title: "Author / Participant",
    description: "Submit papers, attend conferences, and earn certificates",
    icon: GraduationCap,
    color: "emerald",
    sections: [
      {
        title: "Submission Journey",
        icon: FilePlus2,
        steps: [
          {
            title: "Discover Conferences",
            description:
              "Browse academic conferences on AcadFlow. Each conference has a public page with full details — CFP topics, deadlines, fee structure, and venue information.",
            icon: Globe2,
            link: {
              label: "Browse Conferences",
              href: "/conferences",
            },
          },
          {
            title: "Register & Select Category",
            description:
              "Sign up or log in, then register for a conference. Select your participant category (Student, Academic, Industry, or Listener) — this determines your fee structure.",
            icon: UserCheck,
            link: { label: "Create Account", href: "/signup" },
          },
          {
            title: "Submit Your Paper",
            description:
              "Upload your research paper with title, abstract, keywords, and a PDF file. Add co-authors with their name, email, and affiliation. You can submit until the deadline.",
            icon: UploadCloud,
            badge: { label: "Important", variant: "important" },
          },
          {
            title: "Track Submission Status",
            description:
              "Monitor your paper's progress through the pipeline: Submitted → Under Review → Accepted/Rejected. You'll also receive email notifications for every status change.",
            icon: CircleDot,
            link: {
              label: "Open Participant Dashboard",
              href: "/dashboard/participant/overview",
            },
          },
          {
            title: "Present at the Conference",
            description:
              "If accepted, pay your conference fee, check the schedule for your presentation slot, and present your paper. The organizer will mark your paper as 'presented'.",
            icon: Presentation,
            badge: { label: "Tip", variant: "tip" },
          },
          {
            title: "Download Your Certificate",
            description:
              "After presenting, download your QR-verified digital certificate from the participant dashboard. Each certificate has a unique verification code that anyone can validate.",
            icon: Award,
            badge: { label: "Key Feature", variant: "new" },
            link: {
              label: "Verify a Certificate",
              href: "/verify",
            },
          },
        ],
      },
    ],
  },

  /* ── Public Visitor ────────────────────────────────── */
  {
    id: "public",
    title: "Public Visitor",
    description: "Browse conferences and register as an attendee",
    icon: Globe2,
    color: "violet",
    sections: [
      {
        title: "Visitor Journey",
        icon: Eye,
        steps: [
          {
            title: "Browse Conferences",
            description:
              "Explore all published conferences on AcadFlow. Each conference has a dedicated public page with complete details — Call for Papers, important dates, venue info, and fee structure.",
            icon: Globe2,
            link: {
              label: "Browse All Conferences",
              href: "/conferences",
            },
          },
          {
            title: "View Conference Details",
            description:
              "Read through the CFP topics, submission guidelines, fee categories, and organizing committee details. View the organization's profile to learn more about the hosts.",
            icon: FileText,
          },
          {
            title: "Register as Attendee",
            description:
              "Create an AcadFlow account and register as a Listener or attendee. Pay the registration fee (if applicable) — all payments are processed securely via Razorpay.",
            icon: UserCheck,
            link: { label: "Sign Up", href: "/signup" },
          },
        ],
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════
   MISSING IMPORT FIX
   ═══════════════════════════════════════════════════════════ */
import { CheckCircle } from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function UserGuidePage() {
  const [activeRole, setActiveRole] = useState<string>("organizer");
  const [searchQuery, setSearchQuery] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  /* Get active role data */
  const currentRole = roles.find((r) => r.id === activeRole)!;

  /* Compute total step count for each role */
  function totalSteps(role: RoleDef) {
    return role.sections.reduce((sum, s) => sum + s.steps.length, 0);
  }

  /* Filter sections by search query */
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return currentRole.sections;
    const q = searchQuery.toLowerCase();
    return currentRole.sections
      .map((section) => ({
        ...section,
        steps: section.steps.filter(
          (step) =>
            step.title.toLowerCase().includes(q) ||
            step.description.toLowerCase().includes(q)
        ),
      }))
      .filter((section) => section.steps.length > 0);
  }, [currentRole, searchQuery]);

  /* Handle role card click */
  function selectRole(id: string) {
    setActiveRole(id);
    setSearchQuery("");
    // Smooth scroll to content
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Header />

      {/* ── Hero Section ──────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white px-4 pt-16 pb-12 sm:px-6 sm:pt-24 sm:pb-16 lg:px-8">
        {/* Background pattern */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.10),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_80%_60%,rgba(139,92,246,0.06),transparent)]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-4 py-1.5 text-sm font-medium text-indigo-700 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Interactive Guide
          </div>

          {/* Title with gradient */}
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.15]">
            <span className="text-gray-900">AcadFlow </span>
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
              User Guide
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl">
            Everything you need to{" "}
            <strong className="text-gray-900">run and participate</strong> in
            academic conferences — from first setup to certificates.
          </p>

          {/* Quick links */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-md shadow-indigo-200/50 transition-all hover:bg-indigo-700 hover:-translate-y-0.5"
            >
              Get Started Free
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-5 py-2.5 font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
            >
              Need Help? Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* ── Conference Lifecycle Section ───────────────────── */}
      <section className="border-y border-gray-100 bg-slate-50/60 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Conference Lifecycle
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              The Complete Conference Journey
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-600">
              Every conference on AcadFlow follows this lifecycle — from creation to certification.
            </p>
          </div>

          <ConferenceLifecycle />
        </div>
      </section>

      {/* ── Search Bar ────────────────────────────────────── */}
      <section className="border-b border-gray-100 bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search the guide... (e.g. 'certificate', 'reviewer', 'submit paper')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3.5 pl-12 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Role Cards ────────────────────────────────────── */}
      <section className="bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Choose Your Role
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              What&apos;s your role in the conference?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-gray-600">
              Select your role below to see a step-by-step guide tailored to your workflow.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((role) => (
              <RoleCard
                key={role.id}
                id={role.id}
                title={role.title}
                description={role.description}
                icon={role.icon}
                color={role.color}
                stepCount={totalSteps(role)}
                isActive={activeRole === role.id}
                onClick={() => selectRole(role.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Content Panel ─────────────────────────────────── */}
      <section
        ref={contentRef}
        className="scroll-mt-20 border-t border-gray-100 bg-slate-50/40 px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      >
        <div className="mx-auto max-w-3xl">
          {/* Role header */}
          <div className="mb-8 flex items-center gap-4">
            <div
              className={`flex items-center justify-center rounded-xl p-3 ${
                currentRole.color === "indigo"
                  ? "bg-indigo-100"
                  : currentRole.color === "amber"
                  ? "bg-amber-100"
                  : currentRole.color === "emerald"
                  ? "bg-emerald-100"
                  : "bg-violet-100"
              }`}
            >
              <currentRole.icon
                className={`h-6 w-6 ${
                  currentRole.color === "indigo"
                    ? "text-indigo-600"
                    : currentRole.color === "amber"
                    ? "text-amber-600"
                    : currentRole.color === "emerald"
                    ? "text-emerald-600"
                    : "text-violet-600"
                }`}
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                {currentRole.title} Guide
              </h2>
              <p className="text-sm text-gray-500">
                {totalSteps(currentRole)} steps across {currentRole.sections.length} section
                {currentRole.sections.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Search results info */}
          {searchQuery && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
              <Search className="h-4 w-4 shrink-0" />
              <span>
                Showing results for{" "}
                <strong>&ldquo;{searchQuery}&rdquo;</strong>
                {filteredSections.length === 0 && " — No matches found. Try a different search."}
              </span>
            </div>
          )}

          {/* Accordion content */}
          {filteredSections.length > 0 ? (
            <GuideAccordion
              sections={filteredSections}
              color={currentRole.color}
            />
          ) : (
            !searchQuery && (
              <p className="text-center text-gray-500">
                Select a role above to view the guide.
              </p>
            )
          )}

          {/* Quick action link */}
          <div className="mt-10 text-center">
            {activeRole === "organizer" && (
              <Link
                href="/dashboard/onboarding/organization"
                className="group inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200/50 transition-all hover:bg-indigo-700 hover:-translate-y-0.5"
              >
                Start Organizing Your Conference
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
            {activeRole === "reviewer" && (
              <Link
                href="/dashboard/reviewer"
                className="group inline-flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-amber-200/50 transition-all hover:bg-amber-700 hover:-translate-y-0.5"
              >
                Open Reviewer Dashboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
            {activeRole === "author" && (
              <Link
                href="/dashboard/participant/overview"
                className="group inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-200/50 transition-all hover:bg-emerald-700 hover:-translate-y-0.5"
              >
                Go to Participant Dashboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
            {activeRole === "public" && (
              <Link
                href="/conferences"
                className="group inline-flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200/50 transition-all hover:bg-violet-700 hover:-translate-y-0.5"
              >
                Browse Conferences
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Tips Section ──────────────────────────────────── */}
      <section className="bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-50 to-white p-8 sm:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center rounded-xl bg-amber-100 p-2.5">
                <Lightbulb className="h-5 w-5 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Pro Tips for Best Experience
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: ShieldCheck,
                  title: "Secure Your Account",
                  text: "Use a strong password and verify your email address.",
                  color: "text-emerald-600 bg-emerald-100",
                },
                {
                  icon: Bell,
                  title: "Stay Updated",
                  text: "Check notifications regularly for submission and review updates.",
                  color: "text-indigo-600 bg-indigo-100",
                },
                {
                  icon: CalendarDays,
                  title: "Set Clear Deadlines",
                  text: "Organizers: set clear submission deadlines and assign reviewers early.",
                  color: "text-violet-600 bg-violet-100",
                },
                {
                  icon: Download,
                  title: "Save Certificates",
                  text: "Download your certificates promptly — they're QR-verified for authenticity.",
                  color: "text-amber-600 bg-amber-100",
                },
              ].map((tip) => (
                <div
                  key={tip.title}
                  className="flex gap-3 rounded-xl border border-gray-100 bg-white p-4 transition hover:border-gray-200 hover:shadow-sm"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tip.color}`}
                  >
                    <tip.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {tip.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600">
                      {tip.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Help link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Need more help?{" "}
                <Link
                  href="/contact"
                  className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  Contact our support team →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}