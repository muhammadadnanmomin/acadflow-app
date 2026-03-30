/* ================================================================
   AcadFlow — Certificate Generation API
   POST /api/generate-certificate
   POST /api/generate-certificate?format=docx   → organizer only, streams .docx
   POST /api/generate-certificate?format=pdf    → returns JSON URL (default)

   Supports certificateType: "participation" (default) | "best_paper"
   ================================================================ */

import { NextResponse }            from "next/server";
import { supabaseAdmin }           from "@/lib/supabase/admin";
import crypto                      from "crypto";

import { CertificateData, CertificateFormat, CertificateType } from "@/lib/certificate/types";
import { generateCertificatePdf }             from "@/lib/certificate/generatePdf";
import { generateCertificateDocx }            from "@/lib/certificate/generateDocx";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function generateVerificationCode(): string {
  return "CERT-" + crypto.randomBytes(8).toString("hex").toUpperCase();
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

const VALID_CERTIFICATE_TYPES: CertificateType[] = ["participation", "best_paper"];

/* ------------------------------------------------------------------ */
/*  DB helpers (shared between PDF and DOCX paths)                    */
/* ------------------------------------------------------------------ */

interface ConferenceOrg {
  name: string;
  logo_url: string | null;
}

async function getConferenceOrganizations(conferenceId: string): Promise<ConferenceOrg[]> {
  const { data: organizerRows, error: orgErr } = await supabaseAdmin
    .from("conference_organizers").select("user_id").eq("conference_id", conferenceId);
  if (orgErr || !organizerRows || organizerRows.length === 0) return [];

  const userIds = [...new Set(organizerRows.map((r: { user_id: string }) => r.user_id))];
  const { data: memberRows, error: memErr } = await supabaseAdmin
    .from("organization_members").select("organization_id").in("user_id", userIds);
  if (memErr || !memberRows || memberRows.length === 0) return [];

  const orgIds = [...new Set(memberRows.map((r: { organization_id: string }) => r.organization_id))];
  const { data: orgs, error: orgsErr } = await supabaseAdmin
    .from("organizations").select("name, logo_url").in("id", orgIds);
  if (orgsErr || !orgs || orgs.length === 0) return [];

  const seen = new Set<string>();
  const unique: ConferenceOrg[] = [];
  for (const org of orgs) {
    const key = (org.name ?? "").toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push({ name: org.name ?? "", logo_url: org.logo_url ?? null });
    if (unique.length === 4) break;
  }
  return unique;
}

/* ------------------------------------------------------------------ */
/*  POST handler                                                       */
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  try {
    /* --- Parse format from query param --- */
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") ?? "pdf") as CertificateFormat;

    if (format !== "pdf" && format !== "docx") {
      return NextResponse.json({ error: "Invalid format. Use pdf or docx." }, { status: 400 });
    }

    /* --- Parse request body --- */
    const {
      paperId,
      authorId,
      authorName,
      conferenceId,
      conferenceTitle,
      paperTitle,
      certificateType: rawCertType,
    } = await req.json();

    if (!paperId || !authorId) {
      return NextResponse.json({ error: "Missing paperId or authorId" }, { status: 400 });
    }

    /* --- Validate certificate type --- */
    const certificateType: CertificateType =
      rawCertType && VALID_CERTIFICATE_TYPES.includes(rawCertType)
        ? rawCertType
        : "participation";

    /* --- Best paper guard: verify paper is marked as best_paper --- */
    if (certificateType === "best_paper") {
      const { data: paperCheck } = await supabaseAdmin
        .from("paper_submissions")
        .select("award_type")
        .eq("id", paperId)
        .single();

      if (!paperCheck || paperCheck.award_type !== "best_paper") {
        return NextResponse.json(
          { error: "This paper is not marked as a Best Paper award recipient." },
          { status: 403 }
        );
      }
    }

    /* ----------------------------------------------------------------
       PDF PATH — check for existing cert in DB, return JSON with URL
       DOCX PATH — always generate fresh, stream directly to client
    ---------------------------------------------------------------- */

    if (format === "pdf") {
      const { data: existing } = await supabaseAdmin
        .from("certificates")
        .select("id,file_url,verification_code")
        .eq("paper_id", paperId)
        .eq("author_id", authorId)
        .eq("certificate_type", certificateType === "participation" ? "presentation" : certificateType)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({
          success: true,
          existing: true,
          url: existing.file_url,
          certificateId: existing.id,
          verificationCode: existing.verification_code,
        });
      }
    }

    /* --- Fetch conference details --- */
    interface SignatureRecord {
      name?: string;
      role: string;
      image_url: string;
      type?: string;
    }

    let resolvedConferenceTitle = (conferenceTitle as string) || "International Academic Conference";
    let conferenceDates         = "";
    let conferenceSignatures: SignatureRecord[] = [];

    if (conferenceId) {
      const { data: conference } = await supabaseAdmin
        .from("conferences")
        .select("title, short_name, start_date, end_date, signatures")
        .eq("id", conferenceId)
        .single();

      if (conference) {
        resolvedConferenceTitle = conference.title || resolvedConferenceTitle;
        conferenceSignatures    = (conference.signatures as SignatureRecord[]) ?? [];

        if (conference.start_date) {
          const start = formatDate(new Date(conference.start_date));
          const end   = conference.end_date ? formatDate(new Date(conference.end_date)) : null;
          conferenceDates = end ? `${start} \u2013 ${end}` : start;
        }
      }
    }

    /* --- Multi-org fetch --- */
    const conferenceOrgs: ConferenceOrg[] = conferenceId
      ? await getConferenceOrganizations(conferenceId)
      : [];

    /* --- Author affiliation --- */
    let authorAffiliation = "";
    if (authorId) {
      const { data: authorRow } = await supabaseAdmin
        .from("paper_authors")
        .select("affiliation")
        .eq("id", authorId)
        .maybeSingle();
      authorAffiliation = authorRow?.affiliation || "";
    }

    /* --- Build shared data object --- */
    const verificationCode = generateVerificationCode();
    const issuedAt         = new Date();

    const certData: CertificateData = {
      certificateType,
      authorName:           authorName || "Participant",
      authorAffiliation,
      paperTitle:           paperTitle || "",
      conferenceTitle:      resolvedConferenceTitle,
      conferenceDates,
      verificationCode,
      issuedAt,
      conferenceOrgs,
      conferenceSignatures,
    };

    /* ================================================================ */
    /*  DOCX — generate and stream directly                             */
    /* ================================================================ */

    if (format === "docx") {
      const docxBuffer = await generateCertificateDocx(certData);
      const docxBody   = docxBuffer.buffer.slice(
        docxBuffer.byteOffset,
        docxBuffer.byteOffset + docxBuffer.byteLength
      ) as ArrayBuffer;

      const safeName = (resolvedConferenceTitle || "certificate")
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()
        .slice(0, 40);

      const typeLabel = certificateType === "best_paper" ? "best_paper" : "certificate";

      return new Response(docxBody, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${safeName}_${typeLabel}.docx"`,
          "Content-Length": String(docxBuffer.byteLength),
        },
      });
    }

    /* ================================================================ */
    /*  PDF — generate, upload to Supabase, save DB record              */
    /* ================================================================ */

    const pdfBytes = await generateCertificatePdf(certData);

    // SHA-256 hash for tamper-detection
    const pdfHash = crypto.createHash("sha256").update(pdfBytes).digest("hex");

    const typeSlug = certificateType === "best_paper" ? "best_paper" : "presentation";
    const storagePath = conferenceId
      ? `${conferenceId}/${paperId}/${authorId}_${typeSlug}.pdf`
      : `${paperId}/${authorId}_${typeSlug}.pdf`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("certificates")
      .upload(storagePath, pdfBytes, { contentType: "application/pdf", upsert: true });

    if (uploadError) throw uploadError;

    const { data: storageData } = supabaseAdmin.storage
      .from("certificates")
      .getPublicUrl(storagePath);

    const { data: certRow, error: insertError } = await supabaseAdmin
      .from("certificates")
      .insert({
        paper_id:         paperId,
        author_id:        authorId,
        conference_id:    conferenceId || null,
        certificate_type: typeSlug,
        file_url:         storageData.publicUrl,
        verification_code: verificationCode,
        pdf_hash:         pdfHash,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Certificate DB insert error:", insertError);
    }

    return NextResponse.json({
      success: true,
      existing: false,
      url: storageData.publicUrl,
      certificateId: certRow?.id || null,
      verificationCode,
    });

  } catch (err: any) {
    console.error("CERT API ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Server error generating certificate" },
      { status: 500 }
    );
  }
}