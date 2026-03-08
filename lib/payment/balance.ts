/**
 * AcadFlow — Organizer Financial Ledger
 *
 * Append-only, double-entry inspired ledger.
 * Balance is always derived from ledger entries.
 * The `balance_after` column is a running snapshot for fast reads.
 *
 * Exports:
 *   - getOrganizerBalance()        → current balance from last ledger entry
 *   - getOrganizerBalanceSummary() → full summary for dashboard cards
 *   - addLedgerCredit()            → append a credit entry
 *   - addLedgerDebit()             → append a debit entry (rejects if balance goes negative)
 */

import { SupabaseClient } from "@supabase/supabase-js";

// ── Types ───────────────────────────────────────────────────────────

export type LedgerEntryType =
    | "payment_credit"
    | "manual_payout"
    | "refund"
    | "adjustment";

export interface LedgerEntry {
    organizerId: string;
    amount: number;
    entryType: LedgerEntryType;
    paymentId?: string | null;
    description: string;
}

export interface BalanceSummary {
    totalEarned: number;
    totalWithdrawn: number;
    pendingPayout: number;
    availableBalance: number;
}

// ── Core: Get current balance ───────────────────────────────────────

/**
 * Get the current ledger balance for an organizer.
 * Reads `balance_after` from the most recent entry (O(1) via index).
 * Returns 0 if no entries exist.
 */
export async function getOrganizerBalance(
    supabase: SupabaseClient,
    organizerId: string
): Promise<number> {
    const { data } = await supabase
        .from("organizer_ledger")
        .select("balance_after")
        .eq("organizer_id", organizerId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    return data ? Number(data.balance_after) : 0;
}

// ── Credit: Add money to the organizer's balance ────────────────────

/**
 * Append a credit entry to the ledger.
 *
 * Used when: payment.captured, manual adjustment (credit)
 *
 * @returns The new balance after this credit
 */
export async function addLedgerCredit(
    supabase: SupabaseClient,
    entry: LedgerEntry
): Promise<number> {
    const { organizerId, amount, entryType, paymentId, description } = entry;

    if (amount <= 0) {
        throw new Error("Credit amount must be positive");
    }

    // Get current balance
    const currentBalance = await getOrganizerBalance(supabase, organizerId);
    const newBalance = Math.round((currentBalance + amount) * 100) / 100;

    const { error } = await supabase.from("organizer_ledger").insert({
        organizer_id: organizerId,
        payment_id: paymentId ?? null,
        entry_type: entryType,
        credit: amount,
        debit: 0,
        balance_after: newBalance,
        description,
    });

    if (error) {
        console.error("❌ Ledger credit insert failed:", error.message);
        throw new Error(`Ledger credit failed: ${error.message}`);
    }

    return newBalance;
}

// ── Debit: Remove money from the organizer's balance ────────────────

/**
 * Append a debit entry to the ledger.
 *
 * Used when: payout completed, refund, manual adjustment (debit)
 *
 * REJECTS if balance would go negative.
 *
 * @returns The new balance after this debit
 */
export async function addLedgerDebit(
    supabase: SupabaseClient,
    entry: LedgerEntry
): Promise<number> {
    const { organizerId, amount, entryType, paymentId, description } = entry;

    if (amount <= 0) {
        throw new Error("Debit amount must be positive");
    }

    // Get current balance
    const currentBalance = await getOrganizerBalance(supabase, organizerId);
    const newBalance = Math.round((currentBalance - amount) * 100) / 100;

    // ── Negative balance guard ──
    if (newBalance < 0) {
        throw new Error(
            `Insufficient balance. Current: ₹${currentBalance.toFixed(2)}, ` +
            `Requested: ₹${amount.toFixed(2)}`
        );
    }

    const { error } = await supabase.from("organizer_ledger").insert({
        organizer_id: organizerId,
        payment_id: paymentId ?? null,
        entry_type: entryType,
        credit: 0,
        debit: amount,
        balance_after: newBalance,
        description,
    });

    if (error) {
        console.error("❌ Ledger debit insert failed:", error.message);
        throw new Error(`Ledger debit failed: ${error.message}`);
    }

    return newBalance;
}

// ── Dashboard Summary ───────────────────────────────────────────────

/**
 * Get a full balance summary for the organizer dashboard.
 *
 * Reads from:
 *   - organizer_ledger (credits / debits)
 *   - organizer_payouts (pending payout amounts)
 */
export async function getOrganizerBalanceSummary(
    supabase: SupabaseClient,
    organizerId: string
): Promise<BalanceSummary> {
    // ── Total credits (earned) ──
    const { data: credits } = await supabase
        .from("organizer_ledger")
        .select("credit")
        .eq("organizer_id", organizerId)
        .gt("credit", 0);

    const totalEarned = (credits || []).reduce(
        (sum, e) => sum + Number(e.credit),
        0
    );

    // ── Total debits (withdrawn: payouts + refunds) ──
    const { data: debits } = await supabase
        .from("organizer_ledger")
        .select("debit")
        .eq("organizer_id", organizerId)
        .gt("debit", 0);

    const totalWithdrawn = (debits || []).reduce(
        (sum, e) => sum + Number(e.debit),
        0
    );

    // ── Pending payouts (not yet in ledger) ──
    const { data: pendingPayouts } = await supabase
        .from("organizer_payouts")
        .select("amount")
        .eq("organizer_id", organizerId)
        .in("status", ["pending", "processing"]);

    const pendingPayout = (pendingPayouts || []).reduce(
        (sum, p) => sum + Number(p.amount),
        0
    );

    // ── Available = ledger balance − pending payouts ──
    const ledgerBalance = Math.round((totalEarned - totalWithdrawn) * 100) / 100;
    const availableBalance = Math.round((ledgerBalance - pendingPayout) * 100) / 100;

    return {
        totalEarned: Math.round(totalEarned * 100) / 100,
        totalWithdrawn: Math.round(totalWithdrawn * 100) / 100,
        pendingPayout: Math.round(pendingPayout * 100) / 100,
        availableBalance,
    };
}
