// ============================================================
// Confairo — Get AI Usage for a Conference
// ============================================================
import { NextResponse } from "next/server";
import { getAIUsage } from "@/lib/ai/credits";

export async function POST(req: Request) {
  try {
    const { conferenceId } = await req.json();

    if (!conferenceId) {
      return NextResponse.json({ error: "conferenceId required" }, { status: 400 });
    }

    const usage = await getAIUsage(conferenceId);

    return NextResponse.json({
      usage: usage
        ? { used: usage.used_credits, total: usage.total_credits }
        : null,
    });
  } catch {
    return NextResponse.json({ usage: null });
  }
}
