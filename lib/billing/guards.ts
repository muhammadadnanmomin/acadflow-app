/* ================================================================
   AcadFlow — Server-side Plan Enforcement Guards
   Used in API routes to ensure plan limits are respected.
   Never rely on frontend checks alone.
   ================================================================ */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { type PlanType, PLAN_LIMITS, canCreateConference, canSubmitPaper, normalizePlanType } from "@/lib/config/pricing";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GuardResult {
    allowed: boolean;
    reason?: string;
    upgradeRequired?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Conference Creation Guard                                          */
/* ------------------------------------------------------------------ */

/**
 * Check whether an organization can create another conference.
 * Call this from API routes before inserting into `conferences`.
 */
export async function checkConferenceLimit(
    organizationId: string
): Promise<GuardResult> {
    // 1. Fetch organization plan info
    const { data: org, error: orgError } = await supabaseAdmin
        .from("organizations")
        .select("plan_type, conference_slots")
        .eq("id", organizationId)
        .single();

    if (orgError || !org) {
        return { allowed: false, reason: "Organization not found" };
    }

    const planType: PlanType = normalizePlanType(org.plan_type);

    // Institutional — always allowed
    if (planType === "institutional") {
        return { allowed: true };
    }

    // 2. Count existing conferences for this org
    const { count, error: countError } = await supabaseAdmin
        .from("conferences")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId);

    if (countError) {
        return { allowed: false, reason: "Failed to count conferences" };
    }

    const currentCount = count || 0;
    const conferenceSlots = org.conference_slots || 1;

    // 3. Check limit
    const allowed = canCreateConference(planType, currentCount, conferenceSlots);

    if (!allowed) {
        const limitLabel =
            planType === "free"
                ? "1 conference on the Free plan"
                : `${conferenceSlots} conference slot${conferenceSlots !== 1 ? "s" : ""}`;

        return {
            allowed: false,
            reason: `Conference limit reached. You have used all ${limitLabel}. Purchase another conference slot to continue.`,
            upgradeRequired: true,
        };
    }

    return { allowed: true };
}

/* ------------------------------------------------------------------ */
/*  Submission Limit Guard                                             */
/* ------------------------------------------------------------------ */

/**
 * Check whether a conference can accept another paper submission.
 * Call this from API routes / submission handlers.
 */
export async function checkSubmissionLimit(
    conferenceId: string
): Promise<GuardResult> {
    // 1. Find the conference's organization and plan
    const { data: conference, error: confError } = await supabaseAdmin
        .from("conferences")
        .select("organization_id")
        .eq("id", conferenceId)
        .single();

    if (confError || !conference) {
        return { allowed: false, reason: "Conference not found" };
    }

    const { data: org, error: orgError } = await supabaseAdmin
        .from("organizations")
        .select("plan_type")
        .eq("id", conference.organization_id)
        .single();

    if (orgError || !org) {
        return { allowed: false, reason: "Organization not found" };
    }

    const planType: PlanType = normalizePlanType(org.plan_type);

    // Check if there is a submission limit for this plan
    const subLimit = PLAN_LIMITS[planType]?.submissions;
    if (subLimit === null || subLimit === undefined) {
        return { allowed: true }; // unlimited
    }

    // 2. Count current submissions for this conference
    const { count, error: countError } = await supabaseAdmin
        .from("paper_submissions")
        .select("*", { count: "exact", head: true })
        .eq("conference_id", conferenceId);

    if (countError) {
        return { allowed: false, reason: "Failed to count submissions" };
    }

    const currentCount = count || 0;
    const allowed = canSubmitPaper(planType, currentCount);

    if (!allowed) {
        return {
            allowed: false,
            reason: `Submission limit reached for free plan. Maximum ${subLimit} submissions allowed per conference.`,
            upgradeRequired: true,
        };
    }

    return { allowed: true };
}
