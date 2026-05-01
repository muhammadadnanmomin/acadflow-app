// ============================================================
// AcadFlow Shared AI Provider — Stabilized Zero-Failure
// NEVER throws to callers. Always returns a result or null.
// Features: stable models, input cap (8k), single retry,
//   circuit breaker, fast-mode fallback, health check,
//   structured error logging, request dedup, cooldown
// ============================================================
import { GoogleGenAI } from "@google/genai";

// ══════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const OLLAMA_URL = "http://localhost:11434/api/generate";

const GLOBAL_TIME_BUDGET_MS = 12_000;  // 12s max total
const SINGLE_CALL_TIMEOUT_MS = 8_000;  // 8s per call
const OLLAMA_TIMEOUT_MS = 5_000;
const RETRY_DELAY_MS = 1_500;          // 1.5s between retry
const COOLDOWN_MS = 30_000;
const CIRCUIT_BREAK_MS = 120_000;
const CIRCUIT_BREAK_THRESHOLD = 3;

// ── CRITICAL: Max input to AI — prevents timeouts/failures ────
const MAX_AI_INPUT_CHARS = 8_000;

// ── Current models ONLY (verified May 2026) ────────────────────
const GROQ_MODELS = [
  "llama-3.3-70b-versatile",  // deep reasoning — PRIMARY
  "llama-3.1-8b-instant",    // fast fallback
];

const GEMINI_MODEL = "gemini-2.5-flash";

const OLLAMA_MODELS = ["mistral", "llama3"];

// ── Text processing thresholds ────────────────────────────────
const SHORT_TEXT_LIMIT = 12_000;
const MEDIUM_TEXT_LIMIT = 80_000;
const MAX_TEXT_CHARS = 200_000;

// ══════════════════════════════════════════════════════════════
// STARTUP LOGGING — validate keys on first load
// ══════════════════════════════════════════════════════════════
const _groqKeyPresent = !!(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.length > 10);
const _geminiKeyPresent = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10);
console.log(`[ai-provider] Groq key: ${_groqKeyPresent ? "✅ present" : "❌ missing"}`);
console.log(`[ai-provider] Gemini key: ${_geminiKeyPresent ? "✅ present" : "❌ missing"}`);
console.log(`[ai-provider] Models: Groq=[${GROQ_MODELS.join(", ")}] Gemini=${GEMINI_MODEL}`);
console.log(`[ai-provider] Max AI input: ${MAX_AI_INPUT_CHARS} chars`);

// ══════════════════════════════════════════════════════════════
// RATE THROTTLE — minimum 3s between Groq API calls
// Prevents account restriction from rapid requests
// ══════════════════════════════════════════════════════════════
const MIN_GROQ_INTERVAL_MS = 3_000;
let _lastGroqCallTime = 0;

async function throttleGroq(): Promise<void> {
  const elapsed = Date.now() - _lastGroqCallTime;
  if (elapsed < MIN_GROQ_INTERVAL_MS) {
    const waitMs = MIN_GROQ_INTERVAL_MS - elapsed;
    console.log(`[ai-provider] ⏱️ Throttling Groq: waiting ${waitMs}ms`);
    await new Promise((r) => setTimeout(r, waitMs));
  }
  _lastGroqCallTime = Date.now();
}

// ══════════════════════════════════════════════════════════════
// CIRCUIT BREAKER
// ══════════════════════════════════════════════════════════════
interface CircuitState { failures: number; disabledUntil: number; }

const circuits: Record<string, CircuitState> = {
  groq: { failures: 0, disabledUntil: 0 },
  gemini: { failures: 0, disabledUntil: 0 },
};

function isCircuitOpen(provider: "groq" | "gemini"): boolean {
  const s = circuits[provider];
  if (Date.now() < s.disabledUntil) return true;
  if (Date.now() >= s.disabledUntil && s.failures > 0) {
    s.failures = 0;
    s.disabledUntil = 0;
  }
  return false;
}

