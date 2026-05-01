import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendPaymentConfirmationEmail } from "@/lib/email/sendPaymentEmail";
import { PRO_SLOT_PRICE } from "@/lib/config/pricing";
import { upgradePlanCredits, purchaseAICredits } from "@/lib/ai/credits";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { orderId, paymentId, signature, organizationId, credits = 0, addOnPrice = 0 } = body;

        if (!orderId || !paymentId || !signature || !organizationId) {
            return NextResponse.json(
                { error: "Missing payment data" },
                { status: 400 }
            );
        }

        /* ---- Verify Razorpay signature ---- */
        const generated = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(orderId + "|" + paymentId)
            .digest("hex");

        if (generated !== signature) {
            console.error("❌ Billing signature mismatch");
            return NextResponse.json(
                { error: "Invalid payment signature" },
                { status: 400 }
            );
        }

        /* ---- Fetch current org data ---- */
        const { data: org, error: orgError } = await supabaseAdmin
            .from("organizations")
            .select("plan_type, conference_slots, name")
            .eq("id", organizationId)
            .single();

        if (orgError || !org) {
            console.error("DB ERROR:", orgError);
            return NextResponse.json(
                { error: "Organization not found" },
                { status: 404 }
            );
        }

        /* ---- Increment conference_slots and upgrade plan ---- */
        const currentSlots = org.conference_slots ?? 1;
        const newPlanType =
            org.plan_type === "institutional" ? "institutional" : "pro";

        const { error } = await supabaseAdmin
            .from("organizations")
            .update({
                plan_type: newPlanType,
                conference_slots: currentSlots + 1,
                payment_id: paymentId,
            })
            .eq("id", organizationId);

        if (error) {
            console.error("DB ERROR:", error);
            return NextResponse.json(
                { error: "Failed to upgrade plan" },
                { status: 500 }
            );
        }

        console.log(
            `✅ Organization ${organizationId} — conference slot purchased (${currentSlots} → ${currentSlots + 1})`
        );

        /* ---- Upgrade AI credits for all org conferences ---- */
        // Non-blocking: don't fail the payment flow if this errors
        upgradePlanCredits(organizationId, newPlanType).catch(() => {});

        /* ---- Record the purchase for billing history ---- */
        const bundledCredits = Number(credits) || 0;
        const bundledAddOnPrice = Number(addOnPrice) || 0;
        const totalPaid = PRO_SLOT_PRICE + bundledAddOnPrice;
        const description = bundledCredits > 0
            ? `Pro Plan + ${bundledCredits} AI Credits`
            : "Pro Plan + 100 AI Analyses";

        await supabaseAdmin.from("organizer_slot_purchases").insert({
            organization_id: organizationId,
            payment_id: paymentId,
            order_id: orderId,
            amount: totalPaid,
            description,
        });

        /* ---- Add bundled AI credits (if any) ---- */
        if (bundledCredits > 0) {
            // Find the first conference for this org to add credits to
            const { data: confs } = await supabaseAdmin
                .from("conferences")
                .select("id")
                .eq("organization_id", organizationId)
                .order("created_at", { ascending: false })
                .limit(1);

            if (confs && confs.length > 0) {
                purchaseAICredits(
                    confs[0].id,
                    bundledCredits,
                    bundledAddOnPrice
                ).catch((err) =>
                    console.error("Failed to add bundled AI credits:", err)
                );
            }
        }

        /* ---- Send confirmation email (non-blocking) ---- */
        // Find the organizer's email via organization_members
        const { data: member } = await supabaseAdmin
            .from("organization_members")
            .select("user_id")
            .eq("organization_id", organizationId)
            .eq("role", "owner")
            .maybeSingle();

        if (member?.user_id) {
            const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("email, name")
                .eq("id", member.user_id)
                .maybeSingle();

            if (profile?.email) {
                // Fire-and-forget — don't block the response
                sendPaymentConfirmationEmail({
                    to: profile.email,
                    name: profile.name || org.name || "Organizer",
                    paymentId,
                    orderId,
                    amount: totalPaid,
                    description,
                    paidAt: new Date().toISOString(),
                }).catch(() => {});
            }
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("BILLING VERIFY ERROR:", err);
        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}

