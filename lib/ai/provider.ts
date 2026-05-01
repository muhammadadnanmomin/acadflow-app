// ============================================================
// AcadFlow Shared AI Provider — Zero-Failure Architecture
// NEVER throws to callers. Always returns a result or null.
// Features: time budget, circuit breaker, parallel racing,
//   retry-with-delay, request dedup, heuristic fallback,
//   server-side cooldown, output normalization
// ============================================================
import { GoogleGenerativeAI } from "@google/generative-ai";

// ══════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const OLLAMA_URL = "http://localhost:11434/api/generate";

const GLOBAL_TIME_BUDGET_MS = 12_000;  // 12s max total execution
const SINGLE_CALL_TIMEOUT_MS = 8_000;  // 8s per individual API call
const OLLAMA_TIMEOUT_MS = 5_000;       // 5s for local model
const RETRY_COUNT = 2;                 // 2 retries per provider
const RETRY_DELAY_MS = 2_000;          // 2s between retries
const COOLDOWN_MS = 30_000;            // 30s server-side cooldown
const CIRCUIT_BREAK_MS = 120_000;      // 2min circuit breaker
const CIRCUIT_BREAK_THRESHOLD = 3;     // failures before breaking
const MAX_TEXT_CHARS = 200_000;

// ── Lean model chains (2 per provider for speed) ──────────────
const GROQ_MODELS = [
  "llama3-70b-8192",        // deep reasoning
  "mixtral-8x7b-32768",     // structured output, 32k ctx
];

const GEMINI_MODELS = [
  "gemini-2.5-flash-preview-04-17",
  "gemini-2.0-flash",
];

const OLLAMA_MODELS = ["mistral", "llama3"];

// ── Text size thresholds ──────────────────────────────────────
const SHORT_TEXT_LIMIT = 12_000;
const MEDIUM_TEXT_LIMIT = 80_000;

// ══════════════════════════════════════════════════════════════
// CIRCUIT BREAKER — disables a provider after repeated failures
// ══════════════════════════════════════════════════════════════
interface CircuitState {
  failures: number;
  disabledUntil: number; // timestamp
}

const circuits: Record<string, CircuitState> = {
  groq: { failures: 0, disabledUntil: 0 },
  gemini: { failures: 0, disabledUntil: 0 },
};

function isCircuitOpen(provider: "groq" | "gemini"): boolean {
  const s = circuits[provider];
  if (Date.now() < s.disabledUntil) return true; // still disabled
  if (Date.now() >= s.disabledUntil && s.failures > 0) {
    // Reset after cooldown expires
    s.failures = 0;
    s.disabledUntil = 0;
  }
  return false;
}

function recordFailure(provider: "groq" | "gemini") {
  const s = circuits[provider];
  s.failures++;
  if (s.failures >= CIRCUIT_BREAK_THRESHOLD) {
    s.disabledUntil = Date.now() + CIRCUIT_BREAK_MS;
    console.warn(`[ai-provider] Circuit OPEN for ${provider} — disabled for ${CIRCUIT_BREAK_MS / 1000}s`);
  }
}

function recordSuccess(provider: "groq" | "gemini") {
  circuits[provider].failures = 0;
  circuits[provider].disabledUntil = 0;
}

// ══════════════════════════════════════════════════════════════
// SERVER-SIDE COOLDOWN — prevents repeated requests
// ══════════════════════════════════════════════════════════════
const cooldownMap = new Map<string, number>();

export function checkCooldown(userId: string, submissionId: string): { blocked: boolean; waitMs: number } {
  const key = `${userId}:${submissionId}`;
  const lastTime = cooldownMap.get(key) || 0;
  const elapsed = Date.now() - lastTime;

  if (elapsed < COOLDOWN_MS) {
    return { blocked: true, waitMs: COOLDOWN_MS - elapsed };
  }
  return { blocked: false, waitMs: 0 };
}

export function recordRequest(userId: string, submissionId: string) {
  cooldownMap.set(`${userId}:${submissionId}`, Date.now());

  // Cleanup old entries every 100 requests
  if (cooldownMap.size > 500) {
    const now = Date.now();
    for (const [k, v] of cooldownMap) {
      if (now - v > COOLDOWN_MS * 2) cooldownMap.delete(k);
    }
  }
}

