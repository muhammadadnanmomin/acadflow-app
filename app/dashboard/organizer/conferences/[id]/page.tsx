"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import ShareConference from "@/components/shared/ShareConference";
import SignatureManager from "@/components/signature/SignatureManager";
import CoOrganizerManager from "@/components/conference/CoOrganizerManager";
import { getMyConferenceIds } from "@/lib/conference/getMyConferenceIds";

import {
  ArrowLeft,
  Calendar,
  Tag,
  Settings,
  CreditCard,
  BookOpen,
  FileText,
  Globe,
  Clock,
  Download,
  MessageCircle,
  ExternalLink,
  CheckCircle,
  Monitor,
  Users,
  Mail,
  Phone,
  Pencil,
  Share2,
  PenLine,
} from "lucide-react";

const supabase = createClient();

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(date: string | null) {
  if (!date) return "—";
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

export default function ConferenceDetails() {
  const params = useParams();
  const router = useRouter();

  const { profile, loading } = useProfile();

  const [conference, setConference] = useState<any>(null);
  const [categoryFees, setCategoryFees] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const id = params.id as string;

  /* Load conference */
  async function loadConference() {
    if (!profile || !id) return;

    // Check multi-organizer access
    const myIds = await getMyConferenceIds(profile.id);
    if (!myIds.includes(id)) {
      setPageLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("conferences")
      .select("*")
      .eq("id", id)
      .single();

    if (!error) {
      setConference(data);
    }

    /* Load category-based fees */
    const { data: feeRows } = await supabase
      .from("conference_fee_categories")
      .select("*")
      .eq("conference_id", id);

    setCategoryFees(feeRows || []);

    setPageLoading(false);
  }

  useEffect(() => {
    if (!loading) loadConference();
  }, [loading, profile]);

  if (loading || pageLoading) {
    return <p className="p-6">Loading...</p>;
  }

  if (!conference) {
    return (
      <div className="p-6 space-y-4">
        <p>Conference not found.</p>

        <Button onClick={() => router.back()}>
          Go Back
        </Button>

      </div>
    );
  }

  /* Derived data */
  const conf = conference;
  const tracks: string[] = conf.tracks ?? [];
  const currencySymbol = getCurrencySymbol(conf.currency);

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

  const today = new Date().toISOString().split("T")[0];

  /* Submission settings visibility */
  const hasSubmissionSettings =
    conf.sample_paper_format_url ||
    conf.max_authors_per_paper ||
    (conf.allowed_file_types && conf.allowed_file_types.length > 0) ||
    (conf.allowed_submission_types && conf.allowed_submission_types.length > 0) ||
    conf.max_file_size_mb;

  /* Links visibility */
  const hasLinks =
    conf.brochure_url ||
    conf.whatsapp_group_link ||
    conf.website_link ||
    conf.contact_email ||
    conf.contact_phone;

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ============================================================ */}
      {/*  Top Bar                                                      */}
      {/* ============================================================ */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Button
          variant="outline"
          onClick={() =>
            router.push(`/dashboard/organizer/conferences/${id}/edit`)
          }
          className="gap-2"
        >
          <Pencil className="h-4 w-4" />
          Edit Conference
        </Button>

        {conf.is_published && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-4">
              <p className="text-sm font-medium text-gray-800 mb-2">Share Conference</p>
              <ShareConference
                url={`${process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")}/conferences/${id}`}
                title={conf.title}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* ============================================================ */}
      {/*  1. HERO / HEADER SECTION                                     */}
      {/* ============================================================ */}
      <Card className="overflow-hidden p-0">

        {/* Banner */}
        {conf.conference_banner_url && (
          <div className="relative h-40 md:h-56 w-full overflow-hidden">
            <img
              src={conf.conference_banner_url}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
          </div>
        )}

        {/* Main info */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">

            {/* Logo */}
            {conf.conference_logo_url && (
              <img
                src={conf.conference_logo_url}
                alt=""
                className="h-16 w-16 rounded-full border-2 border-gray-200 shadow object-cover shrink-0"
              />
            )}

            <div className="min-w-0 flex-1 space-y-2">
              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                {conf.title}
                {conf.short_name && (
                  <Badge
                    variant="secondary"
                    className="ml-3 align-middle text-xs"
                  >
                    {conf.short_name}
                  </Badge>
                )}
              </h1>

              {/* Meta badges row */}
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                {/* Date range */}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(conf.start_date)} → {formatDate(conf.end_date)}
                </span>

                {/* Mode */}
                {conf.mode && (
                  <Badge variant="outline" className="capitalize">
                    <Monitor className="h-3 w-3" />
                    {conf.mode}
                  </Badge>
                )}

                {/* Published / Draft */}
                <Badge
                  className={
                    conf.is_published
                      ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
                      : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }
                >
                  {conf.is_published ? "Published" : "Draft"}
                </Badge>

                {/* Currency */}
                {conf.currency && (
                  <Badge variant="outline">
                    <CreditCard className="h-3 w-3" />
                    {conf.currency}
                  </Badge>
                )}

                {/* Venue */}
                {conf.venue && (
                  <span className="flex items-center gap-1 text-gray-500">
                    <Globe className="h-3.5 w-3.5" />
                    {conf.venue}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {conf.description && (
            <p className="text-sm leading-relaxed text-gray-600 border-t pt-4">
              {conf.description}
            </p>
          )}
        </div>
      </Card>

      {/* ============================================================ */}
      {/*  2. IMPORTANT DATES                                           */}
      {/* ============================================================ */}
      {deadlineEntries.length > 0 && (
        <Card className="p-6">
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
        </Card>
      )}

      {/* ============================================================ */}
      {/*  3. TRACKS & CATEGORIES                                       */}
      {/* ============================================================ */}
      <Card className="p-6">
        <SectionHeading icon={Tag} title="Tracks & Categories" />

        {tracks.length > 0 ? (
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
        ) : (
          <p className="text-sm text-gray-500">No tracks added</p>
        )}
      </Card>

      {/* ============================================================ */}
      {/*  4. SUBMISSION SETTINGS                                       */}
      {/* ============================================================ */}
      {hasSubmissionSettings && (
        <Card className="p-6">
          <SectionHeading icon={Settings} title="Submission Settings" />

          <div className="space-y-4">

            {/* Allowed submission types */}
            {conf.allowed_submission_types &&
              conf.allowed_submission_types.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">
                    Allowed Submission Types
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {conf.allowed_submission_types.map((st: string) => (
                      <Badge
                        key={st}
                        variant="outline"
                        className="text-xs capitalize"
                      >
                        {st}
                      </Badge>
                    ))}
                  </div>
                </div>
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

              {conf.allowed_file_types &&
                conf.allowed_file_types.length > 0 && (
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

            {/* Sample paper format download */}
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
          </div>
        </Card>
      )}

      {/* ============================================================ */}
      {/*  5. PAYMENT SETTINGS                                          */}
      {/* ============================================================ */}
      <Card className="p-6">
        <SectionHeading icon={CreditCard} title="Payment Settings" />

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
        ) : categoryFees.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {categoryFees.map((cat: any) => {
              const isListener = cat.category_name === "Listener";
              return (
                <div
                  key={cat.category_name}
                  className="rounded-lg border p-4 space-y-2"
                >
                  <p className="text-sm font-semibold text-gray-900">
                    {cat.category_name}
                  </p>

                  {isListener ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Listener Fee</span>
                      <span className="font-medium text-gray-900">
                        {currencySymbol}{cat.listener_fee ?? 0}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {cat.physical_presentation_fee != null && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Physical Presentation</span>
                          <span className="font-medium text-gray-900">
                            {currencySymbol}{cat.physical_presentation_fee}
                          </span>
                        </div>
                      )}
                      {cat.virtual_presentation_fee != null && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Virtual Presentation</span>
                          <span className="font-medium text-gray-900">
                            {currencySymbol}{cat.virtual_presentation_fee}
                          </span>
                        </div>
                      )}
                      {cat.full_paper_publication_fee != null && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Full Paper Publication</span>
                          <span className="font-medium text-gray-900">
                            {currencySymbol}{cat.full_paper_publication_fee}
                          </span>
                        </div>
                      )}
                      {cat.abstract_publication_fee != null && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Abstract Publication</span>
                          <span className="font-medium text-gray-900">
                            {currencySymbol}{cat.abstract_publication_fee}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Fee details will be updated soon.
          </p>
        )}
      </Card>

      {/* ============================================================ */}
      {/*  6. PROCEEDINGS & PUBLICATION                                  */}
      {/* ============================================================ */}
      {conf.publish_proceedings && (
        <Card className="p-6">
          <SectionHeading icon={BookOpen} title="Proceedings & Publication" />

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
        </Card>
      )}

      {/* ============================================================ */}
      {/*  MANAGE PROCEEDINGS (contextual action)                       */}
      {/* ============================================================ */}
      <Card className="p-6">
        <SectionHeading icon={BookOpen} title="Manage Proceedings" />

        {conf.end_date && conf.end_date < today ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              Upload and publish conference proceedings for authorized
              participants.
            </p>
            <Button
              onClick={() =>
                router.push(`/dashboard/organizer/proceedings/${id}`)
              }
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 shrink-0"
            >
              <BookOpen className="h-4 w-4" />
              Manage Proceedings
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-5 py-4">
            <BookOpen className="h-5 w-5 text-gray-400 shrink-0" />
            <p className="text-sm text-gray-500">
              Proceedings can be uploaded after the conference ends
              {conf.end_date && (
                <span className="text-gray-400">
                  {" "}
                  ({formatDate(conf.end_date)})
                </span>
              )}
            </p>
          </div>
        )}
      </Card>

      {/* ============================================================ */}
      {/*  7. CERTIFICATE SIGNATURES                                    */}
      {/* ============================================================ */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
            <PenLine className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Certificate Signatures</h3>
            <p className="text-xs text-gray-500 mt-0.5">Configure 2–3 signatures to appear on generated certificates</p>
          </div>
        </div>
        <SignatureManager conferenceId={id} />
      </Card>

      {/* ============================================================ */}
      {/*  8. CO-ORGANIZERS                                            */}
      {/* ============================================================ */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
            <Users className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Co-Organizers</h3>
            <p className="text-xs text-gray-500 mt-0.5">Manage who can collaborate on this conference</p>
          </div>
        </div>
        <CoOrganizerManager conferenceId={id} />
      </Card>

      {/* ============================================================ */}
      {/*  8. LINKS & RESOURCES                                         */}
      {/* ============================================================ */}
      {hasLinks && (
        <Card className="p-6">
          <SectionHeading icon={Globe} title="Links & Resources" />

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
        </Card>
      )}

    </div>
  );
}
