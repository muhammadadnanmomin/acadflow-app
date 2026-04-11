"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";
import { useOrganization } from "@/lib/organizations/useOrganization";
import { getMyConferenceIds } from "@/lib/conference/getMyConferenceIds";
import {
    type PlanType,
    PLAN_LIMITS,
    canCreateConference,
    canSubmitPaper,
    formatLimit,
    normalizePlanType,
} from "@/lib/config/pricing";

const supabase = createClient();

export interface PlanInfo {
    /** Current plan type */
    planType: PlanType;

    /** Number of conferences the org has created */
    conferencesUsed: number;
    /** Resolved conference limit for display (null = unlimited) */
    conferenceLimit: number | null;
    /** Raw conference_slots value from the organization */
    conferenceSlots: number;

    /**
     * Per-conference submission count.
     * When conferenceId is provided, this is the count for that conference.
     * When not provided, this is the total across all org conferences.
     */
    submissionsUsed: number;
    /** Submission limit from PLAN_LIMITS (null = unlimited) */
    submissionLimit: number | null;

    /** Convenience booleans */
    canCreateConference: boolean;
    canSubmitPaper: boolean;

    loading: boolean;
}

/**
 * Hook to fetch the current org's plan and usage.
 * @param conferenceId — optional. When provided, submissionsUsed
 *   is scoped to that single conference (per-conference enforcement).
 */
export function usePlan(conferenceId?: string): PlanInfo {
    const { profile } = useProfile();
    const { organization } = useOrganization();

    const [info, setInfo] = useState<PlanInfo>({
        planType: "free",
        conferencesUsed: 0,
        conferenceLimit: 1,
        conferenceSlots: 1,
        submissionsUsed: 0,
        submissionLimit: 150,
        canCreateConference: true,
        canSubmitPaper: true,
        loading: true,
    });

    useEffect(() => {
        if (!profile || !organization) {
            setInfo((prev) => ({ ...prev, loading: !profile }));
            return;
        }

        async function load() {
            /* ---- Plan fields from org ---- */
            const planType: PlanType = normalizePlanType(organization.plan_type);
            const conferenceSlots: number = organization.conference_slots ?? 1;

            /* Resolve the effective conference limit for display */
            const planConf = PLAN_LIMITS[planType]?.conferences;
            let confLimit: number | null;
            if (planConf === null) {
                confLimit = null; // unlimited (institutional)
            } else if (planConf === "slot_based") {
                confLimit = conferenceSlots; // pro
            } else {
                confLimit = planConf; // free (fixed number)
            }

            /* Resolve submission limit */
            const subLimit: number | null = PLAN_LIMITS[planType]?.submissions ?? 150;

            /* ---- Conference count ---- */
            const myIds = await getMyConferenceIds(profile!.id, organization?.id);
            const conferencesUsed = myIds.length;

            /* ---- Submission count ---- */
            let submissionsUsed = 0;

            if (conferenceId) {
                // Per-conference count
                const { count } = await supabase
                    .from("paper_submissions")
                    .select("*", { count: "exact", head: true })
                    .eq("conference_id", conferenceId);
                submissionsUsed = count || 0;
            } else {
                // Total across all org conferences (for dashboard display)
                if (myIds.length > 0) {
                    const { count } = await supabase
                        .from("paper_submissions")
                        .select("*", { count: "exact", head: true })
                        .in("conference_id", myIds);
                    submissionsUsed = count || 0;
                }
            }

            setInfo({
                planType,
                conferencesUsed,
                conferenceLimit: confLimit,
                conferenceSlots,
                submissionsUsed,
                submissionLimit: subLimit,
                canCreateConference: canCreateConference(planType, conferencesUsed, conferenceSlots),
                canSubmitPaper: canSubmitPaper(planType, submissionsUsed),
                loading: false,
            });
        }

        load();
    }, [profile, organization, conferenceId]);

    return info;
}
