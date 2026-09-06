/* ================================================================
   Confairo — Public Certificate Verification Page
   Anyone can visit /verify/{verificationCode} to confirm the
   authenticity of a certificate.  No authentication required.
   ================================================================ */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  CheckCircle2,
  XCircle,
  User,
  FileText,
  Building2,
  Calendar,
  Award,
  ShieldCheck,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CertificateRow {
  id: string;
  paper_id: string;
  author_id: string;
  conference_id: string;
  certificate_type: string;
  file_url: string | null;
  verification_code: string;
  issued_at: string;
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Verify Certificate — Confairo",
  description: "Verify the authenticity of a Confairo certificate.",
};

/* ------------------------------------------------------------------ */
/*  Page Props                                                         */
/* ------------------------------------------------------------------ */

interface PageProps {
  params: Promise<{ code: string }>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const TYPE_LABELS: Record<string, string> = {
  presentation: "Presentation",
  participation: "Participation",
  best_paper: "Best Paper Award",
  reviewer: "Reviewer",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default async function VerifyCertificatePage({ params }: PageProps) {
  const { code } = await params;

  /* ---- Fetch certificate by verification_code ---- */
  const { data: cert } = await supabaseAdmin
    .from("certificates")
    .select("*")
    .eq("verification_code", code)
    .maybeSingle<CertificateRow>();

  /* ---- Invalid certificate ---- */
  if (!cert) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Red header */}
            <div className="bg-gradient-to-r from-red-500 to-rose-500 px-6 py-8 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                <XCircle className="h-9 w-9 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                Certificate Not Found
              </h1>
            </div>

            {/* Body */}
            <div className="px-6 py-8 text-center">
              <p className="text-gray-600 text-sm leading-relaxed">
                This certificate could not be verified. The verification code
                may be incorrect or the certificate may have been revoked.
              </p>
              <p className="text-gray-400 text-xs mt-4">
                Code: <span className="font-mono">{code}</span>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Powered by{" "}
            <span className="font-semibold text-gray-500">Confairo</span>
          </p>
        </div>
      </div>
    );
  }

  /* ---- Fetch related data ---- */
  const [authorRes, paperRes, conferenceRes] = await Promise.all([
    supabaseAdmin
      .from("paper_authors")
      .select("name, email, affiliation")
      .eq("id", cert.author_id)
      .single(),
    supabaseAdmin
      .from("paper_submissions")
      .select("title")
      .eq("id", cert.paper_id)
      .single(),
    supabaseAdmin
      .from("conferences")
      .select("title")
      .eq("id", cert.conference_id)
      .single(),
  ]);

  const authorName = authorRes.data?.name ?? "Unknown";
  const authorAffiliation = authorRes.data?.affiliation ?? null;
  const paperTitle = paperRes.data?.title ?? "Unknown";
  const conferenceName = conferenceRes.data?.title ?? "Unknown";
  const certTypeLabel =
    TYPE_LABELS[cert.certificate_type] ?? cert.certificate_type;
  const issuedDate = formatDate(cert.issued_at);

  /* ---- Valid certificate ---- */
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Green header */}
          <div className="bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-8 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <CheckCircle2 className="h-9 w-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              Certificate Verified
            </h1>
            <p className="text-emerald-50 text-sm mt-1">
              This certificate is authentic and valid
            </p>
          </div>

          {/* Details */}
          <div className="px-6 py-6 space-y-5">
            {/* Author */}
            <DetailRow
              icon={User}
              label="Author"
              value={authorName}
              subtitle={authorAffiliation}
            />

            {/* Paper */}
            <DetailRow
              icon={FileText}
              label="Paper"
              value={paperTitle}
              italic
            />

            {/* Conference */}
            <DetailRow
              icon={Building2}
              label="Conference"
              value={conferenceName}
            />

            {/* Certificate Type */}
            <DetailRow
              icon={Award}
              label="Certificate Type"
              value={certTypeLabel}
            />

            {/* Issue Date */}
            <DetailRow
              icon={Calendar}
              label="Issued"
              value={issuedDate}
            />

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Certificate ID */}
            <DetailRow
              icon={ShieldCheck}
              label="Certificate ID"
              value={cert.verification_code}
              mono
            />
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by{" "}
          <span className="font-semibold text-gray-500">Confairo</span>
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DetailRow                                                          */
/* ------------------------------------------------------------------ */

function DetailRow({
  icon: Icon,
  label,
  value,
  subtitle,
  italic,
  mono,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle?: string | null;
  italic?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50">
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
          {label}
        </p>
        <p
          className={`text-sm text-gray-900 mt-0.5 break-words ${italic ? "italic" : ""
            } ${mono ? "font-mono text-xs" : ""}`}
        >
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
