// ============================================================
// AcadFlow Chatbot — /api/chatbot/seed-knowledge
// POST: Admin — seed RAG knowledge base with Gemini embeddings
// Uses: text-embedding-004 → 768-dim vectors
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { supabaseServer } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildKnowledgeDocuments } from "@/lib/chatbot/mockData";

// ── POST /api/chatbot/seed-knowledge ─────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Verify admin
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured — cannot generate embeddings" },
        { status: 503 }
      );
    }

    // Allow custom documents or use defaults
    let documents: ReturnType<typeof buildKnowledgeDocuments>;
    try {
      const body = await req.json();
      documents = body.documents?.length ? body.documents : buildKnowledgeDocuments();
    } catch {
      documents = buildKnowledgeDocuments();
    }

    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Gemini embedding API is per-document (no batch endpoint like OpenAI)
    // Process one at a time with a small delay to avoid rate limits
    let inserted = 0;
    let failed = 0;

    for (const doc of documents) {
      try {
        const text = doc.content.replace(/\n/g, " ").slice(0, 8000);
        const embResult = await genAI.models.embedContent({
          model: "gemini-embedding-001",
          contents: text,
        });
        const embedding = embResult.embeddings?.[0]?.values;

        const { error } = await supabaseServer.from("chatbot_documents").insert({
          content: doc.content,
          embedding,
          metadata: doc.metadata,
        });

        if (error) {
          console.error("Insert error:", error);
          failed++;
        } else {
          inserted++;
        }

        // Small delay to respect Gemini free-tier rate limits (1500 RPD / 15 RPM)
        await new Promise((r) => setTimeout(r, 100));
      } catch (err) {
        console.error("Embed error for doc:", doc.metadata?.title, err);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      inserted,
      failed,
      total: documents.length,
    });
  } catch (err: unknown) {
    console.error("[seed-knowledge]", err);
    return NextResponse.json(
      { error: "Failed to seed knowledge base" },
      { status: 500 }
    );
  }
}

// ── DELETE /api/chatbot/seed-knowledge ───────────────────────
export async function DELETE() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await supabaseServer
      .from("chatbot_documents")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[seed-knowledge DELETE]", err);
    return NextResponse.json({ error: "Failed to clear" }, { status: 500 });
  }
}
