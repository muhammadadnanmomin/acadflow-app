"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/auth/useProfile";
import { useOrganization } from "@/lib/organizations/useOrganization";
import {
    type PlanType,
    PLAN_LIMITS,
    canCreateConference,
    canSubmitPaper,
    formatLimit,
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
            const planType: PlanType = organization.plan_type || "free";
            const conferenceSlots: number = organization.conference_slots ?? 1;

            /* Resolve the effective conference limit for display */
            const planConf = PLAN_LIMITS[planType]?.conferences;
            let confLimit: number | null;
            if (planConf === null) {
                confLimit = null; // unlimited (enterprise)
            } else if (planConf === "slot_based") {
                confLimit = conferenceSlots; // early_adopter
            } else {
                confLimit = planConf; // free (fixed number)
            }

            /* Resolve submission limit */
            const subLimit: number | null = PLAN_LIMITS[planType]?.submissions ?? 150;

            /* ---- Conference count ---- */
            const { count: confCount } = await supabase
                .from("conferences")
                .select("*", { count: "exact", head: true })
                .or(
                    `organizer_id.eq.${profile!.id},organization_id.eq.${organization.id}`
                );

            const conferencesUsed = confCount || 0;

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
                const { data: conferences } = await supabase
                    .from("conferences")
                    .select("id")
                    .or(
                        `organizer_id.eq.${profile!.id},organization_id.eq.${organization.id}`
                    );

                if (conferences && conferences.length > 0) {
                    const ids = conferences.map((c: any) => c.id);
                    const { count } = await supabase
                        .from("paper_submissions")
                        .select("*", { count: "exact", head: true })
                        .in("conference_id", ids);
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
