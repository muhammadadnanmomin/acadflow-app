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

        /* ---- Upgrade org to Pro ---- */
        const { error } = await supabaseAdmin
            .from("organizations")
            .update({
                plan_type: "pro",
                conference_limit: null, // null = unlimited
                submission_limit: null, // null = unlimited
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

        console.log(`✅ Organization ${organizationId} upgraded to Pro`);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("BILLING VERIFY ERROR:", err);
        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}
