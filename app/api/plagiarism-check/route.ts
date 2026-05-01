// ============================================================
// AcadFlow AI Plagiarism Risk Detector — /api/plagiarism-check
// POST: Analyze a submission's paper for similarity patterns
// Features: hybrid scoring (structural + LLM), caching,
//           chunking with overlap, model versioning
// Uses: Google Gemini API (free tier)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseServer } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ── Constants ─────────────────────────────────────────────────
const MODEL_VERSION = "plagiarism-v1.1"; // bump when prompt/model changes
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const CHUNK_WORD_SIZE = 1800; // ~1800 words per chunk
const CHUNK_OVERLAP_WORDS = 200; // 200 words overlap
const MAX_SUSPICIOUS_SECTIONS = 5;
const MAX_TEXT_CHARS = 200_000;

// ── Structural weight in hybrid score ─────────────────────────
const STRUCTURAL_WEIGHT = 0.3;
const LLM_WEIGHT = 0.7;

// ── Gemini Client with model fallback chain ──────────────────
// Free tier quotas are PER MODEL — so using different models
// gives us separate daily limits
const GEMINI_MODELS = [
  "gemini-2.5-flash-preview-04-17",
  "gemini-2.5-pro-preview-05-06",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY ?? "";
  if (!apiKey || apiKey.length < 10 || apiKey.startsWith("your-")) return null;
  return new GoogleGenerativeAI(apiKey);
}

// ── Call Gemini with retry + model fallback ───────────────────
async function callGemini(
  genAI: GoogleGenerativeAI,
  prompt: string,
  modelIndex = 0
): Promise<{ text: string; modelUsed: string }> {
  if (modelIndex >= GEMINI_MODELS.length) {
    throw new Error(
      "All AI models are currently rate-limited. Please wait a minute and try again."
    );
  }

  const modelName = GEMINI_MODELS[modelIndex];
  const model = genAI.getGenerativeModel({ model: modelName });

  try {
    const result = await model.generateContent(prompt);
    return { text: result.response.text(), modelUsed: modelName };
  } catch (err: any) {
    const msg = err?.message || "";

    // If rate limited (429), try next model immediately
    if (msg.includes("429") || msg.includes("quota") || msg.includes("Too Many Requests")) {
      console.warn(
        `[plagiarism-check] ${modelName} rate limited, trying next model...`
      );
      return callGemini(genAI, prompt, modelIndex + 1);
    }

    // If model not found (404), try next model
    if (msg.includes("404") || msg.includes("not found")) {
      console.warn(
        `[plagiarism-check] ${modelName} not found, trying next model...`
      );
      return callGemini(genAI, prompt, modelIndex + 1);
    }

    throw err;
  }
}

// ── Safe JSON Parsing ─────────────────────────────────────────
function safeParseJSON(raw: string): Record<string, any> | null {
  try {
    return JSON.parse(raw);
  } catch { /* continue */ }

  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch { /* continue */ }
  }

  const braceStart = raw.indexOf("{");
  const braceEnd = raw.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd > braceStart) {
    try {
      return JSON.parse(raw.slice(braceStart, braceEnd + 1));
    } catch { /* continue */ }
  }

  return null;
}

// ── Extract text from file buffer ─────────────────────────────
async function extractText(buffer: Buffer, fileName: string): Promise<string> {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "pdf") {
    const { getDocumentProxy, extractText: pdfExtract } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await pdfExtract(pdf, { mergePages: true });
    return text || "";
  }

  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }

  if (ext === "txt") {
    return buffer.toString("utf-8");
  }

  throw new Error(`Unsupported file format: .${ext}. Supported: PDF, DOCX, TXT`);
}

// ── Chunking with overlap ─────────────────────────────────────
function chunkText(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + CHUNK_WORD_SIZE, words.length);
    chunks.push(words.slice(start, end).join(" "));
    start += CHUNK_WORD_SIZE - CHUNK_OVERLAP_WORDS;
    if (end >= words.length) break;
  }

  return chunks;
}

// ══════════════════════════════════════════════════════════════
// STRUCTURAL SIMILARITY ANALYSIS
// Lightweight n-gram fingerprinting + repetition + vocabulary
// diversity — runs entirely locally, no external API needed
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
  score: number; // 0-100
  repetitionRatio: number;
  vocabularyDiversity: number;
  avgChunkSimilarity: number;
  templatePhraseCount: number;
}