// ══════════════════════════════════════════════════════════════
// REQUEST DEDUPLICATION — reuses in-flight promises
// ══════════════════════════════════════════════════════════════
const inflightMap = new Map<string, Promise<AICallResult | null>>();

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
// RETRY WITH DELAY
// ══════════════════════════════════════════════════════════════
async function retryWithDelay<T>(
  fn: () => Promise<T>,
  retries = RETRY_COUNT,
  delay = RETRY_DELAY_MS
): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("retryWithDelay: unreachable");
}

// ══════════════════════════════════════════════════════════════
// GROQ PROVIDER — tries each model in chain
// ══════════════════════════════════════════════════════════════
async function callGroqChain(
  apiKey: string,
  messages: { role: string; content: string }[],
  maxTokens: number,
  deadline: number
): Promise<{ text: string; model: string }> {
  for (const model of GROQ_MODELS) {
    if (Date.now() >= deadline) throw new Error("TIME_BUDGET_EXCEEDED");

    const remainingMs = Math.min(SINGLE_CALL_TIMEOUT_MS, deadline - Date.now());
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), remainingMs);

    try {
      const res = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.3 }),
        signal: controller.signal,
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content ?? "";
        if (content) return { text: content, model: `groq/${model}` };
      }

      const status = res.status;
      // Auth/account errors → skip all Groq models
      if (status === 401 || status === 403) throw new Error("GROQ_AUTH_FAIL");
      // Rate limit / server error → try next model
      console.warn(`[ai-provider] Groq ${model} failed (${status}), trying next...`);
    } catch (err: any) {
      if (err.message === "GROQ_AUTH_FAIL" || err.message === "TIME_BUDGET_EXCEEDED") throw err;
      console.warn(`[ai-provider] Groq ${model}: ${err.name === "AbortError" ? "timeout" : err.message}`);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error("GROQ_ALL_EXHAUSTED");
}

// ══════════════════════════════════════════════════════════════
// GEMINI PROVIDER — tries each model in chain
// ══════════════════════════════════════════════════════════════
async function callGeminiChain(
  genAI: GoogleGenerativeAI,
  prompt: string,
  deadline: number
): Promise<{ text: string; model: string }> {
  for (const modelName of GEMINI_MODELS) {
    if (Date.now() >= deadline) throw new Error("TIME_BUDGET_EXCEEDED");

    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) return { text, model: `gemini/${modelName}` };
    } catch (err: any) {
      console.warn(`[ai-provider] Gemini ${modelName}: ${(err.message || "").slice(0, 80)}`);
    }
  }
  throw new Error("GEMINI_ALL_EXHAUSTED");
}

// ══════════════════════════════════════════════════════════════
// OLLAMA LOCAL MODEL — optional, fast-fail if not running
// ══════════════════════════════════════════════════════════════
async function callOllama(prompt: string): Promise<{ text: string; model: string } | null> {
  for (const model of OLLAMA_MODELS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

      const res = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, stream: false }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data.response) return { text: data.response, model: `ollama/${model}` };
      }
    } catch {
      // Ollama not running or model not available — silently skip
    }
  }
  return null;
}

// ══════════════════════════════════════════════════════════════
// UNIFIED AI CALLER — NEVER throws. Returns result or null.
// Execution: race(Groq, Gemini) → retry loser → Ollama → null
// ══════════════════════════════════════════════════════════════
export interface AICallOptions {
  messages?: { role: string; content: string }[];
  prompt?: string;
  maxTokens?: number;
  preferProvider?: "groq" | "gemini" | "auto";
  textLength?: number;
  /** Unique key for request deduplication */
  dedupKey?: string;
}