function recordFailure(provider: "groq" | "gemini", httpStatus?: number) {
  const s = circuits[provider];

  // INSTANT circuit break on 400/429/403 — don't wait for threshold
  if (httpStatus && (httpStatus === 400 || httpStatus === 429 || httpStatus === 403)) {
    s.failures = CIRCUIT_BREAK_THRESHOLD;
    s.disabledUntil = Date.now() + CIRCUIT_BREAK_MS;
    console.warn(`[ai-provider] 🔴 ${provider} instantly disabled for ${CIRCUIT_BREAK_MS / 1000}s (HTTP ${httpStatus})`);
    return;
  }

  s.failures++;
  if (s.failures >= CIRCUIT_BREAK_THRESHOLD) {
    s.disabledUntil = Date.now() + CIRCUIT_BREAK_MS;
    console.warn(`[ai-provider] 🔴 Circuit OPEN for ${provider} — disabled ${CIRCUIT_BREAK_MS / 1000}s`);
  }
}

function recordSuccess(provider: "groq" | "gemini") {
  circuits[provider].failures = 0;
  circuits[provider].disabledUntil = 0;
}

// ══════════════════════════════════════════════════════════════
// STARTUP HEALTH CHECK — verify Groq key works
// Runs once asynchronously, disables Groq if key is bad
// ══════════════════════════════════════════════════════════════
let _groqHealthChecked = false;

async function checkGroqHealth(): Promise<boolean> {
  if (_groqHealthChecked) return !isCircuitOpen("groq");
  _groqHealthChecked = true;

  const key = getGroqKey();
  if (!key) return false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: GROQ_MODELS[0],
        messages: [{ role: "user", content: "Reply with OK" }],
        max_tokens: 5,
        temperature: 0,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      console.log("[ai-provider] ✅ Groq health check passed");
      return true;
    }

    const status = res.status;
    const body = await res.text().catch(() => "");
    console.error(`[ai-provider] ❌ Groq health check failed:`, { status, body: body.slice(0, 150) });
    recordFailure("groq", status);
    return false;
  } catch (err: any) {
    console.error(`[ai-provider] ❌ Groq health check error: ${err.message}`);
    return false;
  }
}

// ══════════════════════════════════════════════════════════════
// SERVER-SIDE COOLDOWN
// ══════════════════════════════════════════════════════════════
const cooldownMap = new Map<string, number>();

export function checkCooldown(userId: string, submissionId: string): { blocked: boolean; waitMs: number } {
  const key = `${userId}:${submissionId}`;
  const last = cooldownMap.get(key) || 0;
  const elapsed = Date.now() - last;
  if (elapsed < COOLDOWN_MS) return { blocked: true, waitMs: COOLDOWN_MS - elapsed };
  return { blocked: false, waitMs: 0 };
}

export function recordRequest(userId: string, submissionId: string) {
  cooldownMap.set(`${userId}:${submissionId}`, Date.now());
  if (cooldownMap.size > 500) {
    const now = Date.now();
    for (const [k, v] of cooldownMap) { if (now - v > COOLDOWN_MS * 2) cooldownMap.delete(k); }
  }
}

// ══════════════════════════════════════════════════════════════
// REQUEST DEDUPLICATION
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

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY ?? "";
  if (!apiKey || apiKey.length < 10 || apiKey.startsWith("your-")) return null;
  return new GoogleGenAI({ apiKey });
}

// ══════════════════════════════════════════════════════════════
// SINGLE RETRY — lightweight, retry ONCE only
// ══════════════════════════════════════════════════════════════
async function safeCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (firstErr) {
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    return await fn(); // single retry — throws if this also fails
  }
}

// ══════════════════════════════════════════════════════════════
// GROQ PROVIDER — tries each model, structured error logging
// ══════════════════════════════════════════════════════════════
async function callGroqChain(
  apiKey: string,
  messages: { role: string; content: string }[],
  maxTokens: number,
  deadline: number
): Promise<{ text: string; model: string }> {
  for (const model of GROQ_MODELS) {
    if (Date.now() >= deadline) throw new Error("TIME_BUDGET_EXCEEDED");

    // Rate throttle — wait 3s between Groq calls
    await throttleGroq();

    const remainingMs = Math.min(SINGLE_CALL_TIMEOUT_MS, deadline - Date.now());
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), remainingMs);
    const callStart = Date.now();

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
        if (content) {
          const latency = Date.now() - callStart;
          console.log(`[ai-provider] ✅ Groq ${model} succeeded (${content.length} chars, ${latency}ms)`);
          return { text: content, model: `groq/${model}` };
        }
      }

      const status = res.status;
      const errBody = await res.text().catch(() => "");

      console.error(`[ai-provider] ❌ Groq ${model} error:`, {
        status,
        body: errBody.slice(0, 200),
        model,
        latency: Date.now() - callStart,
      });

      // Auth/restriction → skip ALL Groq models, instant circuit break
      if (status === 401 || status === 403 || errBody.includes("restricted")) {
        recordFailure("groq", status);
        throw new Error("GROQ_AUTH_FAIL");
      }

      // Rate limit → instant circuit break (don't try next model)
      if (status === 429 || status === 400) {
        recordFailure("groq", status);
        throw new Error("GROQ_RATE_LIMITED");
      }

      // Other errors → try next model
    } catch (err: any) {
      if (err.message === "GROQ_AUTH_FAIL" || err.message === "GROQ_RATE_LIMITED" || err.message === "TIME_BUDGET_EXCEEDED") throw err;

      console.error(`[ai-provider] ❌ Groq ${model} exception:`, {
        name: err.name,
        message: err.message?.slice(0, 150),
        isTimeout: err.name === "AbortError",
      });
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error("GROQ_ALL_EXHAUSTED");
}

