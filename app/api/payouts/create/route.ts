import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getOrganizerBalanceSummary } from "@/lib/payment/balance";

/**
 * POST /api/payouts/create
 *
 * Organizer requests a payout withdrawal.
 *
 * Body: { amount: number, notes?: string }
 * Auth: Bearer token in Authorization header.
 *
 * Validates:
 *   - amount > 0
 *   - amount ≤ available balance
 *   - organizer has bank details on file
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

        const body = await req.json();
        const amount = Number(body.amount);
        const notes = body.notes?.trim() || null;

        // ── Validate amount ──
        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: "Amount must be greater than 0" },
                { status: 400 }
            );
        }

        // ── Check bank details exist ──
        const { data: bank } = await supabaseAdmin
            .from("organizer_bank_accounts")
            .select("id")
            .eq("organizer_id", user.id)
            .maybeSingle();

        if (!bank) {
            return NextResponse.json(
                { error: "Please add your bank details before requesting a payout" },
                { status: 400 }
            );
        }

        // ── Check available balance ──
        const balance = await getOrganizerBalanceSummary(supabaseAdmin, user.id);

        if (amount > balance.availableBalance) {
            return NextResponse.json(
                {
                    error: `Insufficient balance. Available: ₹${balance.availableBalance.toFixed(2)}`,
                },
                { status: 400 }
            );
        }

        // ── Create payout request ──
        const { data: payout, error } = await supabaseAdmin
            .from("organizer_payouts")
            .insert({
                organizer_id: user.id,
                amount,
                status: "pending",
                notes,
            })
            .select("id")
            .single();

        if (error) {
            console.error("Payout create error:", error);
            return NextResponse.json(
                { error: "Failed to create payout request" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, id: payout.id });
    } catch (err) {
        console.error("Payout create error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
