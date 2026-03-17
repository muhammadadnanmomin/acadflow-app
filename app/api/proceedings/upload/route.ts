import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/proceedings/upload
 *
 * Organizer uploads a proceedings PDF file.
 * Body: FormData with fields:
 *   - file: File (PDF)
 *   - conferenceId: string
 *   - title: string
 *   - description?: string
 */
export async function POST(req: NextRequest) {
  try {
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

    /* ---- Parse form data ---- */
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const conferenceId = formData.get("conferenceId") as string | null;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;

    if (!file || !conferenceId || !title) {
      return NextResponse.json(
        { error: "Missing required fields: file, conferenceId, title" },
        { status: 400 }
      );
    }

    /* ---- Validate file type ---- */
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    /* ---- Validate file size (50 MB) ---- */
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size must be under 50 MB" },
        { status: 400 }
      );
    }

    /* ---- Check organizer / owner role ---- */
    const { data: staffRow } = await supabase
      .from("conference_staff")
      .select("id")
      .eq("conference_id", conferenceId)
      .eq("user_id", user.id)
      .in("role", ["organizer", "owner"])
      .limit(1);

    if (!staffRow || staffRow.length === 0) {
      return NextResponse.json(
        { error: "Only organizers can upload proceedings" },
        { status: 403 }
      );
    }

    /* ---- Upload to Supabase Storage ---- */
    const storagePath = `${conferenceId}/proceedings.pdf`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("conference-proceedings")
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    /* ---- Upsert proceedings record ---- */
    // Check if a record already exists
    const { data: existing } = await supabaseAdmin
      .from("conference_proceedings")
      .select("id")
      .eq("conference_id", conferenceId)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await supabaseAdmin
        .from("conference_proceedings")
        .update({
          title,
          description,
          file_path: storagePath,
          is_published: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("Update error:", updateError);
        return NextResponse.json(
          { error: "Failed to update proceedings record" },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from("conference_proceedings")
        .insert({
          conference_id: conferenceId,
          title,
          description,
          file_path: storagePath,
          is_published: true,
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        return NextResponse.json(
          { error: "Failed to save proceedings record" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, file_path: storagePath });
  } catch (err: any) {
    console.error("Proceedings upload error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
