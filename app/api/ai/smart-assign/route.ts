// ============================================================
// Confairo AI Smart Reviewer Assignment — /api/ai/smart-assign
// Suggests best-fit reviewers for a paper based on:
//   - Paper title, abstract/content
//   - Reviewer names, expertise, past assignments
// Uses shared AI provider with fallback chain.
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseServer } from "@/lib/supabase/server";
import {
  callAI,
  safeParseJSON,
  extractTextFromBuffer,
} from "@/lib/ai/provider";
import { checkAICredits, consumeAICredit, getAIUsage } from "@/lib/ai/credits";

// ── Constants ─────────────────────────────────────────────────
const MAX_PAPER_PREVIEW_CHARS = 3_000;
const MAX_REVIEWERS = 50; // cap for prompt size

// ── Types ─────────────────────────────────────────────────────
interface ReviewerCandidate {
  reviewer_id: string;
  score: number;
  reason: string;
}

interface SmartAssignResponse {
  success: boolean;
  reviewers?: ReviewerCandidate[];
  model?: string;
  source?: string;
  fallback?: boolean;
  error?: string;
  message?: string;
  usage?: { used: number; total: number } | null;
}

// ── Build AI Prompt ───────────────────────────────────────────
function buildSmartAssignMessages(
  paper: { title: string; content: string },
  reviewers: { id: string; name: string; expertise: string; pastPapers: string[] }[]
) {
  const reviewerList = reviewers
    .map(
      (r, i) =>
        `${i + 1}. ID: ${r.id}\n   Name: ${r.name}\n   Expertise: ${r.expertise || "Not specified"}\n   Past Reviewed Papers: ${r.pastPapers.length > 0 ? r.pastPapers.join("; ") : "None"}`
    )
    .join("\n\n");

  return [
    {
      role: "system" as const,
      content: `You are an academic conference assistant specializing in reviewer assignment.

Given a research paper and a list of reviewers, match the most suitable reviewers.
Consider:
- Keyword and topic overlap between the paper and reviewer expertise/past papers
- Diversity of perspectives (don't pick identical profiles)
- Workload balance (prefer reviewers with fewer past papers)

Return ONLY valid JSON with this exact structure — no markdown, no explanation:
{
  "recommended_reviewers": [
    {
      "reviewer_id": "exact UUID from the list",
      "score": 0-100,
      "reason": "1-2 sentence explanation of why this reviewer is a good fit"
    }
  ]
}

Rules:
- Return 3-5 reviewers maximum, ranked by score (highest first)
- score must be a number between 0 and 100
- reviewer_id must be an exact UUID from the provided list
- Do NOT invent reviewer IDs
- Respond with ONLY the JSON object`,
    },
    {
      role: "user" as const,
      content: `Match the best reviewers for this paper.

=== PAPER ===
Title: ${paper.title}
Content Preview:
"""
${paper.content}
"""

=== AVAILABLE REVIEWERS ===
${reviewerList}`,
    },
  ];
}

// ── Keyword Score Engine ──────────────────────────────────────
// Returns a Map<reviewer_id, { score, keywords }> for ALL reviewers.
// Used both in hybrid blending and as standalone fallback.
function computeKeywordScores(
  paperText: string,
  reviewers: { id: string; name: string; expertise: string; pastPapers: string[] }[]
): Map<string, { score: number; keywords: string[] }> {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "shall", "can", "this", "that",
    "these", "those", "it", "its", "we", "our", "they", "their", "he",
    "she", "his", "her", "which", "who", "whom", "what", "where", "when",
    "how", "not", "no", "nor", "as", "if", "then", "than", "so", "up",
    "out", "about", "into", "over", "after", "before", "between", "under",
    "above", "below", "each", "every", "all", "both", "few", "more", "most",
    "other", "some", "such", "only", "same", "also", "very", "just", "because",
    "through", "during", "while", "paper", "study", "research", "method",
    "result", "results", "using", "used", "based", "proposed", "approach",
  ]);

  const paperWords = paperText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  const wordFreq = new Map<string, number>();
  for (const w of paperWords) {
    wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
  }

  const topKeywords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([w]) => w);

  const keywordSet = new Set(topKeywords);
  const result = new Map<string, { score: number; keywords: string[] }>();

  for (const r of reviewers) {
    const reviewerText = [r.name, r.expertise, ...r.pastPapers]
      .join(" ")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3);

    let matchCount = 0;
    const matchedKeywords: string[] = [];
    for (const w of reviewerText) {
      if (keywordSet.has(w)) {
        matchCount++;
        if (!matchedKeywords.includes(w)) matchedKeywords.push(w);
      }
    }

    const rawScore = Math.min(100, Math.round((matchCount / Math.max(topKeywords.length, 1)) * 100));
    const workloadPenalty = Math.min(15, r.pastPapers.length * 3);
    const score = Math.max(5, rawScore - workloadPenalty);

    result.set(r.id, { score, keywords: matchedKeywords.slice(0, 5) });
  }

  return result;
}

