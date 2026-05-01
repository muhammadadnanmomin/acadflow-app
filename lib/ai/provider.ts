// ============================================================
// AcadFlow Shared AI Provider — Zero-Cost Hybrid Architecture
// Intelligent routing: Groq → Gemini fallback
// Features: model fallback chains, rate limit handling,
//           text extraction, chunking, safe JSON parsing
// ============================================================
import { GoogleGenerativeAI } from "@google/generative-ai";

// ══════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const API_TIMEOUT_MS = 45_000;
const MAX_TEXT_CHARS = 200_000;

// ── Model chains (each model has separate free-tier quota) ────
const GROQ_MODELS = [
  "llama3-70b-8192",          // deep reasoning
  "mixtral-8x7b-32768",      // structured output, 32k ctx
  "llama-3.3-70b-versatile",  // versatile
  "llama-3.1-8b-instant",    // fast fallback
];

const GEMINI_MODELS = [
  "gemini-2.5-flash-preview-04-17",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

// ── Text size thresholds for intelligent routing ──────────────
const SHORT_TEXT_LIMIT = 12_000;   // chars → Groq direct
const MEDIUM_TEXT_LIMIT = 80_000;  // chars → Gemini (long ctx)
// > MEDIUM → chunk + summarize, then Groq

// ══════════════════════════════════════════════════════════════
// API KEY HELPERS
// ══════════════════════════════════════════════════════════════
function getGroqKey(): string | null {
  const key = process.env.GROQ_API_KEY ?? "";
  if (!key || key.length < 10 || key.startsWith("your-")) return null;
  return key;
}

function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY ?? "";
  if (!apiKey || apiKey.length < 10 || apiKey.startsWith("your-")) return null;
  return new GoogleGenerativeAI(apiKey);
}

