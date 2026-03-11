import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { EARLY_ADOPTER_SLOT_PRICE } from "@/lib/config/pricing";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { organizationId, userId } = body;

        if (!organizationId || !userId) {
            return NextResponse.json(
                { error: "Missing organizationId or userId" },
                { status: 400 }
            );
        }

        if (
            !process.env.RAZORPAY_KEY_ID ||
            !process.env.RAZORPAY_KEY_SECRET
        ) {
            return NextResponse.json(
                { error: "Razorpay keys not configured" },
                { status: 500 }
            );
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const order = await razorpay.orders.create({
            amount: EARLY_ADOPTER_SLOT_PRICE * 100, // Razorpay expects paise
            currency: "INR",
            receipt: `acf_slot_${organizationId.slice(0, 8)}_${Date.now()}`,
            notes: {
                type: "slot_purchase",
                organization_id: organizationId,
                user_id: userId,
            },
        });

        return NextResponse.json(order);
    } catch (err: any) {
        console.error("BILLING CREATE-ORDER ERROR:", err);
        return NextResponse.json(
            { error: "Payment server error" },
            { status: 500 }
        );
    }
}
