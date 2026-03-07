/* ================================================================
   AcadFlow — Centralized Pricing Config
   Single source of truth for plan prices and limits.
   ================================================================ */

export type PlanType = "free" | "pro" | "enterprise";

/** Price in INR */
export const PRO_CONFERENCE_PRICE = 1999;

/** Plan limits — null means unlimited */
export const PLAN_LIMITS: Record<
    PlanType,
    { conferences: number | null; submissions: number | null }
> = {
    free: { conferences: 1, submissions: 150 },
    pro: { conferences: null, submissions: null },
    enterprise: { conferences: null, submissions: null },
};

/* ------------------------------------------------------------------ */
/*  Helper functions                                                    */
/* ------------------------------------------------------------------ */

/** Can the org create another conference? */
export function canCreateConference(
    planType: PlanType,
    currentCount: number
): boolean {
    const limit = PLAN_LIMITS[planType]?.conferences;
    if (limit === null || limit === undefined) return true; // unlimited
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
    enterprise: "Enterprise",
};
