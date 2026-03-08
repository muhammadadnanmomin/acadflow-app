import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getOrganizerBalanceSummary } from "@/lib/payment/balance";

/**
 * GET /api/payouts/organizer
 *
 * Returns the authenticated organizer's balance summary + payout history.
 * Auth: Bearer token in Authorization header.
 */
export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.replace("Bearer ", "");
        const {
            data: { user },
            error: authError,
        } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Compute balance from ledger
        const balance = await getOrganizerBalanceSummary(supabaseAdmin, user.id);

        // Fetch payout history
        const { data: payouts } = await supabaseAdmin
            .from("organizer_payouts")
            .select("id, amount, status, notes, admin_notes, created_at, processed_at")
            .eq("organizer_id", user.id)
            .order("created_at", { ascending: false });

        return NextResponse.json({
            balance,
            payouts: payouts || [],
        });
    } catch (err) {
        console.error("Payout GET error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
