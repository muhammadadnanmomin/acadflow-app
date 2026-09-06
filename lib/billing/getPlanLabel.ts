/* ================================================================
   Confairo — Plan Label Helper
   Single source of truth for plan display names.
   ================================================================ */

const PLAN_LABEL_MAP: Record<string, string> = {
    free: "Free",
    pro: "Pro",
    institutional: "Institutional",
    // Legacy fallbacks (backward compatibility)
    early_adopter: "Pro",
    enterprise: "Institutional",
};

/**
 * Returns a human-readable label for a plan type.
 * Falls back to "Free" for unknown / null values.
 */
export function getPlanLabel(planType?: string | null): string {
    if (!planType) return "Free";
    return PLAN_LABEL_MAP[planType] ?? "Free";
}
