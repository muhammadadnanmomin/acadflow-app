// ============================================================
// AcadFlow AI Paper Reviewer — /api/review-paper
// POST: Analyze a submission's paper via Groq LLM
// Features: auth, caching, chunked summarization, safe JSON
//           parsing, timeout, decision normalization
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseServer } from "@/lib/supabase/server";

// ── Constants ─────────────────────────────────────────────────
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const PRIMARY_MODEL = "llama-3.3-70b-versatile";
const FALLBACK_MODEL = "llama-3.1-8b-instant";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const API_TIMEOUT_MS = 45_000; // 45 seconds per call
const SMALL_DOC_LIMIT = 25_000; // chars — send directly
const LARGE_DOC_LIMIT = 80_000; // chars — needs chunking
const MAX_TEXT_CHARS = 200_000; // absolute cap

// ── Groq API Key ──────────────────────────────────────────────
function getGroqKey(): string | null {
  const key = process.env.GROQ_API_KEY ?? "";
  if (!key || key.length < 10 || key.startsWith("your-")) return null;
  return key;
}

// ── Call Groq API with timeout + model fallback ───────────────
async function callGroq(
  apiKey: string,
  messages: { role: string; content: string }[],
  maxTokens = 1500,
  model = PRIMARY_MODEL
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      // If primary model fails, try fallback
      if (model === PRIMARY_MODEL) {
        console.warn(`Primary model failed (${res.status}), trying fallback...`);
        return callGroq(apiKey, messages, maxTokens, FALLBACK_MODEL);
      }
      throw new Error(`Groq API error ${res.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  } catch (err: any) {
    if (err.name === "AbortError") {
      if (model === PRIMARY_MODEL) {
        console.warn("Primary model timed out, trying fallback...");
        return callGroq(apiKey, messages, maxTokens, FALLBACK_MODEL);
      }
      throw new Error("AI analysis timed out. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Safe JSON Parsing with fallbacks ──────────────────────────
function safeParseReviewJSON(raw: string): Record<string, any> | null {
  // 1. Direct parse
  try {
    return JSON.parse(raw);
  } catch { /* continue */ }

  // 2. Extract from markdown code blocks
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch { /* continue */ }
  }

  // 3. Find JSON object braces in text
  const braceStart = raw.indexOf("{");
  const braceEnd = raw.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd > braceStart) {
    try {
      return JSON.parse(raw.slice(braceStart, braceEnd + 1));
    } catch { /* continue */ }
  }

  return null;
}

// ── Normalize AI Decision to standard labels ──────────────────
function normalizeDecision(raw: string): string {
  const lower = (raw || "").toLowerCase().trim();
  if (lower.includes("reject")) return "Reject";
  if (lower.includes("major")) return "Major Revision";
  if (lower.includes("minor")) return "Minor Revision";
  if (lower.includes("accept")) return "Accept";
  return raw || "Unknown";
}

// ── Text Processing: smart extraction + chunking pipeline ─────
function smartExtractText(text: string): string {
  if (text.length <= SMALL_DOC_LIMIT) return text;

  // Head (abstract, introduction) + mid (methodology/results) + tail (conclusion)
  const headLen = 10_000;
  const tailLen = 8_000;
  const midLen = 7_000;

  const head = text.slice(0, headLen);
  const tail = text.slice(-tailLen);
  const midStart = Math.floor((text.length - midLen) / 2);
  const mid = text.slice(midStart, midStart + midLen);

  return [
    head,
    "\n\n[--- MIDDLE SECTION EXCERPT ---]\n\n",
    mid,
    "\n\n[--- CONCLUSION SECTION ---]\n\n",
    tail,
  ].join("");
}

async function chunkAndSummarize(text: string, apiKey: string): Promise<string> {
  const CHUNK_SIZE = 20_000;
  const chunks: string[] = [];

  for (let i = 0; i < text.length && chunks.length < 5; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }

  // Summarize each chunk in parallel
  const summaries = await Promise.all(
    chunks.map((chunk, i) =>
      callGroq(
        apiKey,
        [
          {
            role: "system",
            content:
              "You are an academic paper analyst. Summarize this section of a research paper in 300-400 words. Focus on key arguments, methodology, findings, and claims. Preserve technical details.",
          },
          {
            role: "user",
            content: `Section ${i + 1} of ${chunks.length}:\n\n${chunk}`,
          },
        ],
        500
      )
    )
  );

  return summaries
    .map((s, i) => `=== Section ${i + 1} Summary ===\n${s}`)
    .join("\n\n");
}

async function processText(
  text: string,
  apiKey: string
): Promise<{ processed: string; method: string }> {
  const cleaned = text.slice(0, MAX_TEXT_CHARS);

  if (cleaned.length <= SMALL_DOC_LIMIT) {
    return { processed: cleaned, method: "direct" };
  }

  if (cleaned.length <= LARGE_DOC_LIMIT) {
    return { processed: smartExtractText(cleaned), method: "smart_extraction" };
  }

  // Large document — chunk and summarize
  const summarized = await chunkAndSummarize(cleaned, apiKey);
  return { processed: summarized, method: "chunked_summarization" };
}

// ── Extract text from file buffer ─────────────────────────────
async function extractText(
  buffer: Buffer,
  fileName: string
): Promise<string> {
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

    // 4. Verify Groq API key
    const apiKey = getGroqKey();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "AI review is not configured. Please add GROQ_API_KEY to your environment variables.",
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

    // 5b. Authorization — organizer/admin always allowed, reviewer only if assigned
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

    // 8. Process text (direct / smart extraction / chunking)
    const { processed, method } = await processText(rawText, apiKey);

    // 9. Call Groq for the review
    const messages = buildReviewMessages(processed);
    let rawResponse: string;
    let modelUsed = PRIMARY_MODEL;

    try {
      rawResponse = await callGroq(apiKey, messages, 1500);
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || "AI analysis failed" },
        { status: 500 }
      );
    }

    // 10. Parse JSON safely — with one retry on failure
    let review = safeParseReviewJSON(rawResponse);

    if (!review) {
      // Retry once with explicit instruction
      try {
        const retryMessages = [
          ...messages,
          { role: "assistant" as const, content: rawResponse },
          {
            role: "user" as const,
            content:
              "Your previous response was not valid JSON. Please respond with ONLY a valid JSON object, no markdown, no explanation.",
          },
        ];
        const retryResponse = await callGroq(apiKey, retryMessages, 1500);
        review = safeParseReviewJSON(retryResponse);
      } catch {
        /* fall through */
      }
    }

    if (!review) {
      return NextResponse.json(
        {
          error:
            "Failed to parse AI response. The model returned an invalid format. Please try again.",
        },
        { status: 500 }
      );
    }

    // 11. Normalize decision
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

    // 12. Cache result
    await cacheReview(submissionId, review, modelUsed);

    return NextResponse.json({
      success: true,
      review,
      model: modelUsed,
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