// ══════════════════════════════════════════════════════════════
// GROQ PROVIDER — with model fallback chain
// ══════════════════════════════════════════════════════════════
async function callGroqDirect(
  apiKey: string,
  messages: { role: string; content: string }[],
  maxTokens: number,
  modelIndex = 0
): Promise<{ text: string; model: string }> {
  if (modelIndex >= GROQ_MODELS.length) {
    throw new Error("GROQ_ALL_EXHAUSTED");
  }

  const model = GROQ_MODELS[modelIndex];
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
      const status = res.status;

      // Rate limit or server error → try next model
      if (status === 429 || status === 503 || status === 500) {
        console.warn(`[ai-provider] Groq ${model} failed (${status}), trying next...`);
        return callGroqDirect(apiKey, messages, maxTokens, modelIndex + 1);
      }

      // Account restricted or auth error → all Groq models will fail
      if (status === 401 || status === 403 || errBody.includes("restricted")) {
        throw new Error("GROQ_ALL_EXHAUSTED");
      }

      // 404 model not found → try next
      if (status === 404) {
        console.warn(`[ai-provider] Groq ${model} not found, trying next...`);
        return callGroqDirect(apiKey, messages, maxTokens, modelIndex + 1);
      }

      throw new Error(`Groq API error ${status}: ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    return { text: content, model: `groq/${model}` };
  } catch (err: any) {
    if (err.message === "GROQ_ALL_EXHAUSTED") throw err;

    if (err.name === "AbortError") {
      console.warn(`[ai-provider] Groq ${model} timed out, trying next...`);
      return callGroqDirect(apiKey, messages, maxTokens, modelIndex + 1);
    }

    // Network error → try next model
    if (modelIndex < GROQ_MODELS.length - 1) {
      console.warn(`[ai-provider] Groq ${model} error: ${err.message}, trying next...`);
      return callGroqDirect(apiKey, messages, maxTokens, modelIndex + 1);
    }

    throw new Error("GROQ_ALL_EXHAUSTED");
  } finally {
    clearTimeout(timeout);
  }
}

// ══════════════════════════════════════════════════════════════
// GEMINI PROVIDER — with model fallback chain
// ══════════════════════════════════════════════════════════════
async function callGeminiDirect(
  genAI: GoogleGenerativeAI,
  prompt: string,
  modelIndex = 0
): Promise<{ text: string; model: string }> {
  if (modelIndex >= GEMINI_MODELS.length) {
    throw new Error("GEMINI_ALL_EXHAUSTED");
  }

  const modelName = GEMINI_MODELS[modelIndex];
  const model = genAI.getGenerativeModel({ model: modelName });

  try {
    const result = await model.generateContent(prompt);
    return { text: result.response.text(), model: `gemini/${modelName}` };
  } catch (err: any) {
    const msg = err?.message || "";

    // Rate limited or not found → try next model
    if (
      msg.includes("429") ||
      msg.includes("quota") ||
      msg.includes("Too Many") ||
      msg.includes("404") ||
      msg.includes("not found") ||
      msg.includes("not supported")
    ) {
      console.warn(`[ai-provider] Gemini ${modelName} unavailable, trying next...`);
      return callGeminiDirect(genAI, prompt, modelIndex + 1);
    }

    // If more models available, try next
    if (modelIndex < GEMINI_MODELS.length - 1) {
      console.warn(`[ai-provider] Gemini ${modelName} error, trying next...`);
      return callGeminiDirect(genAI, prompt, modelIndex + 1);
    }

    throw new Error("GEMINI_ALL_EXHAUSTED");
  }
}

// ══════════════════════════════════════════════════════════════
// UNIFIED AI CALLER — Groq primary → Gemini fallback
// Converts chat messages to a single prompt for Gemini compat
// ══════════════════════════════════════════════════════════════
export interface AICallOptions {
  messages?: { role: string; content: string }[];
  prompt?: string; // alternative: single prompt string
  maxTokens?: number;
  /** Override routing: "groq" | "gemini" | "auto" */
  preferProvider?: "groq" | "gemini" | "auto";
  /** Text length hint for intelligent routing */
  textLength?: number;
}

export interface AICallResult {
  text: string;
  model: string;     // e.g. "groq/llama3-70b-8192" or "gemini/gemini-2.0-flash"
  provider: "groq" | "gemini";
}

function messagesToPrompt(messages: { role: string; content: string }[]): string {
  return messages
    .map((m) => {
      if (m.role === "system") return `System Instructions: ${m.content}`;
      if (m.role === "assistant") return `Previous Response: ${m.content}`;
      return m.content;
    })
    .join("\n\n");
}

export async function callAI(options: AICallOptions): Promise<AICallResult> {
  const {
    messages,
    prompt,
    maxTokens = 2000,
    preferProvider = "auto",
    textLength = 0,
  } = options;

  const groqKey = getGroqKey();
  const geminiClient = getGeminiClient();

  if (!groqKey && !geminiClient) {
    throw new Error(
      "No AI provider configured. Add GROQ_API_KEY or GEMINI_API_KEY to environment."
    );
  }

  // Build unified prompt for Gemini compatibility
  const chatMessages = messages || [{ role: "user", content: prompt || "" }];
  const singlePrompt = prompt || messagesToPrompt(chatMessages);

  // ── Intelligent routing ─────────────────────────────────────
  let tryGroqFirst: boolean;

  if (preferProvider === "groq") {
    tryGroqFirst = true;
  } else if (preferProvider === "gemini") {
    tryGroqFirst = false;
  } else {
    // Auto routing based on text length
    // Short text → Groq (faster, better for structured output)
    // Medium/long → Gemini (bigger context window)
    tryGroqFirst = textLength < SHORT_TEXT_LIMIT;
  }

  // ── Try primary provider → fallback to secondary ────────────
  if (tryGroqFirst && groqKey) {
    try {
      const result = await callGroqDirect(groqKey, chatMessages, maxTokens);
      return { ...result, provider: "groq" };
    } catch (err: any) {
      console.warn("[ai-provider] Groq chain exhausted, falling back to Gemini...");
    }
  }

  // Try Gemini
  if (geminiClient) {
    try {
      const result = await callGeminiDirect(geminiClient, singlePrompt);
      return { ...result, provider: "gemini" };
    } catch (err: any) {
      console.warn("[ai-provider] Gemini chain exhausted...");
    }
  }

  // If we haven't tried Groq yet (was set to gemini-first), try it now
  if (!tryGroqFirst && groqKey) {
    try {
      const result = await callGroqDirect(groqKey, chatMessages, maxTokens);
      return { ...result, provider: "groq" };
    } catch {
      // All exhausted
    }
  }

  throw new Error(
    "AI analysis temporarily unavailable. All providers are rate-limited. Please try again in a few minutes."
  );
}

// ══════════════════════════════════════════════════════════════
// TEXT EXTRACTION — from file buffers (PDF, DOCX, TXT)
// ══════════════════════════════════════════════════════════════
export async function extractTextFromBuffer(
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

// ══════════════════════════════════════════════════════════════
// TEXT PROCESSING — smart extraction + chunking
// ══════════════════════════════════════════════════════════════

/** Smart extract: head + mid + tail for medium-length docs */
export function smartExtractText(text: string): string {
  if (text.length <= SHORT_TEXT_LIMIT) return text;

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

/** Chunk text with overlap for analysis */
export function chunkTextWithOverlap(
  text: string,
  chunkWords = 1800,
  overlapWords = 200
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkWords, words.length);
    chunks.push(words.slice(start, end).join(" "));
    start += chunkWords - overlapWords;
    if (end >= words.length) break;
  }

  return chunks;
}

/** Chunk + summarize for very large documents */
export async function chunkAndSummarize(text: string): Promise<string> {
  const CHUNK_SIZE = 20_000;
  const chunks: string[] = [];

  for (let i = 0; i < text.length && chunks.length < 5; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }

  // Summarize each chunk (sequentially to avoid rate limits)
  const summaries: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const result = await callAI({
      messages: [
        {
          role: "system",
          content:
            "You are an academic paper analyst. Summarize this section in 300-400 words. Focus on key arguments, methodology, findings, and claims. Preserve technical details.",
        },
        {
          role: "user",
          content: `Section ${i + 1} of ${chunks.length}:\n\n${chunks[i]}`,
        },
      ],
      maxTokens: 500,
      preferProvider: "auto",
      textLength: chunks[i].length,
    });
    summaries.push(result.text);
  }

  return summaries
    .map((s, i) => `=== Section ${i + 1} Summary ===\n${s}`)
    .join("\n\n");
}

/**
 * Full text processing pipeline with intelligent routing:
 * - Short (<12k) → direct to Groq
 * - Medium (<80k) → smart extract → Gemini or Groq
 * - Large (>80k) → chunk + summarize → then Groq
 */
export async function processTextForAI(
  text: string
): Promise<{ processed: string; method: string }> {
  const cleaned = text.slice(0, MAX_TEXT_CHARS);

  if (cleaned.length <= SHORT_TEXT_LIMIT) {
    return { processed: cleaned, method: "direct" };
  }

  if (cleaned.length <= MEDIUM_TEXT_LIMIT) {
    return { processed: smartExtractText(cleaned), method: "smart_extraction" };
  }

  // Large document → chunk + summarize
  const summarized = await chunkAndSummarize(cleaned);
  return { processed: summarized, method: "chunked_summarization" };
}

// ══════════════════════════════════════════════════════════════
// SAFE JSON PARSING — with multiple fallback strategies
// ══════════════════════════════════════════════════════════════
export function safeParseJSON(raw: string): Record<string, any> | null {
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

// ══════════════════════════════════════════════════════════════
// RETRY WITH JSON FIX — retries once if JSON parsing fails
// ══════════════════════════════════════════════════════════════
export async function callAIWithJSONRetry(
  options: AICallOptions
): Promise<{ parsed: Record<string, any>; model: string; provider: string }> {
  const result = await callAI(options);
  let parsed = safeParseJSON(result.text);

  if (!parsed) {
    // Retry once with explicit JSON instruction
    try {
      const retryResult = await callAI({
        messages: [
          ...(options.messages || [{ role: "user", content: options.prompt || "" }]),
          { role: "assistant", content: result.text },
          {
            role: "user",
            content:
              "Your previous response was not valid JSON. Please respond with ONLY a valid JSON object, no markdown, no explanation.",
          },
        ],
        maxTokens: options.maxTokens,
        preferProvider: result.provider,
        textLength: options.textLength,
      });
      parsed = safeParseJSON(retryResult.text);
    } catch {
      /* fall through */
    }
  }

  if (!parsed) {
    throw new Error(
      "Failed to parse AI response. The model returned an invalid format. Please try again."
    );
  }

  return { parsed, model: result.model, provider: result.provider };
}
