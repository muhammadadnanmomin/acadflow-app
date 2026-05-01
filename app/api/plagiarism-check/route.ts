// ============================================================
// AcadFlow AI Plagiarism Risk Detector — /api/plagiarism-check
// POST: Analyze a submission's paper for similarity patterns
// Uses: Shared AI provider (Groq → Gemini fallback)
// Features: hybrid scoring (structural + LLM), caching,
//           chunking with overlap, model versioning
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseServer } from "@/lib/supabase/server";
import {
  callAI,
  extractTextFromBuffer,
  safeParseJSON,
  chunkTextWithOverlap,
} from "@/lib/ai/provider";

// ── Constants ─────────────────────────────────────────────────
const MODEL_VERSION = "plagiarism-v2.0"; // bump when prompt/model changes
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_SUSPICIOUS_SECTIONS = 5;
const MAX_TEXT_CHARS = 200_000;

// ── Hybrid scoring weights ────────────────────────────────────
const STRUCTURAL_WEIGHT = 0.5;
const LLM_WEIGHT = 0.5;

// ══════════════════════════════════════════════════════════════
// STRUCTURAL SIMILARITY ANALYSIS
// Local n-gram fingerprinting + repetition + vocabulary
// diversity — runs entirely locally, no API needed
// ══════════════════════════════════════════════════════════════

function generateNgrams(text: string, n: number): Map<string, number> {
  const words = text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean);
  const ngrams = new Map<string, number>();

  for (let i = 0; i <= words.length - n; i++) {
    const gram = words.slice(i, i + n).join(" ");
    ngrams.set(gram, (ngrams.get(gram) || 0) + 1);
  }

  return ngrams;
}

function computeCosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const [key, valA] of a) {
    normA += valA * valA;
    const valB = b.get(key) || 0;
    dotProduct += valA * valB;
  }

  for (const [, valB] of b) {
    normB += valB * valB;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

interface StructuralAnalysis {
  score: number;
  repetitionRatio: number;
  vocabularyDiversity: number;
  avgChunkSimilarity: number;
  templatePhraseCount: number;
}

function analyzeStructural(text: string, chunks: string[]): StructuralAnalysis {
  // 1. Repetition ratio — how many n-grams appear more than twice
  const trigrams = generateNgrams(text, 3);
  let repeatedCount = 0;
  let totalCount = 0;
  for (const [, count] of trigrams) {
    totalCount++;
    if (count > 2) repeatedCount++;
  }
  const repetitionRatio = totalCount > 0 ? repeatedCount / totalCount : 0;

  // 2. Vocabulary diversity (type-token ratio)
  const words = text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words);
  const expectedTTR = Math.min(1, 0.05 + 0.95 / Math.sqrt(words.length / 100));
  const rawTTR = words.length > 0 ? uniqueWords.size / words.length : 1;
  const vocabularyDiversity = Math.min(1, rawTTR / expectedTTR);

  // 3. Average inter-chunk cosine similarity (high = repetitive)
  let totalSim = 0;
  let comparisons = 0;
  if (chunks.length >= 2) {
    const chunkNgrams = chunks.map((c) => generateNgrams(c, 3));
    for (let i = 0; i < chunkNgrams.length; i++) {
      for (let j = i + 1; j < chunkNgrams.length; j++) {
        totalSim += computeCosineSimilarity(chunkNgrams[i], chunkNgrams[j]);
        comparisons++;
      }
    }
  }
  const avgChunkSimilarity = comparisons > 0 ? totalSim / comparisons : 0;

  // 4. Template/generic phrase detection
  const templatePhrases = [
    "it is worth noting", "it should be noted", "in this paper we",
    "the results show that", "in conclusion", "as mentioned above",
    "as shown in", "it can be seen", "on the other hand", "in order to",
    "it is important to note", "the purpose of this study",
    "the aim of this paper", "further research is needed",
    "the findings suggest", "based on the above", "as a result",
    "in the present study", "to the best of our knowledge",
    "plays an important role", "it is evident that", "in light of",
    "it has been shown", "according to the results",
  ];

  const lowerText = text.toLowerCase();
  let templatePhraseCount = 0;
  for (const phrase of templatePhrases) {
    const regex = new RegExp(phrase.replace(/\s+/g, "\\s+"), "gi");
    const matches = lowerText.match(regex);
    if (matches) templatePhraseCount += matches.length;
  }

  const templateDensity = words.length > 0 ? (templatePhraseCount / words.length) * 1000 : 0;

  // Compute structural score (0-100)
  const repScore = Math.min(100, repetitionRatio * 400);
  const vocScore = Math.max(0, (1 - vocabularyDiversity) * 100);
  const simScore = Math.min(100, avgChunkSimilarity * 200);
  const tmpScore = Math.min(100, templateDensity * 8);

  const score = Math.round(
    repScore * 0.25 + vocScore * 0.25 + simScore * 0.25 + tmpScore * 0.25
  );

  return {
    score: Math.max(0, Math.min(100, score)),
    repetitionRatio: Math.round(repetitionRatio * 100) / 100,
    vocabularyDiversity: Math.round(vocabularyDiversity * 100) / 100,
    avgChunkSimilarity: Math.round(avgChunkSimilarity * 100) / 100,
    templatePhraseCount,
  };
}

