import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendCoOrganizerEmail } from "@/lib/email/sendCoOrganizerEmail";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function authenticateUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);
  return user;
}

async function getConference(conferenceId: string) {
  const { data } = await supabaseAdmin
    .from("conferences")
    .select("organizer_id, title")
    .eq("id", conferenceId)
    .single();
  return data;
}

async function getUserOrgName(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("organization_members")
    .select("organizations ( name )")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  return (data as any)?.organizations?.name || null;
}

async function userBelongsToOrg(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("organization_members")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  return !!data;
}

/* ------------------------------------------------------------------ */
/*  GET /api/organizer/co-organizers?conferenceId=...                   */
/*  Returns list of co-organizers for a conference.                     */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  const conferenceId = new URL(req.url).searchParams.get("conferenceId");

  if (!conferenceId) {
    return NextResponse.json(
      { error: "conferenceId is required" },
      { status: 400 }
    );
  }

  const user = await authenticateUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Conference existence + owner check
  const conf = await getConference(conferenceId);
  if (!conf) {
    return NextResponse.json(
      { error: "Conference not found" },
      { status: 404 }
    );
  }

  const isOwner = conf.organizer_id === user.id;

  // Access check: must be owner or listed in conference_organizers
  if (!isOwner) {
    const { data: accessCheck } = await supabaseAdmin
      .from("conference_organizers")
      .select("role")
      .eq("conference_id", conferenceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!accessCheck) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  // Fetch organizers with basic profile info
  const { data: organizers, error } = await supabaseAdmin
    .from("conference_organizers")
    .select(
      `
      id,
      user_id,
      role,
      created_at,
      profiles!inner ( name, email )
    `
    )
    .eq("conference_id", conferenceId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with organization names via organization_members
  const enriched = await Promise.all(
    (organizers || []).map(async (org: any) => {
      const orgName = await getUserOrgName(org.user_id);
      return { ...org, organization_name: orgName };
    })
  );

  return NextResponse.json({ organizers: enriched, isOwner });
}

/* ------------------------------------------------------------------ */
/*  POST /api/organizer/co-organizers                                  */
/*  Body: { conferenceId, email }                                      */
/*  Adds a user as co-organizer by email lookup.                       */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { conferenceId, email: rawEmail } = body;

  if (!conferenceId || !rawEmail) {
    return NextResponse.json(
      { error: "conferenceId and email are required" },
      { status: 400 }
    );
  }

  const email = String(rawEmail).trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Please enter a valid email address" },
      { status: 400 }
    );
  }

  const user = await authenticateUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the user is the conference owner
  const conf = await getConference(conferenceId);
  if (!conf) {
    return NextResponse.json(
      { error: "Conference not found" },
      { status: 404 }
    );
  }

  if (conf.organizer_id !== user.id) {
    return NextResponse.json(
      { error: "Only the conference owner can add co-organizers" },
      { status: 403 }
    );
  }

  // Look up the target user by email
  const { data: targetProfile } = await supabaseAdmin
    .from("profiles")
    .select("id, name, email")
    .eq("email", email)
    .maybeSingle();

  if (!targetProfile) {
    return NextResponse.json(
      {
        error:
          "No user found with this email. They must have an Confairo account first.",
      },
      { status: 404 }
    );
  }

  // Organization constraint: user must belong to an organization
  const hasOrg = await userBelongsToOrg(targetProfile.id);
  if (!hasOrg) {
    return NextResponse.json(
      {
        error:
          "User must belong to an organization to be added as a co-organizer.",
      },
      { status: 422 }
    );
  }

  // Prevent adding self
  if (targetProfile.id === user.id) {
    return NextResponse.json(
      { error: "You are already the owner of this conference" },
      { status: 400 }
    );
  }

  // Check if already added
  const { data: existing } = await supabaseAdmin
    .from("conference_organizers")
    .select("id")
    .eq("conference_id", conferenceId)
    .eq("user_id", targetProfile.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "This user is already a co-organizer for this conference" },
      { status: 409 }
    );
  }

  // Insert
  const { error: insertError } = await supabaseAdmin
    .from("conference_organizers")
    .insert({
      conference_id: conferenceId,
      user_id: targetProfile.id,
      role: "organizer",
    });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Send notification email (non-blocking)
  const { data: adderProfile } = await supabaseAdmin
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  sendCoOrganizerEmail({
    toEmail: targetProfile.email || email,
    toName: targetProfile.name,
    conferenceTitle: conf?.title || "Conference",
    conferenceId,
    addedByName: adderProfile?.name || null,
  }).catch((err) => console.error("[Co-Organizer Email] Error:", err));

  return NextResponse.json({
    message: `${targetProfile.name || targetProfile.email} added as co-organizer and notified via email`,
  });
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/organizer/co-organizers                                */
/*  Body: { conferenceId, userId }                                     */
/*  Removes a co-organizer (owner-only).                               */
/* ------------------------------------------------------------------ */

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { conferenceId, userId } = body;

  if (!conferenceId || !userId) {
    return NextResponse.json(
      { error: "conferenceId and userId are required" },
      { status: 400 }
    );
  }

  const user = await authenticateUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the user is the conference owner
  const conf = await getConference(conferenceId);
  if (!conf) {
    return NextResponse.json(
      { error: "Conference not found" },
      { status: 404 }
    );
  }

  if (conf.organizer_id !== user.id) {
    return NextResponse.json(
      { error: "Only the conference owner can remove co-organizers" },
      { status: 403 }
    );
  }

  // Prevent removing the owner
  if (userId === user.id) {
    return NextResponse.json(
      { error: "Cannot remove the conference owner" },
      { status: 400 }
    );
  }

  // Delete
  const { error: deleteError } = await supabaseAdmin
    .from("conference_organizers")
    .delete()
    .eq("conference_id", conferenceId)
    .eq("user_id", userId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Co-organizer removed" });
}