function analyzeStructural(text: string, chunks: string[]): StructuralAnalysis {
  // 1. Repetition ratio — how many n-grams appear more than once
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
  // Normalize for text length (longer texts naturally have lower TTR)
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
    "it is worth noting",
    "it should be noted",
    "in this paper we",
    "the results show that",
    "in conclusion",
    "as mentioned above",
    "as shown in",
    "it can be seen",
    "on the other hand",
    "in order to",
    "it is important to note",
    "the purpose of this study",
    "the aim of this paper",
    "further research is needed",
    "the findings suggest",
    "based on the above",
    "as a result",
    "in the present study",
    "to the best of our knowledge",
    "plays an important role",
    "it is evident that",
    "in light of",
    "it has been shown",
    "according to the results",
  ];

  const lowerText = text.toLowerCase();
  let templatePhraseCount = 0;
  for (const phrase of templatePhrases) {
    const regex = new RegExp(phrase.replace(/\s+/g, "\\s+"), "gi");
    const matches = lowerText.match(regex);
    if (matches) templatePhraseCount += matches.length;
  }

  // Normalize template count relative to text length (per 1000 words)
  const templateDensity = words.length > 0 ? (templatePhraseCount / words.length) * 1000 : 0;

  // Compute structural score (0-100)
  // Higher = more suspicious
  const repScore = Math.min(100, repetitionRatio * 400); // high repetition = suspicious
  const vocScore = Math.max(0, (1 - vocabularyDiversity) * 100); // low diversity = suspicious
  const simScore = Math.min(100, avgChunkSimilarity * 200); // high chunk similarity = suspicious
  const tmpScore = Math.min(100, templateDensity * 8); // many templates = suspicious

  const score = Math.round(
    repScore * 0.25 +
    vocScore * 0.25 +
    simScore * 0.25 +
    tmpScore * 0.25
  );

  return {
    score: Math.max(0, Math.min(100, score)),
    repetitionRatio: Math.round(repetitionRatio * 100) / 100,
    vocabularyDiversity: Math.round(vocabularyDiversity * 100) / 100,
    avgChunkSimilarity: Math.round(avgChunkSimilarity * 100) / 100,
    templatePhraseCount,
  };
}

// ── Prepare text for analysis ─────────────────────────────────
function prepareTextForLLM(text: string): string {
  const cleaned = text.slice(0, MAX_TEXT_CHARS);

  // For shorter papers, send directly
  if (cleaned.length <= 30_000) return cleaned;

  // For longer papers, extract key sections
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

function getActionableMessage(level: string, score: number): string {
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

    // Invalidate if model version changed
    if (data && data.model_version !== MODEL_VERSION) {
      return null;
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
    console.warn("Failed to cache plagiarism result (table may not exist yet):", err);
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

    // 3. Check cache (unless force regenerate)
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

    // 4. Initialize Gemini
    const genAI = getGeminiClient();
    if (!genAI) {
      return NextResponse.json(
        {
          error:
            "AI analysis is not configured. Please add GEMINI_API_KEY to your environment variables.",
        },
        { status: 503 }
      );
    }

    // 5. Fetch paper submission
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

    // 5b. Authorization
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
      rawText = await extractText(fileBuffer, fileName);
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

    const cleanedText = rawText.slice(0, MAX_TEXT_CHARS);

    // 8. Chunk text with overlap for structural analysis
    const chunks = chunkText(cleanedText);

    // 9. Structural similarity analysis (local, no API)
    const structural = analyzeStructural(cleanedText, chunks);

    // 10. LLM analysis via Gemini
    const llmText = prepareTextForLLM(cleanedText);

    const prompt = `You are an academic integrity assistant specialized in detecting similarity patterns in research papers. Your role is to identify:
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

    try {
      const geminiResult = await callGemini(genAI, prompt);
      rawResponse = geminiResult.text;
      modelUsed = geminiResult.modelUsed;
    } catch (err: any) {
      console.error("[plagiarism-check] Gemini API error:", err);
      return NextResponse.json(
        { error: err.message || "AI analysis failed. Please try again." },
        { status: 500 }
      );
    }

    // 11. Parse JSON safely — with retry on failure
    let llmResult = safeParseJSON(rawResponse);

    if (!llmResult) {
      // Retry once with explicit instruction
      try {
        const retryResult = await callGemini(
          genAI,
          `Your previous response was not valid JSON. Please respond with ONLY a valid JSON object matching the schema I specified. No markdown, no explanation. Here was your response:\n\n${rawResponse.slice(0, 1000)}`
        );
        llmResult = safeParseJSON(retryResult.text);
      } catch {
        /* fall through */
      }
    }

    if (!llmResult) {
      return NextResponse.json(
        {
          error:
            "Failed to parse AI response. The model returned an invalid format. Please try again.",
        },
        { status: 500 }
      );
    }

    // 12. Hybrid risk scoring
    const llmScore = Math.max(0, Math.min(100, Number(llmResult.risk_score) || 50));
    const hybridScore = Math.round(
      structural.score * STRUCTURAL_WEIGHT + llmScore * LLM_WEIGHT
    );
    const finalScore = Math.max(0, Math.min(100, hybridScore));
    const riskLevel = computeRiskLevel(finalScore);

    // 13. Limit suspicious sections to top MAX_SUSPICIOUS_SECTIONS
    let suspiciousSections = Array.isArray(llmResult.suspicious_sections)
      ? llmResult.suspicious_sections.slice(0, MAX_SUSPICIOUS_SECTIONS)
      : [];

    // Filter out overly short or generic entries
    suspiciousSections = suspiciousSections.filter(
      (s: any) => s.text && s.text.length > 20 && s.reason && s.reason.length > 10
    );

    // 14. Build final result
    const resultData = {
      risk_score: finalScore,
      risk_level: riskLevel,
      actionable_message: getActionableMessage(riskLevel, finalScore),
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