// ── Prepare text for LLM analysis ─────────────────────────────
function prepareTextForLLM(text: string): string {
  const cleaned = text.slice(0, MAX_TEXT_CHARS);
  if (cleaned.length <= 30_000) return cleaned;

  const headLen = 12_000;
  const tailLen = 8_000;
  const midLen = 10_000;

  const head = cleaned.slice(0, headLen);
  const tail = cleaned.slice(-tailLen);
  const midStart = Math.floor((cleaned.length - midLen) / 2);
  const mid = cleaned.slice(midStart, midStart + midLen);

  return [
    head,
    "\n\n[--- MIDDLE SECTION EXCERPT ---]\n\n",
    mid,
    "\n\n[--- CONCLUSION SECTION ---]\n\n",
    tail,
  ].join("");
}

// ── Risk level helpers ────────────────────────────────────────
function computeRiskLevel(score: number): string {
  if (score < 30) return "Low";
  if (score < 70) return "Medium";
  return "High";
}

function getActionableMessage(level: string): string {
  if (level === "Low") {
    return "✅ Low Risk — The paper shows minimal similarity patterns. Standard originality indicators are within expected ranges.";
  }
  if (level === "Medium") {
    return "⚠️ Medium Risk — Some similarity patterns detected. Review the highlighted sections carefully before making a decision.";
  }
  return "🚨 High Risk — Significant similarity patterns detected. Thorough manual review is strongly recommended before acceptance.";
}

// ── Cache helpers ─────────────────────────────────────────────
async function getCachedResult(submissionId: string) {
  try {
    const { data } = await supabaseServer
      .from("ai_plagiarism_checks")
      .select("result_data, model_used, model_version, created_at")
      .eq("submission_id", submissionId)
      .single();

    if (data && data.model_version !== MODEL_VERSION) {
      return null; // Invalidate stale cache
    }

    return data;
  } catch {
    return null;
  }
}

async function cacheResult(
  submissionId: string,
  resultData: Record<string, any>,
  model: string
) {
  try {
    await supabaseServer.from("ai_plagiarism_checks").upsert(
      {
        submission_id: submissionId,
        result_data: resultData,
        model_used: model,
        model_version: MODEL_VERSION,
        created_at: new Date().toISOString(),
      },
      { onConflict: "submission_id" }
    );
  } catch (err) {
    console.warn("Failed to cache plagiarism result (table may not exist):", err);
  }
}

