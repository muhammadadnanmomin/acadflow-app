// ============================================================
// AcadFlow Chatbot — /api/chatbot/settings
// GET: Public settings fetch | PATCH: Admin update
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// ── GET /api/chatbot/settings ─────────────────────────────────
export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("chatbot_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) throw error;

    return NextResponse.json({
      settings: {
        enabled: data.enabled,
        welcomeMessage: data.welcome_message,
        botName: data.bot_name,
        primaryColor: data.primary_color,
      },
    });
  } catch {
    // Return sensible defaults if DB isn't migrated yet
    return NextResponse.json({
      settings: {
        enabled: true,
        welcomeMessage:
          "Hi! I'm AcadFlow AI 👋 How can I help you today?",
        botName: "AcadFlow AI",
        primaryColor: "#3b4fd4",
      },
    });
  }
}

// ── PATCH /api/chatbot/settings ───────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    // Verify admin role
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

    const body = await req.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (typeof body.enabled === "boolean") updates.enabled = body.enabled;
    if (typeof body.welcomeMessage === "string") updates.welcome_message = body.welcomeMessage.slice(0, 500);
    if (typeof body.botName === "string") updates.bot_name = body.botName.slice(0, 50);
    if (typeof body.primaryColor === "string") updates.primary_color = body.primaryColor;

    const { error } = await supabaseServer
      .from("chatbot_settings")
      .update(updates)
      .eq("id", 1);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[chatbot/settings PATCH]", err);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
