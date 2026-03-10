import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            orderId,
            paymentId,
            signature,
            submissionId,
            registrationId,
            paymentType,
            conferenceFee,
            processingFee,
            total,
        } = body;

        const isListener = paymentType === "listener";

        if (!orderId || !paymentId || !signature || (!submissionId && !isListener)) {
            return NextResponse.json(
                { error: "Missing payment data" },
                { status: 400 }
            );
        }

        // ── Razorpay signature verification ──
        const generated = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(orderId + "|" + paymentId)
            .digest("hex");

        if (generated !== signature) {
            console.error("❌ Signature mismatch");
            return NextResponse.json(
                { error: "Invalid payment" },
                { status: 400 }
            );
        }

        // ── Update payment status based on payment type ──
        if (isListener && registrationId) {
            // Listener: update conference_registrations.paid = true
            const { error } = await supabaseAdmin
                .from("conference_registrations")
                .update({ paid: true })
                .eq("id", registrationId);

            if (error) {
                console.error("DB ERROR (listener):", error);
                return NextResponse.json(
                    { error: "DB update failed" },
                    { status: 500 }
                );
            }

            console.log("✅ Listener payment verified & conference_registrations updated");
        } else {
            // Author: update paper_submissions with payment details + fee breakdown
            const { error } = await supabaseAdmin
                .from("paper_submissions")
                .update({
                    payment_status: "paid",
                    presentation_payment_id: paymentId,
                    payment_order_id: orderId,
                    payment_amount: total ?? null,
                    payment_conference_fee: conferenceFee ?? null,
                    payment_processing_fee: processingFee ?? null,
                    paid_at: new Date().toISOString(),
                })
                .eq("id", submissionId);

            if (error) {
                console.error("DB ERROR:", error);
                return NextResponse.json(
                    { error: "DB update failed" },
                    { status: 500 }
                );
            }

            console.log("✅ Payment verified & DB updated with fee breakdown");
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("VERIFY ERROR:", err);
        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}