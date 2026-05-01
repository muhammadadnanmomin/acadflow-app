// ============================================================
// AcadFlow AI Plagiarism Risk Detector — /api/plagiarism-check
// ZERO-FAILURE: Always returns a usable result.
// Flow: cooldown → cache → structural + AI → heuristic
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseServer } from "@/lib/supabase/server";
import {
  callAI,
  extractTextFromBuffer,
  safeParseJSON,
  chunkTextWithOverlap,
  checkCooldown,
  recordRequest,
  getPlagiarismHeuristicFallback,
} from "@/lib/ai/provider";

// ── Constants ─────────────────────────────────────────────────
const MODEL_VERSION = "plagiarism-v3.0";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_SUSPICIOUS_SECTIONS = 5;
const MAX_TEXT_CHARS = 200_000;
const STRUCTURAL_WEIGHT = 0.5;
const LLM_WEIGHT = 0.5;
const CACHE_TTL_MS = 48 * 60 * 60 * 1000;
const FALLBACK_CACHE_TTL_MS = 10 * 60 * 1000; // 10min for fallback

// ══════════════════════════════════════════════════════════════
// STRUCTURAL SIMILARITY ANALYSIS (runs 100% locally)
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
  let dot = 0, nA = 0, nB = 0;
  for (const [key, valA] of a) { nA += valA * valA; dot += valA * (b.get(key) || 0); }
  for (const [, valB] of b) { nB += valB * valB; }
  const denom = Math.sqrt(nA) * Math.sqrt(nB);
  return denom === 0 ? 0 : dot / denom;
}

interface StructuralAnalysis {
  score: number;
  repetition_ratio: number;
  vocabulary_diversity: number;
  avg_chunk_similarity: number;
  template_phrase_count: number;
}

function analyzeStructural(text: string, chunks: string[]): StructuralAnalysis {
  // Repetition ratio
  const trigrams = generateNgrams(text, 3);
  let repeated = 0, total = 0;
  for (const [, count] of trigrams) { total++; if (count > 2) repeated++; }
  const repetitionRatio = total > 0 ? repeated / total : 0;

  // Vocabulary diversity
  const words = text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean);
  const unique = new Set(words);
  const expectedTTR = Math.min(1, 0.05 + 0.95 / Math.sqrt(words.length / 100));
  const rawTTR = words.length > 0 ? unique.size / words.length : 1;
  const vocabDiv = Math.min(1, rawTTR / expectedTTR);

  // Inter-chunk cosine similarity
  let totalSim = 0, comparisons = 0;
  if (chunks.length >= 2) {
    const chunkNgrams = chunks.map((c) => generateNgrams(c, 3));
    for (let i = 0; i < chunkNgrams.length; i++)
      for (let j = i + 1; j < chunkNgrams.length; j++) {
        totalSim += computeCosineSimilarity(chunkNgrams[i], chunkNgrams[j]);
        comparisons++;
      }
  }
  const avgChunkSim = comparisons > 0 ? totalSim / comparisons : 0;

  // Template phrase detection
  const templates = [
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
  const lower = text.toLowerCase();
  let templateCount = 0;
  for (const p of templates) {
    const m = lower.match(new RegExp(p.replace(/\s+/g, "\\s+"), "gi"));
    if (m) templateCount += m.length;
  }
  const templateDensity = words.length > 0 ? (templateCount / words.length) * 1000 : 0;

  // Deterministic score formula
  const repScore = Math.min(100, repetitionRatio * 400);
  const vocScore = Math.max(0, (1 - vocabDiv) * 100);
  const simScore = Math.min(100, avgChunkSim * 200);
  const tmpScore = Math.min(100, templateDensity * 8);
  const score = Math.round(repScore * 0.25 + vocScore * 0.25 + simScore * 0.25 + tmpScore * 0.25);

  return {
    score: Math.max(0, Math.min(100, score)),
    repetition_ratio: Math.round(repetitionRatio * 100) / 100,
    vocabulary_diversity: Math.round(vocabDiv * 100) / 100,
    avg_chunk_similarity: Math.round(avgChunkSim * 100) / 100,
    template_phrase_count: templateCount,
  };
}

