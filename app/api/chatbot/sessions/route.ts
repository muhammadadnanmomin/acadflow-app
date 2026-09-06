// ============================================================
// Confairo Chatbot — /api/chatbot/sessions
// POST: Create new session | GET: Fetch session + messages
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// ── POST /api/chatbot/sessions ───────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { role } = body;

    // Try to get authenticated user
    let userId: string | null = null;
    let userRole: string = role ?? "guest";

    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        // Get profile role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile?.role) userRole = profile.role;
      }
    } catch {
      // Not authenticated — guest session
    }

    const { data: session, error } = await supabaseServer
      .from("chatbot_sessions")
      .insert({ user_id: userId, user_role: userRole })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ session: toCamel(session) });
  } catch (err: unknown) {
    console.error("[chatbot/sessions POST]", err);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}

// ── GET /api/chatbot/sessions?sessionId=xxx ───────────────────
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const { data: messages, error } = await supabaseServer
      .from("chatbot_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({
      messages: (messages ?? []).map(toCamelMsg),
    });
  } catch (err: unknown) {
    console.error("[chatbot/sessions GET]", err);
    return NextResponse.json(
      { error: "Failed to load session" },
      { status: 500 }
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────
function toCamel(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    userRole: row.user_role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCamelMsg(row: Record<string, unknown>) {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at,
  };
}
