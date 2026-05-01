/* ================================================================
   AcadFlow — Centralized Pricing Config
   Single source of truth for plan prices and limits.
   ================================================================ */

export type PlanType = "free" | "pro" | "institutional";

/** Price in INR for one conference slot (Pro plan) */
export const PRO_SLOT_PRICE = 2999;

/** @deprecated Use PRO_SLOT_PRICE instead. Kept for backward compatibility. */
export const EARLY_ADOPTER_SLOT_PRICE = PRO_SLOT_PRICE;

/**
 * Plan limits — null means unlimited.
 * pro conferences are "slot_based" (driven by conference_slots column).
 */
export const PLAN_LIMITS: Record<
    PlanType,
    {
        conferences: number | "slot_based" | null;
        submissions: number | null;
    }
> = {
    free: { conferences: 1, submissions: 150 },
    pro: { conferences: "slot_based", submissions: null },
    institutional: { conferences: null, submissions: null },
};

/* ------------------------------------------------------------------ */
/*  Backward Compatibility                                              */
/* ------------------------------------------------------------------ */

/** Maps legacy plan names (stored in DB before migration) to current ones. */
export const LEGACY_PLAN_MAP: Record<string, PlanType> = {
    early_adopter: "pro",
    enterprise: "institutional",
};

/**
 * Normalize a plan type string, mapping legacy values to current ones.
 * Safe to call with any string — unknown values fall back to "free".
 */
export function normalizePlanType(raw?: string | null): PlanType {
    if (!raw) return "free";
    if (raw in LEGACY_PLAN_MAP) return LEGACY_PLAN_MAP[raw];
    if (raw === "free" || raw === "pro" || raw === "institutional") return raw;
    return "free";
}

/* ------------------------------------------------------------------ */
/*  Helper functions                                                    */
/* ------------------------------------------------------------------ */

/**
 * Can the org create another conference?
 *
 * @param planType       — current plan
 * @param currentCount   — conferences already created
 * @param conferenceSlots — from organizations.conference_slots (used for pro)
 */
export function canCreateConference(
    planType: PlanType,
    currentCount: number,
    conferenceSlots?: number
): boolean {
    const limit = PLAN_LIMITS[planType]?.conferences;

    // Unlimited
    if (limit === null || limit === undefined) return true;

    // Slot-based (pro): compare against conference_slots
    if (limit === "slot_based") {
        const slots = conferenceSlots ?? 0;
        return currentCount < slots;
    }

    // Fixed limit (free)
    return currentCount < limit;
}

/** Can this conference accept another paper submission? */
export function canSubmitPaper(
    planType: PlanType,
    conferenceSubmissionCount: number
): boolean {
    const limit = PLAN_LIMITS[planType]?.submissions;
    if (limit === null || limit === undefined) return true; // unlimited
    return conferenceSubmissionCount < limit;
}

/** Format a limit for display — returns "Unlimited" when null */
export function formatLimit(limit: number | null): string {
    return limit === null ? "Unlimited" : String(limit);
}

/** Plan display labels */
export const PLAN_LABELS: Record<PlanType, string> = {
    free: "Free",
    pro: "Pro",
    institutional: "Institutional",
};

/* ------------------------------------------------------------------ */
/*  AI Credit Add-on Packs                                              */
/* ------------------------------------------------------------------ */

export interface AICreditPack {
    id: string;
    credits: number;
    /** Price in INR */
    price: number;
    label: string;
}

export const AI_CREDIT_PACKS: AICreditPack[] = [
    { id: "ai_50", credits: 50, price: 299, label: "50 AI Credits" },
    { id: "ai_100", credits: 100, price: 499, label: "100 AI Credits" },
];

/** Look up a credit pack by ID. Returns undefined if invalid. */
export function getAICreditPack(packId: string): AICreditPack | undefined {
    return AI_CREDIT_PACKS.find((p) => p.id === packId);
}
