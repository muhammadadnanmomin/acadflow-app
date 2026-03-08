import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { addLedgerDebit } from "@/lib/payment/balance";

/**
 * POST /api/payouts/process
 *
 * Admin processes a payout request (mark as processing/completed/failed).
 *
 * Body: { payoutId: string, status: string, adminNotes?: string }
 * Auth: Bearer token in Authorization header (admin only).
 */
export async function POST(req: Request) {
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

        // ── Admin role check ──
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "admin") {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { payoutId, status, adminNotes } = body;

        if (!payoutId || !status) {
            return NextResponse.json(
                { error: "Missing payoutId or status" },
                { status: 400 }
            );
        }

        const validStatuses = ["processing", "completed", "failed"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
                { status: 400 }
            );
        }

        // ── Prevent processing already-completed payouts ──
        const { data: existing } = await supabaseAdmin
            .from("organizer_payouts")
            .select("status")
            .eq("id", payoutId)
            .single();

        if (!existing) {
            return NextResponse.json(
                { error: "Payout not found" },
                { status: 404 }
            );
        }

        if (existing.status === "completed") {
            return NextResponse.json(
                { error: "Payout already completed" },
                { status: 409 }
            );
        }

        // ── Update payout ──
        const updateData: Record<string, any> = {
            status,
            admin_notes: adminNotes?.trim() || null,
            processed_by: user.id,
        };

        // Set processed_at only when completed or failed
        if (status === "completed" || status === "failed") {
            updateData.processed_at = new Date().toISOString();
        }

        const { error } = await supabaseAdmin
            .from("organizer_payouts")
            .update(updateData)
            .eq("id", payoutId);

        if (error) {
            console.error("Payout process error:", error);
            return NextResponse.json(
                { error: "Failed to update payout" },
                { status: 500 }
            );
        }

        // ── Ledger: Debit when payout is completed ──
        if (status === "completed") {
            // Fetch the payout to get organizer_id and amount
            const { data: payout } = await supabaseAdmin
                .from("organizer_payouts")
                .select("organizer_id, amount")
                .eq("id", payoutId)
                .single();

            if (payout) {
                try {
                    await addLedgerDebit(supabaseAdmin, {
                        organizerId: payout.organizer_id,
                        amount: Number(payout.amount),
                        entryType: "manual_payout",
                        description: "Manual payout withdrawal",
                    });
                } catch (err) {
                    console.error("⚠️ Ledger payout debit failed (non-blocking):", err);
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Payout process error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
