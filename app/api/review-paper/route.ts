// ============================================================
// AcadFlow AI Paper Reviewer — /api/review-paper
// ZERO-FAILURE: Always returns a usable result.
// Flow: cooldown → cache → AI (race/retry) → heuristic
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseServer } from "@/lib/supabase/server";
import {
  callAI,
  extractTextFromBuffer,
  processTextForAI,
  safeParseJSON,
  checkCooldown,
  recordRequest,
  getReviewHeuristicFallback,
} from "@/lib/ai/provider";
import { checkAICredits, consumeAICredit, getAIUsage } from "@/lib/ai/credits";

// ── Constants ─────────────────────────────────────────────────
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const CACHE_TTL_MS = 48 * 60 * 60 * 1000;          // 48h for AI results
const FALLBACK_CACHE_TTL_MS = 30 * 60 * 1000;       // 30min for fallback results

// ── Normalize AI Decision ─────────────────────────────────────
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

    if (!data) return null;

    // TTL check — use shorter TTL for fallback results
    const age = Date.now() - new Date(data.created_at).getTime();
    const isFallback = data.model_used === "heuristic";
    const ttl = isFallback ? FALLBACK_CACHE_TTL_MS : CACHE_TTL_MS;

    if (age > ttl) return null;

    return data;
  } catch {
    return null;
  }
}

async function cacheReview(submissionId: string, reviewData: Record<string, any>, model: string) {
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
    console.warn("Failed to cache AI review:", err);
  }
}

// ── Normalize review output (standardize across all sources) ──
function normalizeReview(raw: Record<string, any>): Record<string, any> {
  return {
    summary: raw.summary || "",
    key_contributions: Array.isArray(raw.key_contributions) ? raw.key_contributions : [],
    strengths: Array.isArray(raw.strengths) ? raw.strengths : [],
    weaknesses: Array.isArray(raw.weaknesses) ? raw.weaknesses : [],
    grammar_issues: Array.isArray(raw.grammar_issues) ? raw.grammar_issues : [],
    final_decision: normalizeDecision(raw.final_decision || ""),
    confidence_score: Math.max(0, Math.min(100, Number(raw.confidence_score) || 0)),
  };
}

