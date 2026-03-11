import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { orderId, paymentId, signature, organizationId } = body;

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
            .select("plan_type, conference_slots")
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
            org.plan_type === "enterprise" ? "enterprise" : "early_adopter";

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

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("BILLING VERIFY ERROR:", err);
        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}