// ── Heuristic Fallback (keyword-only, used when AI is unavailable) ──
function heuristicMatch(
  paperText: string,
  reviewers: { id: string; name: string; expertise: string; pastPapers: string[] }[]
): ReviewerCandidate[] {
  const kwScores = computeKeywordScores(paperText, reviewers);

  return reviewers
    .map((r) => {
      const kw = kwScores.get(r.id) || { score: 10, keywords: [] };
      return {
        reviewer_id: r.id,
        score: kw.score,
        reason:
          kw.keywords.length > 0
            ? `Keyword overlap: ${kw.keywords.join(", ")}. ${r.pastPapers.length} past assignment(s).`
            : `No strong keyword match found. ${r.pastPapers.length} past assignment(s).`,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// ── Hybrid Blending ───────────────────────────────────────────
// Combines AI reasoning (70%) with keyword overlap (30%) for
// more stable and accurate scoring.
const AI_WEIGHT = 0.7;
const KEYWORD_WEIGHT = 0.3;

function hybridBlend(
  aiCandidates: ReviewerCandidate[],
  kwScores: Map<string, { score: number; keywords: string[] }>
): ReviewerCandidate[] {
  return aiCandidates.map((ai) => {
    const kw = kwScores.get(ai.reviewer_id) || { score: 10, keywords: [] };
    const blendedScore = Math.round(ai.score * AI_WEIGHT + kw.score * KEYWORD_WEIGHT);
    const finalScore = Math.max(0, Math.min(100, blendedScore));

    // Enrich AI reason with keyword context
    const kwContext =
      kw.keywords.length > 0
        ? ` Keywords: ${kw.keywords.join(", ")}.`
        : "";

    return {
      reviewer_id: ai.reviewer_id,
      score: finalScore,
      reason: (ai.reason + kwContext).slice(0, 350),
    };
  });
}

// ── Main POST Handler ─────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse<SmartAssignResponse>> {
  try {
    // 1. Auth
    let userId: string;
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json(
          { success: false, error: "Authentication required" },
          { status: 401 }
        );
      }
      userId = user.id;
    } catch {
      return NextResponse.json(
        { success: false, error: "Authentication failed" },
        { status: 401 }
      );
    }

    // 2. Parse request
    const body = await req.json();
    const { submissionId } = body;

    if (!submissionId) {
      return NextResponse.json(
        { success: false, error: "submissionId is required" },
        { status: 400 }
      );
    }

    // 3. Fetch the paper
    const { data: paper, error: paperErr } = await supabaseServer
      .from("paper_submissions")
      .select("id, title, file_url, conference_id, reviewer_id")
      .eq("id", submissionId)
      .single();

    if (paperErr || !paper) {
      return NextResponse.json(
        { success: false, error: "Submission not found" },
        { status: 404 }
      );
    }

    // 4. Authorization — use organization_members as single source of truth
    //    Only organization members (owner/admin/staff) can assign reviewers

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
        .eq("user_id", userId)
        .eq("organization_id", conference.organization_id)
        .maybeSingle()
      : { data: null };

    const orgRole = membership?.role ?? null;
    const isOwner = orgRole === "owner";
    const isAdmin = orgRole === "admin";
    const isStaff = orgRole === "staff";
    const isOrganizer = isOwner || isAdmin || isStaff;

    console.log("[smart-assign] Permission check:", { userId, orgRole, isOwner, isAdmin, isStaff, isOrganizer });

    if (!isOrganizer) {
      return NextResponse.json(
        { success: false, error: "Access restricted. You don't have access to this action." },
        { status: 403 }
      );
    }

    // 5. AI credit check
    const creditCheck = await checkAICredits(paper.conference_id);
    if (!creditCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: creditCheck.error,
          message: creditCheck.message,
          usage: creditCheck.usage
            ? { used: creditCheck.usage.used_credits, total: creditCheck.usage.total_credits }
            : null,
        },
        { status: 429 }
      );
    }

    // 6. Extract paper content for analysis
    let paperContent = paper.title || "";

    if (paper.file_url) {
      try {
        const fileRes = await fetch(paper.file_url);
        if (fileRes.ok) {
          const fileBuffer = Buffer.from(await fileRes.arrayBuffer());
          const fileName = paper.file_url.split("/").pop() || "paper.pdf";
          const rawText = await extractTextFromBuffer(fileBuffer, fileName);
          // Take the first N chars as a preview for the prompt
          paperContent = `${paper.title || "Untitled"}\n\n${rawText.slice(0, MAX_PAPER_PREVIEW_CHARS)}`;
        }
      } catch (err) {
        console.warn("[smart-assign] Failed to extract paper text, using title only:", err);
        paperContent = paper.title || "Untitled paper";
      }
    }

    // 7. Fetch all reviewers for this conference
    const { data: staffReviewers } = await supabaseServer
      .from("conference_staff")
      .select("user_id")
      .eq("conference_id", paper.conference_id)
      .eq("role", "reviewer");

    if (!staffReviewers || staffReviewers.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No reviewers available for this conference. Invite reviewers first.",
      });
    }

    const reviewerUserIds = staffReviewers
      .map((s) => s.user_id)
      .slice(0, MAX_REVIEWERS);

    // Fetch reviewer profiles
    const { data: reviewerProfiles } = await supabaseServer
      .from("profiles")
      .select("id, name, email")
      .in("id", reviewerUserIds);

    if (!reviewerProfiles || reviewerProfiles.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Could not load reviewer profiles.",
      });
    }

    // 8. Fetch past assignments for each reviewer (for expertise inference)
    const { data: pastAssignments } = await supabaseServer
      .from("paper_submissions")
      .select("reviewer_id, title")
      .in("reviewer_id", reviewerUserIds)
      .eq("conference_id", paper.conference_id);

    // Build past papers map
    const pastPapersMap = new Map<string, string[]>();
    pastAssignments?.forEach((a) => {
      if (!a.reviewer_id) return;
      const list = pastPapersMap.get(a.reviewer_id) || [];
      if (a.title) list.push(a.title);
      pastPapersMap.set(a.reviewer_id, list);
    });

    // Build reviewer data for AI
    const reviewerData = reviewerProfiles.map((r) => ({
      id: r.id,
      name: r.name || r.email || "Unknown",
      expertise: "", // No explicit expertise column yet — AI infers from past papers
      pastPapers: pastPapersMap.get(r.id) || [],
    }));

    // 9. Compute keyword scores for ALL reviewers (always runs)
    const kwScores = computeKeywordScores(paperContent, reviewerData);

    // 10. Call AI
    const messages = buildSmartAssignMessages(
      { title: paper.title || "Untitled", content: paperContent },
      reviewerData
    );

    const aiResult = await callAI({
      messages,
      maxTokens: 1000,
      preferProvider: "auto",
      textLength: paperContent.length,
      dedupKey: `smart-assign:${submissionId}`,
    });

    // 11. Parse + hybrid blend, or use heuristic fallback
    let recommended: ReviewerCandidate[] = [];
    let model: string;
    let source: string;
    let isFallback = false;

    if (aiResult) {
      const parsed = safeParseJSON(aiResult.text);
      if (parsed?.recommended_reviewers && Array.isArray(parsed.recommended_reviewers)) {
        // Validate each entry — only keep reviewers that actually exist
        const validIds = new Set(reviewerUserIds);
        const validAICandidates: ReviewerCandidate[] = parsed.recommended_reviewers
          .filter(
            (r: any) =>
              r.reviewer_id &&
              validIds.has(r.reviewer_id) &&
              typeof r.score === "number"
          )
          .map((r: any) => ({
            reviewer_id: r.reviewer_id,
            score: Math.max(0, Math.min(100, Math.round(r.score))),
            reason: String(r.reason || "").slice(0, 300),
          }));

        if (validAICandidates.length > 0) {
          // Hybrid blend: 70% AI + 30% keyword overlap
          recommended = hybridBlend(validAICandidates, kwScores)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

          model = aiResult.model;
          source = aiResult.provider;
        } else {
          // AI returned reviewers but none were valid
          console.warn("[smart-assign] No valid AI candidates, using heuristic");
          recommended = heuristicMatch(paperContent, reviewerData);
          model = "heuristic";
          source = "fallback";
          isFallback = true;
        }
      } else {
        // AI returned something but not valid structure
        console.warn("[smart-assign] AI response not parseable, using heuristic");
        recommended = heuristicMatch(paperContent, reviewerData);
        model = "heuristic";
        source = "fallback";
        isFallback = true;
      }
    } else {
      // All providers failed
      recommended = heuristicMatch(paperContent, reviewerData);
      model = "heuristic";
      source = "fallback";
      isFallback = true;
    }

    // If hybrid returned empty, also fallback
    if (recommended.length === 0) {
      recommended = heuristicMatch(paperContent, reviewerData);
      model = "heuristic";
      source = "fallback";
      isFallback = true;
    }

    // Enrich with reviewer names for display
    const profileMap = new Map<string, { id: string; name: string; email: string }>(reviewerProfiles.map((p) => [p.id, p]));
    const enriched = recommended.map((r) => {
      const profile = profileMap.get(r.reviewer_id);
      return {
        ...r,
        reviewer_name: profile?.name || profile?.email || "Unknown",
        reviewer_email: profile?.email || "",
        current_workload: (pastPapersMap.get(r.reviewer_id) || []).length,
      };
    });

    // 11. Consume 1 credit
    if (paper.conference_id) {
      await consumeAICredit(paper.conference_id);
    }

    // 12. Fetch fresh usage
    const freshUsage = paper.conference_id
      ? await getAIUsage(paper.conference_id)
      : null;

    return NextResponse.json({
      success: true,
      reviewers: enriched,
      model,
      source,
      fallback: isFallback,
      message: isFallback
        ? "AI temporarily unavailable. Showing keyword-based suggestions."
        : undefined,
      usage: freshUsage
        ? { used: freshUsage.used_credits, total: freshUsage.total_credits }
        : null,
    });
  } catch (err: any) {
    console.error("[smart-assign POST]", err);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      },
      { status: 200 }
    );
  }
}
