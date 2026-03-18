import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const MIN_SIGNATURES = 0; // no minimum on the API — UI enforces min 2 before PDF gen
const MAX_SIGNATURES = 3;

export interface SignatureRecord {
  name?: string;
  role: string;
  image_url: string;
  type: "drawn" | "uploaded";
}

/* ------------------------------------------------------------------ */
/*  Auth helper — ensures caller owns the conference                   */
/* ------------------------------------------------------------------ */
async function getAuthenticatedOrganizer(conferenceId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized", status: 401, userId: null };

  const { data: conf } = await supabaseAdmin
    .from("conferences")
    .select("id, organizer_id, signatures")
    .eq("id", conferenceId)
    .single();

  if (!conf) return { error: "Conference not found", status: 404, userId: null };
  if (conf.organizer_id !== user.id)
    return { error: "Forbidden", status: 403, userId: null };

  return { conf, userId: user.id, error: null, status: 200 };
}

/* ------------------------------------------------------------------ */
/*  GET /api/organizer/signatures/[conferenceId]                       */
/* ------------------------------------------------------------------ */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ conferenceId: string }> }
) {
  const { conferenceId } = await params;
  const { conf, error, status } = await getAuthenticatedOrganizer(conferenceId);
  if (error) return NextResponse.json({ error }, { status });

  return NextResponse.json({ signatures: conf!.signatures ?? [] });
}

/* ------------------------------------------------------------------ */
/*  POST /api/organizer/signatures/[conferenceId]                      */
/*  Body: { name?, role, image_url, type }                            */
/* ------------------------------------------------------------------ */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ conferenceId: string }> }
) {
  const { conferenceId } = await params;
  const { conf, error, status } = await getAuthenticatedOrganizer(conferenceId);
  if (error) return NextResponse.json({ error }, { status });

  const body = (await req.json()) as SignatureRecord;
  if (!body.role?.trim())
    return NextResponse.json({ error: "Role is required" }, { status: 400 });
  if (!body.image_url)
    return NextResponse.json({ error: "image_url is required" }, { status: 400 });

  const current: SignatureRecord[] = conf!.signatures ?? [];
  if (current.length >= MAX_SIGNATURES) {
    return NextResponse.json(
      { error: `Maximum ${MAX_SIGNATURES} signatures allowed` },
      { status: 400 }
    );
  }

  const newSig: SignatureRecord = {
    name: body.name?.trim() || undefined,
    role: body.role.trim(),
    image_url: body.image_url,
    type: body.type ?? "drawn",
  };

  const updated = [...current, newSig];

  const { error: dbErr } = await supabaseAdmin
    .from("conferences")
    .update({ signatures: updated })
    .eq("id", conferenceId);

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  return NextResponse.json({ signatures: updated }, { status: 201 });
}

/* ------------------------------------------------------------------ */
/*  PATCH /api/organizer/signatures/[conferenceId]                     */
/*  Body: { index: number, name?, role?, image_url?, type? }          */
/* ------------------------------------------------------------------ */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ conferenceId: string }> }
) {
  const { conferenceId } = await params;
  const { conf, error, status } = await getAuthenticatedOrganizer(conferenceId);
  if (error) return NextResponse.json({ error }, { status });

  const body = await req.json();
  const index: number = body.index;

  const current: SignatureRecord[] = conf!.signatures ?? [];
  if (index < 0 || index >= current.length) {
    return NextResponse.json({ error: "Invalid signature index" }, { status: 400 });
  }

  const updated = current.map((sig, i) =>
    i === index
      ? {
          name: "name" in body ? body.name?.trim() || undefined : sig.name,
          role: body.role?.trim() || sig.role,
          image_url: body.image_url || sig.image_url,
          type: body.type || sig.type,
        }
      : sig
  );

  const { error: dbErr } = await supabaseAdmin
    .from("conferences")
    .update({ signatures: updated })
    .eq("id", conferenceId);

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  return NextResponse.json({ signatures: updated });
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/organizer/signatures/[conferenceId]                    */
/*  Body: { index: number }                                            */
/* ------------------------------------------------------------------ */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ conferenceId: string }> }
) {
  const { conferenceId } = await params;
  const { conf, error, status } = await getAuthenticatedOrganizer(conferenceId);
  if (error) return NextResponse.json({ error }, { status });

  const { index } = await req.json();
  const current: SignatureRecord[] = conf!.signatures ?? [];

  if (index < 0 || index >= current.length) {
    return NextResponse.json({ error: "Invalid signature index" }, { status: 400 });
  }

  const updated = current.filter((_, i) => i !== index);

  const { error: dbErr } = await supabaseAdmin
    .from("conferences")
    .update({ signatures: updated })
    .eq("id", conferenceId);

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  return NextResponse.json({ signatures: updated });
}
