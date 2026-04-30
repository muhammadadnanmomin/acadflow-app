import { NextResponse } from "next/server";
import { createServerSupabaseClient, supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
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

        console.log("📨 Accept invite request — user:", user.id, "token:", token);

        // 1. Get valid invite (use admin client to bypass RLS)
        const { data: invite, error: inviteError } = await supabaseServer
            .from("reviewer_invites")
            .select("id, conference_id, accepted, expires_at")
            .eq("token", token)
            .single();

        if (inviteError || !invite) {
            console.error("❌ Invite lookup failed:", inviteError);
            return NextResponse.json(
                { error: "Invite not found" },
                { status: 400 }
            );
        }

        if (invite.accepted) {
            return NextResponse.json(
                { error: "Invite already accepted" },
                { status: 409 }
            );
        }

        if (new Date(invite.expires_at) < new Date()) {
            return NextResponse.json(
                { error: "Invite has expired" },
                { status: 400 }
            );
        }

        // 2. Register reviewer (use admin client to bypass RLS)
        const { error: regError } = await supabaseServer
            .from("conference_staff")
            .insert({
                user_id: user.id,
                conference_id: invite.conference_id,
                role: "reviewer",
            });

        // Ignore duplicate key error (user already registered)
        if (regError && regError.code !== "23505") {
            console.error("❌ Reviewer registration failed:", regError);
            return NextResponse.json(
                { error: "Reviewer registration failed" },
                { status: 500 }
            );
        }

        // 3. Mark invite accepted (use admin client to bypass RLS)
        const { error: updateError } = await supabaseServer
            .from("reviewer_invites")
            .update({ accepted: true })
            .eq("id", invite.id);

        if (updateError) {
            console.error("❌ Failed to mark invite accepted:", updateError);
            // Non-fatal: registration already succeeded
        }

        console.log("✅ Invite accepted successfully for user:", user.id);
        return NextResponse.json({ success: true });

    } catch (err) {
        console.error("🔥 Unhandled error in /api/reviewer/accept:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
