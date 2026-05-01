// ============================================================
// AcadFlow AI Paper Reviewer — /api/review-paper
// POST: Analyze a submission's paper via hybrid AI
// Uses: Shared AI provider (Groq → Gemini fallback)
// Features: auth, intelligent routing, caching, chunking,
//           safe JSON, decision normalization
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseServer } from "@/lib/supabase/server";
import {
  callAI,
  callAIWithJSONRetry,
  extractTextFromBuffer,
  processTextForAI,
  safeParseJSON,
} from "@/lib/ai/provider";

// ── Constants ─────────────────────────────────────────────────
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ── Normalize AI Decision to standard labels ──────────────────
function normalizeDecision(raw: string): string {
  const lower = (raw || "").toLowerCase().trim();
  if (lower.includes("reject")) return "Reject";
  if (lower.includes("major")) return "Major Revision";
  if (lower.includes("minor")) return "Minor Revision";
  if (lower.includes("accept")) return "Accept";
  return raw || "Unknown";
}

// ── Review Prompt ─────────────────────────────────────────────
function buildReviewMessages(paperText: string) {
  return [
    {
      role: "system" as const,
      content:
        "You are an expert academic reviewer. Provide professional, unbiased, and constructive feedback. You MUST respond ONLY with valid JSON — no markdown, no explanation, no extra text.",
    },
    {
      role: "user" as const,
      content: `Analyze the following research paper and respond ONLY in valid JSON with this exact structure:

{
  "summary": "A comprehensive 3-5 sentence summary of the paper",
  "key_contributions": ["contribution 1", "contribution 2"],
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "grammar_issues": ["issue 1", "issue 2"],
  "final_decision": "Accept / Minor Revision / Major Revision / Reject",
  "confidence_score": 75
}

Rules:
- confidence_score must be a number between 0 and 100
- final_decision must be exactly one of: Accept, Minor Revision, Major Revision, Reject
- All arrays should have at least 2 items
- Do NOT wrap in markdown code blocks
- Respond with ONLY the JSON object

Paper:
"""
${paperText}
"""`,
    },
  ];
}

// ── Cache helpers ─────────────────────────────────────────────
async function getCachedReview(submissionId: string) {
  try {
    const { data } = await supabaseServer
      .from("ai_paper_reviews")
      .select("review_data, model_used, created_at")
      .eq("submission_id", submissionId)
      .single();
    return data;
  } catch {
    return null;
  }
}

async function cacheReview(
  submissionId: string,
  reviewData: Record<string, any>,
  model: string
) {
  try {
    await supabaseServer.from("ai_paper_reviews").upsert(
      {
        submission_id: submissionId,
        review_data: reviewData,
        model_used: model,
        created_at: new Date().toISOString(),
      },
      { onConflict: "submission_id" }
    );
  } catch (err) {
    console.warn("Failed to cache AI review (table may not exist yet):", err);
  }
}

// ── Main POST Handler ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // 1. Auth check — verify user is logged in
    let userId: string | null = null;
    let userRole: string = "guest";
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      userId = user.id;

      // Get user role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      userRole = profile?.role ?? "guest";
    } catch {
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    // 2. Parse request
    const body = await req.json();
    const { submissionId, forceRegenerate } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: "submissionId is required" },
        { status: 400 }
      );
    }

    // 3. Check cache (unless force regenerate)
    if (!forceRegenerate) {
      const cached = await getCachedReview(submissionId);
      if (cached) {
        return NextResponse.json({
          success: true,
          review: cached.review_data,
          model: cached.model_used,
          cached: true,
          cachedAt: cached.created_at,
        });
      }
    }

    // 4. Fetch paper submission
    const { data: paper, error: paperErr } = await supabaseServer
      .from("paper_submissions")
      .select("id, file_url, title, reviewer_id")
      .eq("id", submissionId)
      .single();

    if (paperErr || !paper) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // 5. Authorization — organizer/admin always allowed, reviewer only if assigned
    const isOrganizerOrAdmin = ["organizer", "admin"].includes(userRole);
    const isAssignedReviewer = userRole === "reviewer" && paper.reviewer_id === userId;

    if (!isOrganizerOrAdmin && !isAssignedReviewer) {
      return NextResponse.json(
        { error: "You do not have permission to review this paper" },
        { status: 403 }
      );
    }

    if (!paper.file_url) {
      return NextResponse.json(
        { error: "No paper file uploaded for this submission" },
        { status: 400 }
      );
    }

    // 6. Download file
    const fileRes = await fetch(paper.file_url);
    if (!fileRes.ok) {
      return NextResponse.json(
        { error: "Failed to download paper file" },
        { status: 500 }
      );
    }

    const fileBuffer = Buffer.from(await fileRes.arrayBuffer());

    if (fileBuffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 10MB size limit" },
        { status: 400 }
      );
    }

    // 7. Extract text
    const fileName = paper.file_url.split("/").pop() || "paper.pdf";
    let rawText: string;
    try {
      rawText = await extractTextFromBuffer(fileBuffer, fileName);
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || "Failed to extract text from paper" },
        { status: 400 }
      );
    }

    if (!rawText || rawText.trim().length < 100) {
      return NextResponse.json(
        {
          error:
            "Could not extract sufficient text from the paper. The file may be image-based or corrupted.",
        },
        { status: 400 }
      );
    }

    // 8. Process text (direct / smart extraction / chunking)
    const { processed, method } = await processTextForAI(rawText);

    // 9. Call AI for the review (intelligent routing)
    const messages = buildReviewMessages(processed);
    let aiResult;

    try {
      aiResult = await callAIWithJSONRetry({
        messages,
        maxTokens: 1500,
        preferProvider: "auto",
        textLength: processed.length,
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || "AI analysis temporarily unavailable. Please try again." },
        { status: 500 }
      );
    }

    const review = aiResult.parsed;

    // 10. Normalize decision
    if (review.final_decision) {
      review.final_decision = normalizeDecision(review.final_decision);
    }

    // Ensure confidence_score is a number
    if (typeof review.confidence_score === "string") {
      review.confidence_score = parseInt(review.confidence_score, 10) || 50;
    }
    review.confidence_score = Math.max(
      0,
      Math.min(100, review.confidence_score ?? 50)
    );

    // 11. Cache result
    await cacheReview(submissionId, review, aiResult.model);

    return NextResponse.json({
      success: true,
      review,
      model: aiResult.model,
      provider: aiResult.provider,
      textProcessing: method,
      cached: false,
    });
  } catch (err: any) {
    console.error("[review-paper POST]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
