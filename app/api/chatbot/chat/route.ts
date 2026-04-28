// ============================================================
// AcadFlow Chatbot — /api/chatbot/chat
// POST: SSE streaming chat with RAG + role-aware context
// Powered by Google Gemini (gemini-1.5-flash) — free tier
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { supabaseServer } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// ── Key Validation ────────────────────────────────────────────
// Rejects placeholder values so fallback triggers correctly
function getValidGeminiKey(): string | null {
  const key = process.env.GEMINI_API_KEY ?? "";
  if (!key || key === "your-gemini-api-key-here" || key.length < 20) return null;
  return key;
}

// ── Rate Limiter (in-memory, per-IP) ─────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_RPM = parseInt(process.env.CHATBOT_RATE_LIMIT_RPM ?? "20");

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= RATE_LIMIT_RPM) return false;
  entry.count++;
  return true;
}

// ── Input Sanitizer ───────────────────────────────────────────
function sanitize(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[^\p{L}\p{N}\s.,!?'"@#$%&*()\-+=:;/\\[\]{}]/gu, "")
    .trim()
    .slice(0, 2000);
}

// ── System Prompt Builder ─────────────────────────────────────
function buildSystemPrompt(userRole: string, ragContext: string): string {
  const roleContext =
    ({
      organizer:
        "The user is a conference ORGANIZER. They manage conferences, review workflows, submissions, and program committees. Help them with organizing tasks, setting up conferences, managing reviewers, and handling submissions.",
      reviewer:
        "The user is a REVIEWER. They evaluate paper submissions. Help them understand the review process, deadlines, and how to submit reviews on AcadFlow.",
      admin:
        "The user is a platform ADMIN. They have full access to AcadFlow. Help them with platform management, settings, and troubleshooting.",
      participant:
        "The user is a PARTICIPANT/RESEARCHER. They submit papers and attend conferences. Help them with submissions, deadlines, registration, and conference discovery.",
      guest:
        "The user is not logged in. Provide general guidance about AcadFlow and encourage them to sign up for personalized features.",
    } as Record<string, string>)[userRole] ?? "The user is a guest visitor.";

  return `You are AcadFlow AI, an intelligent assistant for AcadFlow — an academic conference management platform.

Your role: ${roleContext}

Platform capabilities you know about:
- Conference discovery and browsing
- Paper submission (PDF upload, co-author management)
- Peer review workflow (double-blind)
- Registration and payment (Razorpay)
- Certificate generation
- Schedule management
- Proceedings export

${ragContext ? `\n## Relevant Knowledge Base Context\n${ragContext}\n` : ""}

## Guidelines
1. Be concise, helpful, and professional. Use academic tone but keep it friendly.
2. Use Markdown formatting (bold, lists) when helpful for clarity.
3. When discussing deadlines, always mention the exact date if you know it.
4. If you don't know something specific, say so and guide the user to the right section of the platform.
5. For navigation, refer to specific Dashboard sections: Dashboard → Participant, Dashboard → Organizer, etc.
6. Never hallucinate conference data. Only mention conferences from the provided context.
7. Keep responses under 400 words unless the user asks for detailed information.
8. Always end with a helpful follow-up question or suggestion when appropriate.`;
}

// ── Rule-based Fallback (when no Gemini key) ──────────────────
function getFallbackResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("submit") || lower.includes("paper") || lower.includes("upload")) {
    return "**Submitting a Paper on AcadFlow:**\n\n1. Go to **Dashboard → Participant**\n2. Click **Submit Paper**\n3. Select your target conference\n4. Fill in title, abstract, and keywords\n5. Upload your PDF (max 15MB)\n6. Add co-authors if needed\n7. Click **Submit**\n\nYou'll receive a confirmation email immediately. Is there a specific step you need help with?";
  }
  if (lower.includes("deadline") || lower.includes("due date")) {
    return "**Checking Deadlines:**\n\nGo to **Dashboard → Participant → My Submissions** to see all deadlines for your submitted papers.\n\nFor browsing all conference deadlines, visit the **Conferences** page and use the deadline filter.\n\nWould you like help finding a specific conference?";
  }
  if (lower.includes("conference") || lower.includes("find") || lower.includes("discover")) {
    return "**Discovering Conferences:**\n\nVisit the **Conferences** page (no login required) to browse all available conferences. You can filter by:\n- Research topic / keywords\n- Submission deadline\n- Conference date\n- Location / country\n\nWould you like to know more about a specific research area?";
  }
  if (lower.includes("review") || lower.includes("reviewer")) {
    return "**Review Process:**\n\nAcadFlow uses a **double-blind peer review** process. As a reviewer:\n1. Accept your invitation via email\n2. Go to **Dashboard → Reviewer**\n3. View assigned papers\n4. Submit reviews by the deadline\n\nEach paper typically receives 3 independent reviews. Is there something specific about the review process you'd like to know?";
  }
  if (lower.includes("register") || lower.includes("payment") || lower.includes("fee")) {
    return "**Registration & Payment:**\n\nRegistration fees are set by the conference organizer. To register:\n1. Go to **Dashboard → Billing**\n2. Select your conference\n3. Pay via Razorpay (cards, UPI, net banking)\n\nYou can download your invoice from the Billing section. Need help with a specific payment?";
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hello! 👋 I'm **AcadFlow AI**, your conference management assistant.\n\nI can help you with:\n- 📄 Paper submission guidance\n- 🗓️ Conference discovery & deadlines\n- 🔍 Submission status tracking\n- ❓ Platform FAQs\n- 🧭 Navigation help\n\nWhat would you like to know?";
  }
  return "I'm here to help with AcadFlow — the academic conference management platform. I can assist with **paper submissions**, **conference discovery**, **deadlines**, **review processes**, and **platform navigation**.\n\nCould you be more specific about what you need help with? Or try one of the quick actions below.";
}

// ── Safety settings (permissive for academic context) ─────────
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,         threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,  threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,  threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

// ── Main POST Handler ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Rate limiting
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    req.headers.get("x-real-ip") ??
    "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const rawMessage: string = body.message ?? "";
    const sessionId: string | null = body.sessionId ?? null;

    const message = sanitize(rawMessage);
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // ── Get user context ──────────────────────────────────────
    let userId: string | null = null;
    let userRole = "guest";

    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile?.role) userRole = profile.role;
      }
    } catch {
      // Guest
    }

    // ── Ensure session exists ─────────────────────────────────
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const { data: session } = await supabaseServer
        .from("chatbot_sessions")
        .insert({ user_id: userId, user_role: userRole })
        .select()
        .single();
      activeSessionId = session?.id ?? null;
    }

    // ── Fetch conversation history (last 10 messages) ─────────
    const conversationHistory: Array<{ role: string; content: string }> = [];
    if (activeSessionId) {
      const { data: history } = await supabaseServer
        .from("chatbot_messages")
        .select("role, content")
        .eq("session_id", activeSessionId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (history) {
        conversationHistory.push(...history.reverse());
      }
    }

    // ── Save user message to DB (non-fatal) ──────────────────
    if (activeSessionId) {
      try {
        await supabaseServer.from("chatbot_messages").insert({
          session_id: activeSessionId,
          role: "user",
          content: message,
        });
      } catch { /* DB not ready yet — continue without persistence */ }
    }

    const geminiKey = getValidGeminiKey();

    // ── RAG: Semantic search (only with valid key) ────────────
    let ragContext = "";
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const embModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const embResult = await embModel.embedContent(message.slice(0, 8000));
        const queryEmbedding = embResult.embedding.values;

        const { data: docs } = await supabaseServer.rpc("match_chatbot_documents", {
          query_embedding: queryEmbedding,
          match_threshold: 0.45,
          match_count: 4,
        });

        if (docs?.length) {
          ragContext = docs
            .map((d: { content: string }) => d.content)
            .join("\n\n---\n\n");
        }
      } catch (ragErr) {
        console.warn("RAG search failed, continuing without context:", ragErr);
      }
    }

    // ── No valid Gemini key → rule-based fallback ─────────────
    if (!geminiKey) {
      const fallback = getFallbackResponse(message);

      // Save async — don't block
      if (activeSessionId) {
        void (async () => {
          try {
            await supabaseServer.from("chatbot_messages").insert({
              session_id: activeSessionId,
              role: "assistant",
              content: fallback,
            });
          } catch { /* non-fatal */ }
        })();
      }

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const words = fallback.split(" ");
          for (const word of words) {
            const data = JSON.stringify({ type: "token", content: word + " " });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            await new Promise((r) => setTimeout(r, 15));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // ── Gemini streaming ──────────────────────────────────────
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL ?? "gemini-1.5-flash",
      systemInstruction: buildSystemPrompt(userRole, ragContext),
      safetySettings: SAFETY_SETTINGS,
    });

    const geminiHistory = conversationHistory
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const chat = model.startChat({
      history: geminiHistory,
      generationConfig: { maxOutputTokens: 600, temperature: 0.7 },
    });

    const encoder = new TextEncoder();
    let fullResponse = "";

    // sendMessageStream is called INSIDE the ReadableStream so any
    // Gemini API errors are caught by the stream's try/catch
    // and sent as SSE error events — never a 500.
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await chat.sendMessageStream(message);

          for await (const chunk of result.stream) {
            const token = chunk.text();
            if (token) {
              fullResponse += token;
              const data = JSON.stringify({ type: "token", content: token });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // Save to DB non-fatally
          if (activeSessionId && fullResponse) {
            void (async () => {
              try {
                await supabaseServer.from("chatbot_messages").insert({
                  session_id: activeSessionId,
                  role: "assistant",
                  content: fullResponse,
                });
              } catch { /* non-fatal */ }
            })();
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("Gemini stream error:", err);
          // Fall back to rule-based if Gemini fails mid-stream
          const fallback = fullResponse || getFallbackResponse(message);
          if (!fullResponse) {
            const data = JSON.stringify({ type: "token", content: fallback });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Session-Id": activeSessionId ?? "",
      },
    });
  } catch (err: unknown) {
    console.error("[chatbot/chat POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