// ── Main POST Handler ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    let userId: string | null = null;
    let userRole = "guest";
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

    // 3. Check cache
    if (!forceRegenerate) {
      const cached = await getCachedResult(submissionId);
      if (cached) {
        return NextResponse.json({
          success: true,
          result: cached.result_data,
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

    // 5. Authorization
    const isOrganizerOrAdmin = ["organizer", "admin"].includes(userRole);
    const isAssignedReviewer = userRole === "reviewer" && paper.reviewer_id === userId;

    if (!isOrganizerOrAdmin && !isAssignedReviewer) {
      return NextResponse.json(
        { error: "You do not have permission to analyze this paper" },
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
            "Could not extract sufficient text. The file may be image-based or corrupted.",
        },
        { status: 400 }
      );
    }

    const cleanedText = rawText.slice(0, MAX_TEXT_CHARS);

    // 8. Chunk text with overlap for structural analysis
    const chunks = chunkTextWithOverlap(cleanedText, 1800, 200);

    // 9. Structural similarity analysis (local, no API)
    const structural = analyzeStructural(cleanedText, chunks);

    // 10. LLM analysis via hybrid provider
    const llmText = prepareTextForLLM(cleanedText);

    const plagiarismPrompt = `You are an academic integrity assistant specialized in detecting similarity patterns in research papers. Your role is to identify:
- Repetitive phrasing or sentence structures
- Generic or template-like academic writing
- Sections that appear AI-generated or heavily paraphrased
- Unusually uniform writing style that may indicate content reuse

IMPORTANT: You are NOT a plagiarism detector. You identify SIMILARITY PATTERNS and RISK indicators.
Use language like "similarity patterns", "possible reuse", "generic phrasing", "template-like content".
NEVER say "plagiarism detected" or "copied from".

Analyze the following research paper for similarity risk patterns. The structural analysis has already computed a preliminary score of ${structural.score}/100.

Respond ONLY in valid JSON with this exact structure:

{
  "risk_score": <number 0-100>,
  "risk_level": "<Low | Medium | High>",
  "suspicious_sections": [
    {
      "text": "<exact excerpt from the paper, max 150 chars>",
      "reason": "<brief explanation of why this section is flagged>"
    }
  ],
  "insights": "<2-3 sentence explanation of overall similarity patterns found>",
  "writing_quality": "<brief assessment of writing originality vs. template-like nature>"
}

Rules:
- risk_score must be a number between 0 and 100
- risk_level: 0-30 = "Low", 31-70 = "Medium", 71-100 = "High"
- Include at most ${MAX_SUSPICIOUS_SECTIONS} suspicious_sections, ranked by importance
- Each suspicious section text should be an EXACT excerpt from the paper
- Focus on the most meaningful patterns, not trivial matches
- Consider the structural score of ${structural.score} as a data point but form your own assessment
- Do NOT wrap in markdown code blocks
- Respond with ONLY the JSON object

Paper:
"""
${llmText}
"""`;

    let rawResponse: string;
    let modelUsed: string;
    let providerUsed: string;

    try {
      const aiResult = await callAI({
        prompt: plagiarismPrompt,
        maxTokens: 2000,
        preferProvider: "auto",
        textLength: llmText.length,
      });
      rawResponse = aiResult.text;
      modelUsed = aiResult.model;
      providerUsed = aiResult.provider;
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || "AI analysis temporarily unavailable. Please try again." },
        { status: 500 }
      );
    }

    // 11. Parse JSON safely — with retry
    let llmResult = safeParseJSON(rawResponse);

    if (!llmResult) {
      try {
        const retryResult = await callAI({
          prompt: `Your previous response was not valid JSON. Please respond with ONLY a valid JSON object matching the schema I specified. No markdown, no explanation. Here was your response:\n\n${rawResponse.slice(0, 1000)}`,
          maxTokens: 2000,
          preferProvider: providerUsed as "groq" | "gemini",
        });
        llmResult = safeParseJSON(retryResult.text);
      } catch {
        /* fall through */
      }
    }

    if (!llmResult) {
      return NextResponse.json(
        {
          error:
            "Failed to parse AI response. Please try again.",
        },
        { status: 500 }
      );
    }

    // 12. Hybrid risk scoring (50% structural + 50% LLM)
    const llmScore = Math.max(0, Math.min(100, Number(llmResult.risk_score) || 50));
    const hybridScore = Math.round(
      structural.score * STRUCTURAL_WEIGHT + llmScore * LLM_WEIGHT
    );
    const finalScore = Math.max(0, Math.min(100, hybridScore));
    const riskLevel = computeRiskLevel(finalScore);

    // 13. Limit suspicious sections
    let suspiciousSections = Array.isArray(llmResult.suspicious_sections)
      ? llmResult.suspicious_sections.slice(0, MAX_SUSPICIOUS_SECTIONS)
      : [];

    suspiciousSections = suspiciousSections.filter(
      (s: any) => s.text && s.text.length > 20 && s.reason && s.reason.length > 10
    );

    // 14. Build final result
    const resultData = {
      risk_score: finalScore,
      risk_level: riskLevel,
      actionable_message: getActionableMessage(riskLevel),
      suspicious_sections: suspiciousSections,
      insights: llmResult.insights || "No specific patterns identified.",
      writing_quality: llmResult.writing_quality || "",
      structural_analysis: {
        score: structural.score,
        repetition_ratio: structural.repetitionRatio,
        vocabulary_diversity: structural.vocabularyDiversity,
        avg_chunk_similarity: structural.avgChunkSimilarity,
        template_phrase_count: structural.templatePhraseCount,
      },
      llm_score: llmScore,
    };

    // 15. Cache result
    await cacheResult(submissionId, resultData, modelUsed);

    return NextResponse.json({
      success: true,
      result: resultData,
      model: modelUsed,
      provider: providerUsed,
      modelVersion: MODEL_VERSION,
      cached: false,
    });
  } catch (err: any) {
    console.error("[plagiarism-check POST]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
