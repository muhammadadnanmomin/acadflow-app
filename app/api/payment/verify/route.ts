import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
    try {
        console.log("✅ VERIFY API HIT");

        const body = await req.json();
        const { orderId, paymentId, signature, submissionId } = body;

        if (!orderId || !paymentId || !signature || !submissionId) {
            return NextResponse.json(
                { error: "Missing payment data" },
                { status: 400 }
            );
        }

        const generated = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(orderId + "|" + paymentId)
            .digest("hex");

        if (generated !== signature) {
            console.error("❌ Signature mismatch");
            return NextResponse.json({ error: "Invalid payment" }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from("paper_submissions")
            .update({
                payment_status: "paid",
                presentation_payment_id: paymentId,
            })
            .eq("id", submissionId);

        if (error) {
            console.error("DB ERROR:", error);
            return NextResponse.json({ error: "DB update failed" }, { status: 500 });
        }

        console.log("✅ Payment verified & DB updated");

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("VERIFY ERROR:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}