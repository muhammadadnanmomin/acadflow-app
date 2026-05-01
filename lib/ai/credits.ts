// ============================================================
// AcadFlow AI Credit Management
// Validates and tracks AI usage per conference
// ============================================================
import { supabaseServer } from "@/lib/supabase/server";

export interface AIUsage {
  conference_id: string;
  used_credits: number;
  total_credits: number;
  plan_type: string;
  remaining: number;
}

export interface CreditCheckResult {
  allowed: boolean;
  usage: AIUsage | null;
  error?: string;
  message?: string;
}

/**
 * Fetch AI usage for a conference.
 * Auto-provisions a free-tier row if none exists (handles races).
 */
export async function getAIUsage(conferenceId: string): Promise<AIUsage | null> {
  try {
    const { data, error } = await supabaseServer
      .from("ai_usage")
      .select("conference_id, used_credits, total_credits, plan_type")
      .eq("conference_id", conferenceId)
      .single();

    if (error || !data) {
      // Auto-provision if row is missing (e.g. conference created before migration)
      const { data: provisioned, error: provErr } = await supabaseServer
        .from("ai_usage")
        .upsert(
          {
            conference_id: conferenceId,
            used_credits: 0,
            total_credits: 5,
            plan_type: "free",
          },
          { onConflict: "conference_id" }
        )
        .select("conference_id, used_credits, total_credits, plan_type")
        .single();

      if (provErr || !provisioned) {
        console.error("[ai/credits] Failed to provision ai_usage:", provErr);
        return null;
      }

      return {
        ...provisioned,
        remaining: provisioned.total_credits - provisioned.used_credits,
      };
    }

    return {
      ...data,
      remaining: data.total_credits - data.used_credits,
    };
  } catch (err) {
    console.error("[ai/credits] getAIUsage error:", err);
    return null;
  }
}

/**
 * Check if a conference has remaining AI credits.
 * Returns a structured result suitable for early-return in API routes.
 */
export async function checkAICredits(conferenceId: string): Promise<CreditCheckResult> {
  const usage = await getAIUsage(conferenceId);

  if (!usage) {
    // If we can't determine usage, fail open to avoid blocking users
    // due to transient DB errors. Log for monitoring.
    console.warn("[ai/credits] Could not fetch usage for conference:", conferenceId);
    return { allowed: true, usage: null };
  }

  if (usage.used_credits >= usage.total_credits) {
    return {
      allowed: false,
      usage,
      error: "AI_LIMIT_REACHED",
      message: `You have used all ${usage.total_credits} AI analyses. Upgrade your plan or purchase add-on credits.`,
    };
  }

  return { allowed: true, usage };
}

/**
 * Consume 1 AI credit for a conference. Uses a row-locked DB function
 * that prevents double-deduction and over-spending.
 *
 * Returns true if a credit was consumed, false if limit was hit or
 * the row was missing (race condition safeguard).
 *
 * Call this AFTER any successful analysis (AI or fallback).
 * Do NOT call on cache hits, errors, or validation failures.
 */
export async function consumeAICredit(conferenceId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseServer.rpc("increment_ai_usage", {
      p_conference_id: conferenceId,
    });

    if (error) {
      console.error("[ai/credits] Failed to increment usage:", error);
      return false;
    }

    // increment_ai_usage returns BOOLEAN — true if credit consumed
    const consumed = data === true;

    if (!consumed) {
      console.warn(
        `[ai/credits] Credit consumption blocked for conference ${conferenceId} (limit reached or row missing)`
      );
    }

    return consumed;
  } catch (err) {
    // Non-fatal: log but don't break the response
    console.error("[ai/credits] consumeAICredit exception:", err);
    return false;
  }
}

// ── Plan credit limits ────────────────────────────────────────
const PLAN_CREDITS: Record<string, number> = {
  free: 5,
  pro: 100,
  institutional: 100,
};

/**
 * Upgrade AI credits for all conferences belonging to an organization.
 * Sets total_credits to the new plan's limit and updates plan_type.
 * Does NOT reset used_credits — preserves existing usage.
 *
 * Example: used 3/5 on free → upgrade to pro → becomes 3/100.
 */
export async function upgradePlanCredits(
  organizationId: string,
  newPlanType: string
): Promise<void> {
  const newCredits = PLAN_CREDITS[newPlanType] ?? PLAN_CREDITS.free;

  try {
    // Find all conferences belonging to this organization
    const { data: conferences, error: fetchErr } = await supabaseServer
      .from("conferences")
      .select("id")
      .eq("organization_id", organizationId);

    if (fetchErr || !conferences?.length) {
      console.warn("[ai/credits] No conferences found for org:", organizationId);
      return;
    }

    const conferenceIds = conferences.map((c) => c.id);

    // Update ai_usage for all org conferences in one query
    const { error: updateErr } = await supabaseServer
      .from("ai_usage")
      .update({
        total_credits: newCredits,
        plan_type: newPlanType,
        updated_at: new Date().toISOString(),
      })
      .in("conference_id", conferenceIds);

    if (updateErr) {
      console.error("[ai/credits] Failed to upgrade plan credits:", updateErr);
      return;
    }

    console.log(
      `✅ AI credits upgraded: org ${organizationId} → ${newPlanType} (${newCredits} credits) for ${conferenceIds.length} conference(s)`
    );
  } catch (err) {
    console.error("[ai/credits] upgradePlanCredits error:", err);
  }
}

/**
 * Purchase add-on AI credits for a conference.
 * Records the purchase in ai_credit_purchases and increases total_credits.
 * Does NOT reset used_credits.
 */
export async function purchaseAICredits(
  conferenceId: string,
  creditsToAdd: number,
  amountPaid: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use the DB function which handles both insert + update atomically
    await supabaseServer.rpc("add_ai_credits", {
      p_conference_id: conferenceId,
      p_credits: creditsToAdd,
      p_amount: amountPaid,
    });

    console.log(
      `✅ AI credits purchased: conference ${conferenceId} +${creditsToAdd} credits (₹${amountPaid})`
    );

    return { success: true };
  } catch (err) {
    console.error("[ai/credits] purchaseAICredits error:", err);
    return { success: false, error: "Failed to add credits" };
  }
}
