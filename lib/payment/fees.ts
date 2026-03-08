/**
 * AcadFlow — Fee Calculation Utility
 *
 * Shared, pure fee-calculation logic used by both client (UI preview)
 * and server (order creation / validation).
 *
 * Business rule:
 *   Organiser receives the exact conference fee they set.
 *   Razorpay gateway fee + GST on that fee are transparently passed to the author.
 */

// ── Constants ───────────────────────────────────────────────────────
/** Razorpay standard domestic rate (cards / UPI) */
export const RAZORPAY_FEE_PERCENT = 2;

/** GST charged by Razorpay on the gateway service fee */
export const GST_ON_GATEWAY_PERCENT = 18;

// ── Types ───────────────────────────────────────────────────────────
export interface FeeBreakdown {
    /** The base conference fee set by the organiser (₹) */
    conferenceFee: number;
    /** Razorpay gateway fee = conferenceFee × RAZORPAY_FEE_PERCENT (₹) */
    gatewayFee: number;
    /** GST on the gateway fee = gatewayFee × GST_ON_GATEWAY_PERCENT (₹) */
    gstOnGateway: number;
    /** Total the author pays = conferenceFee + gatewayFee + gstOnGateway (₹) */
    totalPayable: number;
    /** Total in paise for the Razorpay Orders API */
    razorpayAmountPaise: number;
}

// ── Core Calculator ─────────────────────────────────────────────────
/**
 * Calculate the full fee breakdown for a given conference fee.
 *
 * Rounding strategy:
 *   • `gatewayFee`   → ceil to paise (0.01) to never under‑collect
 *   • `gstOnGateway` → ceil to paise
 *   • `totalPayable`   arithmetic sum (no further rounding)
 *   • `razorpayAmountPaise` → Math.round of totalPayable × 100
 *
 * @param conferenceFee  Base fee set by the organiser (₹, ≥ 0)
 */
export function calculateFeeBreakdown(conferenceFee: number): FeeBreakdown {
    if (conferenceFee <= 0) {
        return {
            conferenceFee: 0,
            gatewayFee: 0,
            gstOnGateway: 0,
            totalPayable: 0,
            razorpayAmountPaise: 0,
        };
    }

    // Gateway fee — ceil at paise level
    const gatewayFee =
        Math.ceil(conferenceFee * (RAZORPAY_FEE_PERCENT / 100) * 100) / 100;

    // GST on gateway — ceil at paise level
    const gstOnGateway =
        Math.ceil(gatewayFee * (GST_ON_GATEWAY_PERCENT / 100) * 100) / 100;

    const totalPayable = conferenceFee + gatewayFee + gstOnGateway;

    return {
        conferenceFee,
        gatewayFee,
        gstOnGateway,
        totalPayable,
        razorpayAmountPaise: Math.round(totalPayable * 100),
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
