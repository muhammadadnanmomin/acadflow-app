/**
 * Confairo — Fee Calculation Utility
 *
 * Shared, pure fee-calculation logic used by both client (UI preview)
 * and server (order creation / validation).
 *
 * Business rule:
 *   Organiser receives the exact conference fee they set.
 *   Confairo charges a flat platform processing fee on top.
 *   Payment gateway fees are absorbed by the processing fee.
 */

// ── Constants ───────────────────────────────────────────────────────
/** Platform processing fee charged on top of the conference fee */
export const PLATFORM_FEE_PERCENT = 4;

// ── Types ───────────────────────────────────────────────────────────
export interface FeeBreakdown {
    /** The base conference fee set by the organiser (₹) */
    conferenceFee: number;
    /** Platform processing fee = conferenceFee × PLATFORM_FEE_PERCENT (₹) */
    processingFee: number;
    /** Total the author pays = conferenceFee + processingFee (₹) */
    total: number;
    /** Total in paise for the Razorpay Orders API */
    razorpayAmountPaise: number;
}

// ── Core Calculator ─────────────────────────────────────────────────
/**
 * Calculate the full fee breakdown for a given conference fee.
 *
 * Rounding strategy:
 *   • `processingFee` → ceil to paise (0.01) to never under‑collect
 *   • `total`         → arithmetic sum (no further rounding)
 *   • `razorpayAmountPaise` → Math.round of total × 100
 *
 * @param conferenceFee  Base fee set by the organiser (₹, ≥ 0)
 */
export function calculateFeeBreakdown(conferenceFee: number): FeeBreakdown {
    if (conferenceFee <= 0) {
        return {
            conferenceFee: 0,
            processingFee: 0,
            total: 0,
            razorpayAmountPaise: 0,
        };
    }

    // Processing fee — ceil at paise level
    const processingFee =
        Math.ceil(conferenceFee * (PLATFORM_FEE_PERCENT / 100) * 100) / 100;

    const total = conferenceFee + processingFee;

    return {
        conferenceFee,
        processingFee,
        total,
        razorpayAmountPaise: Math.round(total * 100),
    };
}

/**
 * Format a number as Indian Rupees (₹1,234.56).
 * Returns the formatted string *without* the ₹ symbol.
 */
export function formatINR(amount: number): string {
    return amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
