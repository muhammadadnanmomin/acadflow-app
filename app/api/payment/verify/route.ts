import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendPaymentConfirmation } from "@/lib/email/sendPaymentConfirmation";

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

        // ── Fetch order from Razorpay to get trusted fee values ──
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        const order = await razorpay.orders.fetch(orderId);
        const notes = order.notes || {};

        const conferenceFee = notes.conferenceFee ? Number(notes.conferenceFee) : null;
        const processingFee = notes.processingFee ? Number(notes.processingFee) : null;
        const total = notes.total ? Number(notes.total) : null;

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

            // ── Send confirmation email (listener) ──
            const { data: reg } = await supabaseAdmin
                .from("conference_registrations")
                .select("user_id, amount, conference_id, conferences ( title )")
                .eq("id", registrationId)
                .maybeSingle();

            if (reg?.user_id) {
                const { data: profile } = await supabaseAdmin
                    .from("profiles")
                    .select("email, name")
                    .eq("id", reg.user_id)
                    .maybeSingle();

                if (profile?.email) {
                    sendPaymentConfirmation({
                        email: profile.email,
                        name: profile.name || "Participant",
                        conferenceName: (reg.conferences as any)?.title || "Conference",
                        amount: total || Number(reg.amount) || 0,
                        paymentId,
                        orderId,
                        paidAt: new Date().toISOString(),
                    }).catch(() => {});
                }
            }
        } else {
            // Author: update paper_submissions with payment details + fee breakdown
            const { error } = await supabaseAdmin
                .from("paper_submissions")
                .update({
                    payment_status: "paid",
                    presentation_payment_id: paymentId,
                    payment_order_id: orderId,
                    payment_amount: total,
                    payment_conference_fee: conferenceFee,
                    payment_processing_fee: processingFee,
                    paid_at: new Date().toISOString(),
                })
                .eq("id", submissionId)
                .neq("payment_status", "paid");

            if (error) {
                console.error("DB ERROR:", error);
                return NextResponse.json(
                    { error: "DB update failed" },
                    { status: 500 }
                );
            }

            console.log("✅ Payment verified & DB updated with fee breakdown");

            // ── Send confirmation email (author) ──
            const { data: sub } = await supabaseAdmin
                .from("paper_submissions")
                .select("user_id, conference_id, conferences ( title )")
                .eq("id", submissionId)
                .maybeSingle();

            if (sub?.user_id) {
                const { data: profile } = await supabaseAdmin
                    .from("profiles")
                    .select("email, name")
                    .eq("id", sub.user_id)
                    .maybeSingle();

                if (profile?.email) {
                    sendPaymentConfirmation({
                        email: profile.email,
                        name: profile.name || "Participant",
                        conferenceName: (sub.conferences as any)?.title || "Conference",
                        amount: total || 0,
                        paymentId,
                        orderId,
                        paidAt: new Date().toISOString(),
                    }).catch(() => {});
                }
            }
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