export interface AICallResult {
  text: string;
  model: string;
  provider: "groq" | "gemini" | "ollama";
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

export async function callAI(options: AICallOptions): Promise<AICallResult | null> {
  // ── Deduplication check ─────────────────────────────────────
  if (options.dedupKey) {
    const existing = inflightMap.get(options.dedupKey);
    if (existing) {
      console.log("[ai-provider] Reusing in-flight request:", options.dedupKey);
      return existing;
    }
  }

  const promise = _callAIInternal(options);

  if (options.dedupKey) {
    inflightMap.set(options.dedupKey, promise);
    promise.finally(() => inflightMap.delete(options.dedupKey!));
  }

  return promise;
}

async function _callAIInternal(options: AICallOptions): Promise<AICallResult | null> {
  const {
    messages,
    prompt,
    maxTokens = 2000,
    preferProvider = "auto",
    textLength = 0,
  } = options;

  const deadline = Date.now() + GLOBAL_TIME_BUDGET_MS;
  const groqKey = getGroqKey();
  const geminiClient = getGeminiClient();
  const chatMessages = messages || [{ role: "user", content: prompt || "" }];
  const singlePrompt = prompt || messagesToPrompt(chatMessages);

  const groqAvailable = !!groqKey && !isCircuitOpen("groq");
  const geminiAvailable = !!geminiClient && !isCircuitOpen("gemini");

  // ── Strategy 1: Parallel race (both available) ──────────────
  if (groqAvailable && geminiAvailable && preferProvider === "auto") {
    try {
      const result = await Promise.any([
        retryWithDelay(() => callGroqChain(groqKey!, chatMessages, maxTokens, deadline))
          .then((r): AICallResult => { recordSuccess("groq"); return { ...r, provider: "groq" }; })
          .catch((err) => { recordFailure("groq"); throw err; }),
        retryWithDelay(() => callGeminiChain(geminiClient!, singlePrompt, deadline))
          .then((r): AICallResult => { recordSuccess("gemini"); return { ...r, provider: "gemini" }; })
          .catch((err) => { recordFailure("gemini"); throw err; }),
      ]);
      return result;
    } catch {
      // Both providers failed — continue to Ollama
    }
  }

  // ── Strategy 2: Sequential (preferred or single available) ──
  const tryOrder: ("groq" | "gemini")[] =
    preferProvider === "gemini" ? ["gemini", "groq"] :
    preferProvider === "groq" ? ["groq", "gemini"] :
    textLength < SHORT_TEXT_LIMIT ? ["groq", "gemini"] : ["gemini", "groq"];

  for (const provider of tryOrder) {
    if (Date.now() >= deadline) break;

    if (provider === "groq" && groqAvailable) {
      try {
        const result = await retryWithDelay(() =>
          callGroqChain(groqKey!, chatMessages, maxTokens, deadline)
        );
        recordSuccess("groq");
        return { ...result, provider: "groq" };
      } catch {
        recordFailure("groq");
      }
    }

    if (provider === "gemini" && geminiAvailable) {
      try {
        const result = await retryWithDelay(() =>
          callGeminiChain(geminiClient!, singlePrompt, deadline)
        );
        recordSuccess("gemini");
        return { ...result, provider: "gemini" };
      } catch {
        recordFailure("gemini");
      }
    }
  }

  // ── Strategy 3: Ollama local model ──────────────────────────
  if (Date.now() < deadline) {
    const ollamaResult = await callOllama(singlePrompt);
    if (ollamaResult) return { ...ollamaResult, provider: "ollama" };
  }

  // ── All providers exhausted → return null (caller uses heuristic)
  console.warn("[ai-provider] All providers exhausted. Caller should use heuristic fallback.");
  return null;
}

// ══════════════════════════════════════════════════════════════
// HEURISTIC FALLBACKS — deterministic, no API needed
// ══════════════════════════════════════════════════════════════

export interface ReviewFallback {
  summary: string;
  key_contributions: string[];
  strengths: string[];
  weaknesses: string[];
  grammar_issues: string[];
  final_decision: string;
  confidence_score: number;
}

export function getReviewHeuristicFallback(text: string): ReviewFallback {
  const wordCount = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const preview = text.slice(0, 500).replace(/\n+/g, " ").trim();

  return {
    summary: preview + (text.length > 500 ? "…" : ""),
    key_contributions: [
      "AI analysis unavailable — manual review required",
      `Document contains approximately ${wordCount.toLocaleString()} words across ${sentences.length} sentences`,
    ],
    strengths: [
      "Paper structure appears valid",
      "Document was successfully parsed and is readable",
    ],
    weaknesses: [
      "Automated AI analysis could not be completed at this time",
      "Please perform a manual review for detailed assessment",
    ],
    grammar_issues: [],
    final_decision: "Manual Review Required",
    confidence_score: 0,
  };
}

export interface PlagiarismFallback {
  risk_score: number;
  risk_level: string;
  actionable_message: string;
  suspicious_sections: any[];
  insights: string;
  writing_quality: string;
  structural_analysis: Record<string, any>;
  llm_score: null;
}

export function getPlagiarismHeuristicFallback(
  structuralAnalysis: Record<string, any>
): PlagiarismFallback {
  const score = structuralAnalysis.score ?? 0;
  const level = score < 30 ? "Low" : score < 70 ? "Medium" : "High";

  return {
    risk_score: score,
    risk_level: level,
    actionable_message:
      level === "Low"
        ? "✅ Low Risk — Structural analysis shows minimal repetition patterns."
        : level === "Medium"
        ? "⚠️ Medium Risk — Structural analysis detected some repetition. Manual review recommended."
        : "🚨 High Risk — Structural analysis detected significant repetition patterns.",
    suspicious_sections: [],
    insights:
      `Based on structural analysis only (AI providers unavailable). ` +
      `Repetition ratio: ${Math.round((structuralAnalysis.repetition_ratio ?? 0) * 100)}%, ` +
      `Vocabulary diversity: ${Math.round((structuralAnalysis.vocabulary_diversity ?? 0) * 100)}%, ` +
      `Template phrases found: ${structuralAnalysis.template_phrase_count ?? 0}.`,
    writing_quality: "AI writing quality assessment unavailable. Showing structural metrics only.",
    structural_analysis: structuralAnalysis,
    llm_score: null,
  };
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

export function smartExtractText(text: string): string {
  if (text.length <= SHORT_TEXT_LIMIT) return text;

  const headLen = 10_000;
  const tailLen = 8_000;
  const midLen = 7_000;

  const head = text.slice(0, headLen);
  const tail = text.slice(-tailLen);
  const midStart = Math.floor((text.length - midLen) / 2);
  const mid = text.slice(midStart, midStart + midLen);

  return [head, "\n\n[--- MIDDLE SECTION ---]\n\n", mid, "\n\n[--- CONCLUSION ---]\n\n", tail].join("");
}

export function chunkTextWithOverlap(text: string, chunkWords = 1800, overlapWords = 200): string[] {
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

export async function chunkAndSummarize(text: string): Promise<string> {
  const CHUNK_SIZE = 20_000;
  const chunks: string[] = [];

  for (let i = 0; i < text.length && chunks.length < 5; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }

  const summaries: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const result = await callAI({
      messages: [
        { role: "system", content: "Summarize this section in 300-400 words. Focus on key arguments, methodology, findings." },
        { role: "user", content: `Section ${i + 1} of ${chunks.length}:\n\n${chunks[i]}` },
      ],
      maxTokens: 500,
      preferProvider: "auto",
      textLength: chunks[i].length,
    });
    summaries.push(result?.text ?? `[Section ${i + 1}: summary unavailable]`);
  }

  return summaries.map((s, i) => `=== Section ${i + 1} ===\n${s}`).join("\n\n");
}

export async function processTextForAI(text: string): Promise<{ processed: string; method: string }> {
  const cleaned = text.slice(0, MAX_TEXT_CHARS);

  if (cleaned.length <= SHORT_TEXT_LIMIT) return { processed: cleaned, method: "direct" };
  if (cleaned.length <= MEDIUM_TEXT_LIMIT) return { processed: smartExtractText(cleaned), method: "smart_extraction" };

  const summarized = await chunkAndSummarize(cleaned);
  return { processed: summarized, method: "chunked_summarization" };
}

// ══════════════════════════════════════════════════════════════
// SAFE JSON PARSING
// ══════════════════════════════════════════════════════════════
export function safeParseJSON(raw: string): Record<string, any> | null {
  try { return JSON.parse(raw); } catch { /* */ }

  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) { try { return JSON.parse(codeBlock[1].trim()); } catch { /* */ } }

  const s = raw.indexOf("{");
  const e = raw.lastIndexOf("}");
  if (s !== -1 && e > s) { try { return JSON.parse(raw.slice(s, e + 1)); } catch { /* */ } }

  return null;
}