// ── Prepare text for LLM ──────────────────────────────────────
function prepareTextForLLM(text: string): string {
  const cleaned = text.slice(0, MAX_TEXT_CHARS);
  if (cleaned.length <= 30_000) return cleaned;
  const head = cleaned.slice(0, 12_000);
  const mid = cleaned.slice(Math.floor((cleaned.length - 10_000) / 2), Math.floor((cleaned.length - 10_000) / 2) + 10_000);
  const tail = cleaned.slice(-8_000);
  return [head, "\n\n[--- MIDDLE ---]\n\n", mid, "\n\n[--- CONCLUSION ---]\n\n", tail].join("");
}

// ── Risk helpers ──────────────────────────────────────────────
function computeRiskLevel(score: number): string {
  if (score < 30) return "Low";
  if (score < 70) return "Medium";
  return "High";
}

function getActionableMessage(level: string): string {
  if (level === "Low") return "✅ Low Risk — Minimal similarity patterns detected.";
  if (level === "Medium") return "⚠️ Medium Risk — Review highlighted sections carefully.";
  return "🚨 High Risk — Thorough manual review strongly recommended.";
}

// ── Cache helpers ─────────────────────────────────────────────
async function getCachedResult(submissionId: string) {
  try {
    const { data } = await supabaseServer
      .from("ai_plagiarism_checks")
      .select("result_data, model_used, model_version, created_at")
      .eq("submission_id", submissionId)
      .single();

    if (!data) return null;
    if (data.model_version !== MODEL_VERSION) return null;

    const age = Date.now() - new Date(data.created_at).getTime();
    const isFallback = data.model_used === "structural-only";
    if (age > (isFallback ? FALLBACK_CACHE_TTL_MS : CACHE_TTL_MS)) return null;

    return data;
  } catch { return null; }
}

async function cacheResult(submissionId: string, resultData: Record<string, any>, model: string) {
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
  } catch (err) { console.warn("Failed to cache plagiarism result:", err); }
}

