import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    const supabase = await createServerSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const { token } = await req.json();

    if (!token) {
        return NextResponse.json(
            { error: "Invalid token" },
            { status: 400 }
        );
    }

    // 1. Get valid invite
    const { data: invite, error: inviteError } = await supabase
        .from("reviewer_invites")
        .select("id, conference_id, accepted, expires_at")
        .eq("token", token)
        .single();

    if (
        inviteError ||
        !invite ||
        invite.accepted ||
        new Date(invite.expires_at) < new Date()
    ) {
        return NextResponse.json(
            { error: "Invite expired or invalid" },
            { status: 400 }
        );
    }

    // 2. Mark invite accepted
    const { error: updateError } = await supabase
        .from("reviewer_invites")
        .update({ accepted: true })
        .eq("id", invite.id);

    if (updateError) {
        return NextResponse.json(
            { error: "Failed to accept invite" },
            { status: 500 }
        );
    }

    // 3. Register reviewer (NO PAYMENT)
    const { error: regError } = await supabase
        .from("conference_staff")
        .insert({
            user_id: user.id,
            conference_id: invite.conference_id,
            role: "reviewer",
        });

    if (regError) {
        return NextResponse.json(
            { error: "Reviewer registration failed" },
            { status: 500 }
        );
    }

    return NextResponse.json({ success: true });
}