// ── Main POST Handler ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // 1. Auth — only get userId, do NOT use profiles.role for permission
    let userId: string | null = null;
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      userId = user.id;
    } catch {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    // 2. Parse request
    const body = await req.json();
    const { submissionId, forceRegenerate } = body;
    if (!submissionId) return NextResponse.json({ error: "submissionId is required" }, { status: 400 });

    // 3. Server-side cooldown (skip for cache-only requests)
    if (forceRegenerate && userId) {
      const cd = checkCooldown(userId, `review:${submissionId}`);
      if (cd.blocked) {
        return NextResponse.json({
          success: false,
          cooldown: true,
          waitSeconds: Math.ceil(cd.waitMs / 1000),
          message: `Please wait ${Math.ceil(cd.waitMs / 1000)} seconds before re-analyzing.`,
        });
      }
    }

    // 4. Fetch conference_id early (needed for usage in all responses)
    const { data: submission } = await supabaseServer
      .from("paper_submissions")
      .select("conference_id")
      .eq("id", submissionId)
      .single();
    const conferenceId = submission?.conference_id;

    // 4b. Cache check (unless force regenerate)
    if (!forceRegenerate) {
      const cached = await getCachedReview(submissionId);
      if (cached) {
        const usage = conferenceId ? await getAIUsage(conferenceId) : null;
        return NextResponse.json({
          success: true,
          review: cached.review_data,
          model: cached.model_used,
          source: cached.model_used === "heuristic" ? "fallback" : "cache",
          cached: true,
          cachedAt: cached.created_at,
          fallback: cached.model_used === "heuristic",
          usage: usage ? { used: usage.used_credits, total: usage.total_credits } : null,
        });
      }
    }

    // 5. Fetch paper
    const { data: paper, error: paperErr } = await supabaseServer
      .from("paper_submissions")
      .select("id, file_url, title, reviewer_id, conference_id")
      .eq("id", submissionId)
      .single();

    if (paperErr || !paper) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    // 5b. AI credit check — block BEFORE downloading/processing the file
    const creditCheck = await checkAICredits(paper.conference_id);
    if (!creditCheck.allowed) {
      return NextResponse.json({
        success: false,
        error: creditCheck.error,
        message: creditCheck.message,
        usage: creditCheck.usage
          ? { used: creditCheck.usage.used_credits, total: creditCheck.usage.total_credits }
          : null,
      }, { status: 429 });
    }

    // 5c. Permission — use organization_members as single source of truth
    const isAssignedReviewer = paper.reviewer_id === userId;

    // Fetch conference → organization_id
    const { data: conference } = await supabaseServer
      .from("conferences")
      .select("organization_id")
      .eq("id", paper.conference_id)
      .single();

    // Fetch organization membership for this user
    const { data: membership } = conference?.organization_id
      ? await supabaseServer
          .from("organization_members")
          .select("role")
          .eq("user_id", userId!)
          .eq("organization_id", conference.organization_id)
          .maybeSingle()
      : { data: null };

    const orgRole = membership?.role ?? null;
    const isOwner = orgRole === "owner";
    const isAdmin = orgRole === "admin";
    const isStaff = orgRole === "staff";
    const isOrganizer = isOwner || isAdmin || isStaff;

    console.log("[review-paper] Permission check:", { userId, orgRole, isOwner, isAdmin, isStaff, isOrganizer, isAssignedReviewer });

    if (!isOrganizer && !isAssignedReviewer) {
      return NextResponse.json({ error: "Access restricted. You don't have access to this action." }, { status: 403 });
    }

    if (!paper.file_url) return NextResponse.json({ error: "No paper file uploaded" }, { status: 400 });

    // 6. Download + extract
    const fileRes = await fetch(paper.file_url);
    if (!fileRes.ok) return NextResponse.json({ error: "Failed to download paper file" }, { status: 500 });

    const fileBuffer = Buffer.from(await fileRes.arrayBuffer());
    if (fileBuffer.length > MAX_FILE_SIZE) return NextResponse.json({ error: "File exceeds 10MB" }, { status: 400 });

    const fileName = paper.file_url.split("/").pop() || "paper.pdf";
    let rawText: string;
    try {
      rawText = await extractTextFromBuffer(fileBuffer, fileName);
    } catch (err: any) {
      return NextResponse.json({ error: err.message || "Failed to extract text" }, { status: 400 });
    }

    if (!rawText || rawText.trim().length < 100) {
      return NextResponse.json({ error: "Insufficient text. File may be image-based or corrupted." }, { status: 400 });
    }

    // 7. Process text
    const { processed, method } = await processTextForAI(rawText);

    // 8. Record cooldown BEFORE calling AI
    if (userId) recordRequest(userId, `review:${submissionId}`);

    // 9. Call AI (NEVER throws — returns null on total failure)
    const messages = buildReviewMessages(processed);
    const aiResult = await callAI({
      messages,
      maxTokens: 1500,
      preferProvider: "auto",
      textLength: processed.length,
      dedupKey: `review:${submissionId}`,
    });

    // 10. Parse result or use heuristic
    let review: Record<string, any>;
    let model: string;
    let source: string;
    let isFallback = false;

    if (aiResult) {
      const parsed = safeParseJSON(aiResult.text);
      if (parsed) {
        review = normalizeReview(parsed);
        model = aiResult.model;
        source = aiResult.provider;
      } else {
        // AI returned something but it wasn't parseable JSON
        review = normalizeReview(getReviewHeuristicFallback(rawText));
        model = "heuristic";
        source = "fallback";
        isFallback = true;
      }
    } else {
      // All providers failed
      review = normalizeReview(getReviewHeuristicFallback(rawText));
      model = "heuristic";
      source = "fallback";
      isFallback = true;
    }

    // 11. Cache result
    await cacheReview(submissionId, review, model);

    // 12. Consume 1 credit for any successful analysis (AI or fallback)
    if (paper.conference_id) {
      await consumeAICredit(paper.conference_id);
    }

    // 13. Fetch fresh usage after consumption
    const freshUsage = paper.conference_id ? await getAIUsage(paper.conference_id) : null;

    return NextResponse.json({
      success: true,
      review,
      model,
      source,
      provider: source === "fallback" ? null : source,
      textProcessing: method,
      cached: false,
      fallback: isFallback,
      message: isFallback
        ? "AI temporarily unavailable. Showing basic analysis."
        : undefined,
      usage: freshUsage ? { used: freshUsage.used_credits, total: freshUsage.total_credits } : null,
    });
  } catch (err: any) {
    console.error("[review-paper POST]", err);
    // Even unexpected errors return a 200 with error info (not 500)
    return NextResponse.json({
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }, { status: 200 });
  }
}