// ══════════════════════════════════════════════════════════════
// GEMINI PROVIDER — single stable model, structured logging
// ══════════════════════════════════════════════════════════════
async function callGeminiSingle(
  genAI: GoogleGenAI,
  prompt: string,
  deadline: number
): Promise<{ text: string; model: string }> {
  if (Date.now() >= deadline) throw new Error("TIME_BUDGET_EXCEEDED");

  const callStart = Date.now();

  try {
    const response = await genAI.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    const text = response.text ?? "";

    if (text) {
      const latency = Date.now() - callStart;
      console.log(`[ai-provider] ✅ Gemini ${GEMINI_MODEL} succeeded (${text.length} chars, ${latency}ms)`);
      return { text, model: `gemini/${GEMINI_MODEL}` };
    }

    throw new Error("Empty response from Gemini");
  } catch (err: any) {
    console.error(`[ai-provider] ❌ Gemini ${GEMINI_MODEL} error:`, {
      message: err.message?.slice(0, 200),
      includes429: err.message?.includes("429"),
      includes404: err.message?.includes("404"),
    });
    throw new Error("GEMINI_FAILED");
  }
}

// ══════════════════════════════════════════════════════════════
// OLLAMA LOCAL MODEL
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
        if (data.response) {
          console.log(`[ai-provider] ✅ Ollama ${model} succeeded`);
          return { text: data.response, model: `ollama/${model}` };
        }
      }
    } catch {
      // Silently skip — Ollama likely not running
    }
  }
  return null;
}

// ══════════════════════════════════════════════════════════════
// FAST MODE FALLBACK — smaller prompt if full analysis fails
// ══════════════════════════════════════════════════════════════
async function tryFastMode(
  text: string,
  deadline: number
): Promise<AICallResult | null> {
  if (Date.now() >= deadline) return null;

  const shortText = text.slice(0, 2000);
  const fastPrompt = `Summarize the following research paper excerpt in 100 words, then provide a brief quality assessment (1 sentence). Respond in JSON: {"summary": "...", "quality": "..."}\n\n${shortText}`;

  // Try Gemini first for fast mode (single model, no chain)
  const geminiClient = getGeminiClient();
  if (geminiClient && !isCircuitOpen("gemini")) {
    try {
      const result = await callGeminiSingle(geminiClient, fastPrompt, deadline);
      console.log("[ai-provider] ✅ Fast mode succeeded via Gemini");
      return { ...result, provider: "gemini" };
    } catch {
      // continue
    }
  }

  // Try Groq for fast mode
  const groqKey = getGroqKey();
  if (groqKey && !isCircuitOpen("groq")) {
    try {
      const result = await callGroqChain(
        groqKey,
        [{ role: "user", content: fastPrompt }],
        300,
        deadline
      );
      console.log("[ai-provider] ✅ Fast mode succeeded via Groq");
      return { ...result, provider: "groq" };
    } catch {
      // continue
    }
  }

  return null;
}

