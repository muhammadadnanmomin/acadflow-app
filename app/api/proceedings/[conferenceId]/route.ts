import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/proceedings/[conferenceId]
 *
 * Returns a short-lived signed URL for the proceedings PDF.
 * Access is gated by RLS (can_access_proceedings function).
 * Also returns the reason for access (author / attendee / organizer).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ conferenceId: string }> }
) {
  try {
    const { conferenceId } = await params;
    const supabase = await createServerSupabaseClient();

    /* ---- Auth ---- */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /* ---- Fetch proceedings (RLS enforces access) ---- */
    const { data: proceedings, error } = await supabase
      .from("conference_proceedings")
      .select("*")
      .eq("conference_id", conferenceId)
      .eq("is_published", true)
      .maybeSingle();

    if (error) {
      console.error("Fetch proceedings error:", error);
      return NextResponse.json(
        { error: "Failed to fetch proceedings" },
        { status: 500 }
      );
    }

    if (!proceedings) {
      return NextResponse.json(
        { error: "Proceedings not found or access denied" },
        { status: 404 }
      );
    }

    /* ---- Determine access reason ---- */
    let accessReason: "author" | "attendee" | "organizer" = "attendee";

    // Check organizer / owner
    const { data: staffRow } = await supabase
      .from("conference_staff")
      .select("id")
      .eq("conference_id", conferenceId)
      .eq("user_id", user.id)
      .in("role", ["organizer", "owner"])
      .limit(1);

    if (staffRow && staffRow.length > 0) {
      accessReason = "organizer";
    } else {
      // Check author (accepted + paid + presented)
      const { data: paperRow } = await supabase
        .from("paper_submissions")
        .select("id")
        .eq("conference_id", conferenceId)
        .eq("user_id", user.id)
        .eq("status", "Accepted")
        .eq("payment_status", "paid")
        .eq("presented", true)
        .limit(1);

      if (paperRow && paperRow.length > 0) {
        accessReason = "author";
      }
      // else defaults to "attendee" (paid registration)
    }

    /* ---- Get last access timestamp ---- */
    const { data: lastAccessRow } = await supabaseAdmin
      .from("proceedings_access_logs")
      .select("accessed_at")
      .eq("user_id", user.id)
      .eq("conference_id", conferenceId)
      .order("accessed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    /* ---- Generate signed URL (5 min) ---- */
    const { data: signedUrlData, error: signedUrlError } =
      await supabaseAdmin.storage
        .from("conference-proceedings")
        .createSignedUrl(proceedings.file_path, 60 * 5);

    if (signedUrlError || !signedUrlData) {
      console.error("Signed URL error:", signedUrlError);
      return NextResponse.json(
        { error: "Failed to generate download link" },
        { status: 500 }
      );
    }

    /* ---- Log access ---- */
    await supabaseAdmin.from("proceedings_access_logs").insert({
      user_id: user.id,
      conference_id: conferenceId,
    });

    return NextResponse.json({
      proceedings: {
        id: proceedings.id,
        title: proceedings.title,
        description: proceedings.description,
        is_published: proceedings.is_published,
        created_at: proceedings.created_at,
      },
      signedUrl: signedUrlData.signedUrl,
      accessReason,
      lastAccessedAt: lastAccessRow?.accessed_at ?? null,
    });
  } catch (err: any) {
    console.error("Proceedings GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
