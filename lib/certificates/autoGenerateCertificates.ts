/* ================================================================
   AcadFlow — Automatic Certificate Generation
   Server-side service that checks generation conditions and triggers
   certificate creation for all authors of a paper.
   ================================================================ */

import { supabaseAdmin } from "@/lib/supabase/admin";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AutoGenerateResult {
  paperId: string;
  generated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

/* ------------------------------------------------------------------ */
/*  Main Function                                                      */
/* ------------------------------------------------------------------ */

/**
 * Automatically generate certificates for all authors of a paper,
 * but only when **all** conditions are met:
 *   1. paper is accepted
 *   2. payment is completed
 *   3. paper has been presented
 *
 * Safe to call from any trigger point — it is idempotent and will
 * skip authors who already have certificates.
 */
export async function autoGenerateCertificates(
  paperId: string
): Promise<AutoGenerateResult> {
  const result: AutoGenerateResult = {
    paperId,
    generated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  try {
    console.info("[AutoCert] Checking generation conditions", { paperId });

    /* ---- 1. Fetch paper and verify conditions ---- */
    const { data: paper, error: paperErr } = await supabaseAdmin
      .from("paper_submissions")
      .select("id, title, status, payment_status, presented, conference_id")
      .eq("id", paperId)
      .single();

    if (paperErr || !paper) {
      console.warn("[AutoCert] Paper not found", { paperId });
      result.errors.push("Paper not found");
      result.failed = 1;
      return result;
    }

    // Check all three conditions
    if (paper.status !== "accepted") {
      console.info("[AutoCert] Skipping — paper not accepted", { paperId });
      return result;
    }
    if (paper.payment_status !== "paid") {
      console.info("[AutoCert] Skipping — payment not completed", { paperId });
      return result;
    }
    if (paper.presented !== true) {
      console.info("[AutoCert] Skipping — paper not presented", { paperId });
      return result;
    }

    /* ---- 2. Fetch all authors ---- */
    const { data: authors, error: authErr } = await supabaseAdmin
      .from("paper_authors")
      .select("id, name")
      .eq("submission_id", paperId)
      .order("author_order", { ascending: true });

    if (authErr || !authors || authors.length === 0) {
      console.warn("[AutoCert] No authors found", { paperId });
      result.errors.push("No authors found");
      return result;
    }

    /* ---- 3. Check existing certificates ---- */
    const { data: existingCerts } = await supabaseAdmin
      .from("certificates")
      .select("author_id")
      .eq("paper_id", paperId);

    const issuedAuthorIds = new Set(
      (existingCerts || []).map((c: { author_id: string }) => c.author_id)
    );

    // If all authors already have certificates, skip entirely
    const authorsNeedingCerts = authors.filter(
      (a: { id: string }) => !issuedAuthorIds.has(a.id)
    );

    if (authorsNeedingCerts.length === 0) {
      console.info("[AutoCert] All authors already have certificates", {
        paperId,
      });
      result.skipped = authors.length;

      // Ensure certificate_generated flag is set
      await supabaseAdmin
        .from("paper_submissions")
        .update({ certificate_generated: true })
        .eq("id", paperId);

      return result;
    }

    result.skipped = issuedAuthorIds.size;

    console.info("[AutoCert] Generating certificates", {
      paperId,
      authorCount: authorsNeedingCerts.length,
      skipped: result.skipped,
    });

    /* ---- 4. Determine template ---- */
    const { data: defaultTemplate } = await supabaseAdmin
      .from("certificate_templates")
      .select("id")
      .eq("conference_id", paper.conference_id)
      .eq("type", "presentation")
      .eq("is_default", true)
      .maybeSingle();

    /* ---- 5. Generate certificates in parallel ---- */
    const authorIds = authorsNeedingCerts.map((a: { id: string }) => a.id);

    // Use the internal API route to generate certificates
    // Build the absolute URL for internal fetching
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const generateResults = await Promise.all(
      authorIds.map(async (authorId: string) => {
        try {
          const res = await fetch(`${baseUrl}/api/generate-certificate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paperId,
              authorId,
              conferenceId: paper.conference_id,
              ...(defaultTemplate ? { templateId: defaultTemplate.id } : {}),
            }),
          });

          if (!res.ok) {
            const text = await res.text();
            throw new Error(`API returned ${res.status}: ${text}`);
          }

          const data = await res.json();
          return { authorId, success: data.success, existing: data.existing };
        } catch (err: any) {
          console.error("[AutoCert] Failed for author", {
            authorId,
            error: err.message,
          });
          return { authorId, success: false, error: err.message };
        }
      })
    );

    /* ---- 6. Tally results ---- */
    for (const r of generateResults) {
      if (r.success) {
        if (r.existing) {
          result.skipped++;
        } else {
          result.generated++;
        }
      } else {
        result.failed++;
        if (r.error) result.errors.push(`Author ${r.authorId}: ${r.error}`);
      }
    }

    /* ---- 7. Update certificate_generated flag ---- */
    if (result.failed === 0) {
      await supabaseAdmin
        .from("paper_submissions")
        .update({ certificate_generated: true })
        .eq("id", paperId);
    }

    console.info("[AutoCert] Generation complete", {
      paperId,
      generated: result.generated,
      skipped: result.skipped,
      failed: result.failed,
    });
  } catch (err: any) {
    console.error("[AutoCert] Unexpected error", { paperId, error: err.message });
    result.errors.push(err.message);
    result.failed++;
  }

  return result;
}
