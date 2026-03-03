import { supabaseServerClient } from "@/lib/supabase/server-client";
import RegisterButtons from "@/components/conferences/RegisterButtons";
import { Badge } from "@/components/ui/badge";

import {
  Calendar,
  MapPin,
  Globe,
  Phone,
  Mail,
  Users,
  CreditCard,
  Clock,
  FileText,
  Download,
  MessageCircle,
  BookOpen,
  Tag,
  Settings,
  ExternalLink,
  CheckCircle,
  XCircle,
  Monitor,
} from "lucide-react";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getCurrencySymbol(currency: string | null) {
  switch (currency) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "INR":
    default:
      return "₹";
  }
}

function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
        <Icon className="h-4 w-4 text-indigo-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function ConferenceDetail({ params }: Props) {
  const { id } = await params;

  const { data: conf, error } = await supabaseServerClient
    .from("conferences")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (error) console.error(error);

  if (!conf) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <BookOpen className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          Conference not available
        </h2>
        <p className="text-gray-500 mt-2">
          This conference may be unpublished or removed.
        </p>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const submissionsOpen =
    conf.submission_deadline && conf.submission_deadline >= today;

  const tracks: string[] = conf.tracks ?? [];
  const currencySymbol = getCurrencySymbol(conf.currency);

  /* Fee entries for display */
  const feeEntries: { label: string; amount: number }[] = [];
  if (conf.registration_fee != null)
    feeEntries.push({ label: "Registration", amount: conf.registration_fee });
  if (conf.physical_presentation_fee != null)
    feeEntries.push({
      label: "Physical Presentation",
      amount: conf.physical_presentation_fee,
    });
  if (conf.virtual_presentation_fee != null && conf.virtual_presentation_fee > 0)
    feeEntries.push({
      label: "Virtual Presentation",
      amount: conf.virtual_presentation_fee,
    });
  if (conf.full_paper_publication_fee != null)
    feeEntries.push({
      label: "Full Paper Publication",
      amount: conf.full_paper_publication_fee,
    });
  if (conf.abstract_publication_fee != null)
    feeEntries.push({
      label: "Abstract Publication",
      amount: conf.abstract_publication_fee,
    });

  /* Deadline entries */
  const deadlineEntries: { label: string; date: string }[] = [];
  if (conf.submission_deadline)
    deadlineEntries.push({
      label: "Submission Deadline",
      date: conf.submission_deadline,
    });
  if (conf.abstract_deadline)
    deadlineEntries.push({
      label: "Abstract Deadline",
      date: conf.abstract_deadline,
    });
  if (conf.review_deadline)
    deadlineEntries.push({
      label: "Review Deadline",
      date: conf.review_deadline,
    });
  if (conf.camera_ready_deadline)
    deadlineEntries.push({
      label: "Camera-Ready Deadline",
      date: conf.camera_ready_deadline,
    });
  if (conf.registration_deadline)
    deadlineEntries.push({
      label: "Registration Deadline",
      date: conf.registration_deadline,
    });

  /* Submission settings visibility */
  const hasSubmissionSettings =
    conf.sample_paper_format_url ||
    conf.max_authors_per_paper ||
    (conf.allowed_file_types && conf.allowed_file_types.length > 0) ||
    conf.max_file_size_mb;

  /* Contact/Links visibility */
  const hasContactInfo =
    conf.contact_email ||
    conf.contact_phone ||
    conf.website_link ||
    conf.brochure_url ||
    conf.whatsapp_group_link;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">

      {/* ============================================================ */}
      {/*  1. HERO SECTION                                              */}
      {/* ============================================================ */}
      <div className="rounded-xl border bg-white overflow-hidden">

        {/* ---- Desktop Banner (hidden on mobile) ---- */}
        {conf.conference_banner_url && (
          <div className="relative hidden md:block h-64 md:h-80 lg:h-96 w-full overflow-hidden">
            {/* Banner image */}
            <img
              src={conf.conference_banner_url}
              alt=""
              className="h-full w-full object-cover"
            />

            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />

            {/* Content positioned at bottom — desktop only */}
            <div className="absolute bottom-6 left-6 right-6 z-10">
              <div className="flex items-end gap-4">
                {/* Logo — desktop only */}
                {conf.conference_logo_url && (
                  <img
                    src={conf.conference_logo_url}
                    alt=""
                    className="h-20 w-20 rounded-xl border-2 border-white shadow-lg object-cover shrink-0"
                  />
                )}

                <div className="min-w-0 flex-1">
                  {/* Title + Short name */}
                  <h1 className="text-3xl lg:text-4xl font-bold text-white drop-shadow-lg tracking-tight">
                    {conf.title}
                    {conf.short_name && (
                      <Badge className="ml-3 align-middle text-xs bg-black/50 text-white border-white/20 backdrop-blur hover:bg-black/60">
                        {conf.short_name}
                      </Badge>
                    )}
                  </h1>

                  {/* Meta row */}
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-white/90 drop-shadow">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(conf.start_date)} →{" "}
                      {formatDate(conf.end_date)}
                    </span>

                    {conf.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {conf.venue}
                      </span>
                    )}

                    {conf.mode && (
                      <Badge
                        variant="outline"
                        className="capitalize border-white/40 text-white"
                      >
                        <Monitor className="h-3 w-3" />
                        {conf.mode}
                      </Badge>
                    )}

                    {/* Submission Status */}
                    {conf.submission_deadline &&
                      (submissionsOpen ? (
                        <Badge className="bg-green-500/80 text-white border-green-400/40 backdrop-blur hover:bg-green-500/90">
                          <CheckCircle className="h-3 w-3" />
                          Submissions Open
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/70 text-white border-red-400/40 backdrop-blur hover:bg-red-500/80">
                          <XCircle className="h-3 w-3" />
                          Submissions Closed
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---- Mobile / No-banner hero content ---- */}
        <div
          className={`px-4 md:px-8 py-6 md:py-10 ${conf.conference_banner_url ? "md:hidden" : ""
            }`}
        >
          <div className="flex items-start gap-4">
            {/* Logo — only show on no-banner (desktop shows it on the banner) */}
            {conf.conference_logo_url && !conf.conference_banner_url && (
              <img
                src={conf.conference_logo_url}
                alt=""
                className="h-16 w-16 md:h-20 md:w-20 rounded-xl border-2 border-gray-200 object-cover shrink-0"
              />
            )}

            <div className="min-w-0 flex-1">
              {/* Title + Short name */}
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                {conf.title}
                {conf.short_name && (
                  <Badge
                    variant="secondary"
                    className="ml-2 align-middle text-xs"
                  >
                    {conf.short_name}
                  </Badge>
                )}
              </h1>

              {/* Meta row */}
              <div className="mt-2 flex flex-wrap gap-2 md:gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(conf.start_date)} →{" "}
                  {formatDate(conf.end_date)}
                </span>

                {conf.venue && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {conf.venue}
                  </span>
                )}

                {conf.mode && (
                  <Badge variant="outline" className="capitalize">
                    <Monitor className="h-3 w-3" />
                    {conf.mode}
                  </Badge>
                )}

                {/* Submission Status */}
                {conf.submission_deadline &&
                  (submissionsOpen ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                      <CheckCircle className="h-3 w-3" />
                      Submissions Open
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="text-red-600 bg-red-50 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="h-3 w-3" />
                      Submissions Closed
                    </Badge>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {conf.description && (
          <div className="px-4 md:px-8 pb-6 mt-6">
            <p className="text-sm md:text-base leading-relaxed text-gray-600">
              {conf.description}
            </p>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/*  MAIN GRID                                                    */}
      {/* ============================================================ */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* ---- Left Content ---- */}
        <div className="md:col-span-2 space-y-6">

          {/* ======================================================== */}
          {/*  2. IMPORTANT DATES                                       */}
          {/* ======================================================== */}
          {deadlineEntries.length > 0 && (
            <div className="rounded-xl border bg-white p-6">
              <SectionHeading icon={Clock} title="Important Dates" />

              <div className="grid sm:grid-cols-2 gap-3">
                {deadlineEntries.map((d) => {
                  const isPast = d.date < today;
                  return (
                    <div
                      key={d.label}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${isPast
                        ? "bg-gray-50 border-gray-200"
                        : "bg-indigo-50/50 border-indigo-100"
                        }`}
                    >
                      <Calendar
                        className={`h-4 w-4 shrink-0 ${isPast ? "text-gray-400" : "text-indigo-500"
                          }`}
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">{d.label}</p>
                        <p
                          className={`text-sm font-medium ${isPast ? "text-gray-500" : "text-gray-900"
                            }`}
                        >
                          {formatDate(d.date)}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {conf.max_participants && (
                  <div className="flex items-center gap-3 rounded-lg border bg-gray-50 border-gray-200 px-4 py-3">
                    <Users className="h-4 w-4 shrink-0 text-gray-400" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Max Participants</p>
                      <p className="text-sm font-medium text-gray-900">
                        {conf.max_participants}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/*  3. TRACKS / CATEGORIES                                   */}
          {/* ======================================================== */}
          {tracks.length > 0 && (
            <div className="rounded-xl border bg-white p-6">
              <SectionHeading icon={Tag} title="Tracks / Categories" />

              <div className="flex flex-wrap gap-2">
                {tracks.map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="px-3 py-1 text-sm"
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/*  4. SUBMISSION SETTINGS                                   */}
          {/* ======================================================== */}
          {hasSubmissionSettings && (
            <div className="rounded-xl border bg-white p-6">
              <SectionHeading icon={Settings} title="Submission Settings" />

              <div className="space-y-3">

                {conf.sample_paper_format_url && (
                  <a
                    href={conf.sample_paper_format_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    Download Sample Paper Format
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}

                <div className="grid sm:grid-cols-3 gap-3 text-sm">

                  {conf.max_authors_per_paper != null && (
                    <div className="rounded-lg border px-4 py-3">
                      <p className="text-xs text-gray-500">
                        Max Authors per Paper
                      </p>
                      <p className="font-medium text-gray-900">
                        {conf.max_authors_per_paper}
                      </p>
                    </div>
                  )}

                  {conf.allowed_file_types && conf.allowed_file_types.length > 0 && (
                    <div className="rounded-lg border px-4 py-3">
                      <p className="text-xs text-gray-500 mb-1">
                        Allowed File Types
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {conf.allowed_file_types.map((ft: string) => (
                          <Badge
                            key={ft}
                            variant="outline"
                            className="text-xs uppercase"
                          >
                            {ft}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {conf.max_file_size_mb != null && (
                    <div className="rounded-lg border px-4 py-3">
                      <p className="text-xs text-gray-500">Max File Size</p>
                      <p className="font-medium text-gray-900">
                        {conf.max_file_size_mb} MB
                      </p>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/*  5. REGISTRATION FEES                                     */}
          {/* ======================================================== */}
          <div className="rounded-xl border bg-white p-6">
            <SectionHeading icon={CreditCard} title="Registration Fees" />

            {conf.payment_required === false ? (
              <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-5 py-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">
                    Free Conference
                  </p>
                  <p className="text-sm text-green-600">
                    No registration fee required
                  </p>
                </div>
              </div>
            ) : feeEntries.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {feeEntries.map((fe) => (
                  <div
                    key={fe.label}
                    className="flex items-center justify-between rounded-lg border px-4 py-3"
                  >
                    <span className="text-sm text-gray-600">{fe.label}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {currencySymbol}
                      {fe.amount}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Fee details will be updated soon.
              </p>
            )}
          </div>

          {/* ======================================================== */}
          {/*  6. PROCEEDINGS                                           */}
          {/* ======================================================== */}
          {conf.publish_proceedings && (
            <div className="rounded-xl border bg-white p-6">
              <SectionHeading icon={BookOpen} title="Proceedings" />

              <div className="grid sm:grid-cols-2 gap-3">
                {conf.proceedings_isbn && (
                  <div className="rounded-lg border px-4 py-3">
                    <p className="text-xs text-gray-500">ISBN</p>
                    <p className="text-sm font-medium text-gray-900">
                      {conf.proceedings_isbn}
                    </p>
                  </div>
                )}
                {conf.journal_name && (
                  <div className="rounded-lg border px-4 py-3">
                    <p className="text-xs text-gray-500">Journal / Publisher</p>
                    <p className="text-sm font-medium text-gray-900">
                      {conf.journal_name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/*  7. CONTACT & LINKS                                       */}
          {/* ======================================================== */}
          {hasContactInfo && (
            <div className="rounded-xl border bg-white p-6">
              <SectionHeading icon={Globe} title="Contact & Links" />

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                {conf.brochure_url && (
                  <a
                    href={conf.brochure_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download Brochure
                  </a>
                )}

                {conf.whatsapp_group_link && (
                  <a
                    href={conf.whatsapp_group_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Join WhatsApp Group
                  </a>
                )}
              </div>

              {/* Contact details */}
              <div className="space-y-2">
                {conf.contact_email && (
                  <a
                    href={`mailto:${conf.contact_email}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    {conf.contact_email}
                  </a>
                )}

                {conf.contact_phone && (
                  <a
                    href={`tel:${conf.contact_phone}`}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                  >
                    <Phone className="h-4 w-4 shrink-0" />
                    {conf.contact_phone}
                  </a>
                )}

                {conf.website_link && (
                  <a
                    href={conf.website_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-indigo-600 hover:underline"
                  >
                    <Globe className="h-4 w-4 shrink-0" />
                    Official Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )}

        </div>

        {/* ---- Right Sidebar ---- */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-5 space-y-4 sticky top-24">
            <h3 className="font-semibold text-lg">Participate</h3>

            <p className="text-sm text-gray-500">
              Register, submit your paper, or attend this conference.
            </p>

            <RegisterButtons conferenceId={id} />

            <div className="flex items-center gap-2 text-xs text-gray-400 pt-2">
              <CreditCard className="h-4 w-4" />
              Secure Payment via Platform
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}