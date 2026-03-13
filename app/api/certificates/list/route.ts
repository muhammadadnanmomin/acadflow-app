import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/certificates/list
 * Returns certificates for the given paper IDs.
 * Uses supabaseAdmin to bypass RLS (the organizer dashboard
 * already verifies ownership via the papers query).
 */
export async function POST(req: Request) {
  try {
    const { paperIds } = await req.json();

    if (!Array.isArray(paperIds) || paperIds.length === 0) {
      return NextResponse.json([]);
    }

    const { data, error } = await supabaseAdmin
      .from("certificates")
      .select("id, paper_id, author_id, file_url, verification_code, issued_at")
      .in("paper_id", paperIds);

    if (error) {
      console.error("Certificates list error:", error);
      return NextResponse.json([], { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error("Certificates list error:", err);
    return NextResponse.json([], { status: 500 });
  }
}