// ── Main POST Handler ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    let userId: string | null = null;
    let userRole = "guest";
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      userId = user.id;
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      userRole = profile?.role ?? "guest";
    } catch {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    // 2. Parse
    const body = await req.json();
    const { submissionId, forceRegenerate } = body;
    if (!submissionId) return NextResponse.json({ error: "submissionId is required" }, { status: 400 });

    // 3. Server-side cooldown
    if (forceRegenerate && userId) {
      const cd = checkCooldown(userId, `plagiarism:${submissionId}`);
      if (cd.blocked) {
        return NextResponse.json({
          success: false,
          cooldown: true,
          waitSeconds: Math.ceil(cd.waitMs / 1000),
          message: `Please wait ${Math.ceil(cd.waitMs / 1000)} seconds before re-analyzing.`,
        });
      }
    }

    // 4. Cache check
    if (!forceRegenerate) {
      const cached = await getCachedResult(submissionId);
      if (cached) {
        return NextResponse.json({
          success: true,
          result: cached.result_data,
          model: cached.model_used,
          source: cached.model_used === "structural-only" ? "fallback" : "cache",
          cached: true,
          cachedAt: cached.created_at,
          fallback: cached.model_used === "structural-only",
        });
      }
    }

    // 5. Fetch paper + auth
    const { data: paper, error: paperErr } = await supabaseServer
      .from("paper_submissions")
      .select("id, file_url, title, reviewer_id")
      .eq("id", submissionId)
      .single();

    if (paperErr || !paper) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    const isOrgAdmin = ["organizer", "admin"].includes(userRole);
    const isAssigned = userRole === "reviewer" && paper.reviewer_id === userId;
    if (!isOrgAdmin && !isAssigned) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }
    if (!paper.file_url) return NextResponse.json({ error: "No paper file uploaded" }, { status: 400 });

    // 6. Download + extract
    const fileRes = await fetch(paper.file_url);
    if (!fileRes.ok) return NextResponse.json({ error: "Failed to download paper" }, { status: 500 });

    const fileBuffer = Buffer.from(await fileRes.arrayBuffer());
    if (fileBuffer.length > MAX_FILE_SIZE) return NextResponse.json({ error: "File exceeds 10MB" }, { status: 400 });

    const fileName = paper.file_url.split("/").pop() || "paper.pdf";
    let rawText: string;
    try { rawText = await extractTextFromBuffer(fileBuffer, fileName); }
    catch (err: any) { return NextResponse.json({ error: err.message || "Text extraction failed" }, { status: 400 }); }

    if (!rawText || rawText.trim().length < 100) {
      return NextResponse.json({ error: "Insufficient text extracted" }, { status: 400 });
    }

    const cleanedText = rawText.slice(0, MAX_TEXT_CHARS);

    // 7. Structural analysis (always runs — 100% local)
    const chunks = chunkTextWithOverlap(cleanedText, 1800, 200);
    const structural = analyzeStructural(cleanedText, chunks);

    // 8. Record cooldown
    if (userId) recordRequest(userId, `plagiarism:${submissionId}`);

    // 9. LLM analysis (NEVER throws — returns null on failure)
    const llmText = prepareTextForLLM(cleanedText);
    const plagiarismPrompt = `You are an academic integrity assistant. Identify similarity patterns in research papers:
- Repetitive phrasing or sentence structures
- Generic or template-like academic writing  
- AI-generated or heavily paraphrased sections
- Unusually uniform writing style

You are NOT a plagiarism detector. Use "similarity patterns", "possible reuse", "generic phrasing".
NEVER say "plagiarism detected" or "copied from".

Structural analysis preliminary score: ${structural.score}/100.

Respond ONLY in valid JSON:
{
  "risk_score": <0-100>,
  "risk_level": "<Low | Medium | High>",
  "suspicious_sections": [{ "text": "<excerpt max 150 chars>", "reason": "<why flagged>" }],
  "insights": "<2-3 sentences on patterns found>",
  "writing_quality": "<originality assessment>"
}

Max ${MAX_SUSPICIOUS_SECTIONS} suspicious_sections. ONLY the JSON object.

Paper:
"""
${llmText}
"""`;

    const aiResult = await callAI({
      prompt: plagiarismPrompt,
      maxTokens: 2000,
      preferProvider: "auto",
      textLength: llmText.length,
      dedupKey: `plagiarism:${submissionId}`,
    });

    // 10. Build result — AI or heuristic fallback
    let resultData: Record<string, any>;
    let modelUsed: string;
    let source: string;
    let isFallback = false;

    if (aiResult) {
      const llmResult = safeParseJSON(aiResult.text);

      if (llmResult) {
        // Hybrid score (50% structural + 50% LLM)
        const llmScore = Math.max(0, Math.min(100, Number(llmResult.risk_score) || 50));
        const hybridScore = Math.round(structural.score * STRUCTURAL_WEIGHT + llmScore * LLM_WEIGHT);
        const finalScore = Math.max(0, Math.min(100, hybridScore));
        const riskLevel = computeRiskLevel(finalScore);

        let sections = Array.isArray(llmResult.suspicious_sections)
          ? llmResult.suspicious_sections.slice(0, MAX_SUSPICIOUS_SECTIONS)
          : [];
        sections = sections.filter((s: any) => s.text?.length > 20 && s.reason?.length > 10);

        resultData = {
          risk_score: finalScore,
          risk_level: riskLevel,
          actionable_message: getActionableMessage(riskLevel),
          suspicious_sections: sections,
          insights: llmResult.insights || "No specific patterns identified.",
          writing_quality: llmResult.writing_quality || "",
          structural_analysis: structural,
          llm_score: llmScore,
        };
        modelUsed = aiResult.model;
        source = aiResult.provider;
      } else {
        // AI returned unparseable response → structural-only fallback
        const fb = getPlagiarismHeuristicFallback(structural);
        resultData = fb;
        modelUsed = "structural-only";
        source = "fallback";
        isFallback = true;
      }
    } else {
      // All providers failed → structural-only fallback
      const fb = getPlagiarismHeuristicFallback(structural);
      resultData = fb;
      modelUsed = "structural-only";
      source = "fallback";
      isFallback = true;
    }

    // 11. Cache
    await cacheResult(submissionId, resultData, modelUsed);

    return NextResponse.json({
      success: true,
      result: resultData,
      model: modelUsed,
      source,
      provider: source === "fallback" ? null : source,
      modelVersion: MODEL_VERSION,
      cached: false,
      fallback: isFallback,
      message: isFallback
        ? "AI temporarily unavailable. Showing structural analysis only."
        : undefined,
    });
  } catch (err: any) {
    console.error("[plagiarism-check POST]", err);
    return NextResponse.json({
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }, { status: 200 });
  }
}
