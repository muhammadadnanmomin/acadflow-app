/* ================================================================
   AcadFlow — Centralized Pricing Config
   Single source of truth for plan prices and limits.
   ================================================================ */

export type PlanType = "free" | "early_adopter" | "enterprise";

/** Price in INR for one conference slot (Early Adopter plan) */
export const EARLY_ADOPTER_SLOT_PRICE = 1999;

/**
 * Plan limits — null means unlimited.
 * early_adopter conferences are "slot_based" (driven by conference_slots column).
 */
export const PLAN_LIMITS: Record<
    PlanType,
    {
        conferences: number | "slot_based" | null;
        submissions: number | null;
    }
> = {
    free: { conferences: 1, submissions: 150 },
    early_adopter: { conferences: "slot_based", submissions: null },
    enterprise: { conferences: null, submissions: null },
};

/* ------------------------------------------------------------------ */
/*  Helper functions                                                    */
/* ------------------------------------------------------------------ */

/**
 * Can the org create another conference?
 *
 * @param planType       — current plan
 * @param currentCount   — conferences already created
 * @param conferenceSlots — from organizations.conference_slots (used for early_adopter)
 */
export function canCreateConference(
    planType: PlanType,
    currentCount: number,
    conferenceSlots?: number
): boolean {
    const limit = PLAN_LIMITS[planType]?.conferences;

    // Unlimited
    if (limit === null || limit === undefined) return true;

    // Slot-based (early_adopter): compare against conference_slots
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
    early_adopter: "Early Adopter",
    enterprise: "Enterprise",
};