// ══════════════════════════════════════════════════════════════
// UNIFIED AI CALLER — NEVER throws. Returns result or null.
// Chain: safeCall(Groq) → safeCall(Gemini) → fastMode → Ollama → null
// ══════════════════════════════════════════════════════════════
export interface AICallOptions {
  messages?: { role: string; content: string }[];
  prompt?: string;
  maxTokens?: number;
  preferProvider?: "groq" | "gemini" | "auto";
  textLength?: number;
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

/** Cap input text to MAX_AI_INPUT_CHARS before sending to any provider */
function capInput(text: string): string {
  if (text.length <= MAX_AI_INPUT_CHARS) return text;

  // Smart cap: keep head + tail for context
  const headLen = Math.floor(MAX_AI_INPUT_CHARS * 0.6);
  const tailLen = MAX_AI_INPUT_CHARS - headLen - 50;
  return text.slice(0, headLen) + "\n\n[...content trimmed...]\n\n" + text.slice(-tailLen);
}

function capMessages(messages: { role: string; content: string }[]): { role: string; content: string }[] {
  return messages.map((m) => ({ ...m, content: capInput(m.content) }));
}

export async function callAI(options: AICallOptions): Promise<AICallResult | null> {
  // Dedup
  if (options.dedupKey) {
    const existing = inflightMap.get(options.dedupKey);
    if (existing) {
      console.log("[ai-provider] ♻️ Reusing in-flight request:", options.dedupKey);
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
  } = options;

  const deadline = Date.now() + GLOBAL_TIME_BUDGET_MS;
  const groqKey = getGroqKey();
  const geminiClient = getGeminiClient();

  // Cap all input before sending
  const chatMessages = capMessages(messages || [{ role: "user", content: prompt || "" }]);
  const singlePrompt = capInput(prompt || messagesToPrompt(chatMessages));
  const rawText = prompt || messagesToPrompt(messages || []);

  const groqAvailable = !!groqKey && !isCircuitOpen("groq");
  const geminiAvailable = !!geminiClient && !isCircuitOpen("gemini");

  console.log(`[ai-provider] Starting call: groq=${groqAvailable ? "✅" : "❌"} gemini=${geminiAvailable ? "✅" : "❌"} inputLen=${singlePrompt.length}`);

  // ── Determine order ─────────────────────────────────────────
  const tryOrder: ("groq" | "gemini")[] =
    preferProvider === "gemini" ? ["gemini", "groq"] :
    preferProvider === "groq" ? ["groq", "gemini"] :
    ["groq", "gemini"]; // Default: Groq first

  // ── Sequential: NO retry for Groq (anti-ban), single retry for Gemini
  for (const provider of tryOrder) {
    if (Date.now() >= deadline) break;

    if (provider === "groq" && groqAvailable) {
      // Run health check on first call
      const healthy = await checkGroqHealth();
      if (!healthy) {
        console.warn("[ai-provider] Groq health check failed, skipping");
        continue;
      }

      try {
        // NO safeCall — single attempt only for Groq (anti-ban)
        const result = await callGroqChain(groqKey!, chatMessages, maxTokens, deadline);
        recordSuccess("groq");
        return { ...result, provider: "groq" };
      } catch (err: any) {
        console.warn(`[ai-provider] Groq failed: ${err.message}`);
        // recordFailure already called inside callGroqChain for 400/429
      }
    }

    if (provider === "gemini" && geminiAvailable) {
      try {
        // Single retry for Gemini only
        const result = await safeCall(() =>
          callGeminiSingle(geminiClient!, singlePrompt, deadline)
        );
        recordSuccess("gemini");
        return { ...result, provider: "gemini" };
      } catch (err: any) {
        console.warn(`[ai-provider] Gemini failed: ${err.message}`);
        recordFailure("gemini");
      }
    }
  }

  // ── Fast mode fallback (shorter prompt) ─────────────────────
  console.warn("[ai-provider] Full analysis failed. Trying fast mode...");
  const fastResult = await tryFastMode(rawText, deadline);
  if (fastResult) return fastResult;

  // ── Ollama local ────────────────────────────────────────────
  if (Date.now() < deadline) {
    const ollamaResult = await callOllama(singlePrompt);
    if (ollamaResult) return { ...ollamaResult, provider: "ollama" };
  }

  // ── All exhausted ───────────────────────────────────────────
  console.warn("[ai-provider] ⚠️ ALL providers exhausted. Returning null for heuristic fallback.");
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
// TEXT EXTRACTION
// ══════════════════════════════════════════════════════════════
export async function extractTextFromBuffer(buffer: Buffer, fileName: string): Promise<string> {
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

  if (ext === "txt") return buffer.toString("utf-8");

  throw new Error(`Unsupported file format: .${ext}. Supported: PDF, DOCX, TXT`);
}

// ══════════════════════════════════════════════════════════════
// TEXT PROCESSING
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
