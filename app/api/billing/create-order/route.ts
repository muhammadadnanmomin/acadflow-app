import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { PRO_SLOT_PRICE, getAICreditPack } from "@/lib/config/pricing";

/**
 * Creates a Razorpay order for a Pro slot purchase,
 * optionally bundled with an AI credit add-on.
 *
 * Body: { organizationId, userId, credits?: number }
 *   credits = 0 | 50 | 100  (0 = no add-on)
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { organizationId, userId, credits = 0 } = body;

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

        // ── Calculate total amount ──
        let addOnPrice = 0;
        let addOnPackId: string | null = null;
        let addOnCredits = 0;

        if (credits > 0) {
            // Find the matching pack by credit count
            const pack =
                getAICreditPack("ai_50")?.credits === credits
                    ? getAICreditPack("ai_50")
                    : getAICreditPack("ai_100")?.credits === credits
                        ? getAICreditPack("ai_100")
                        : undefined;

            if (!pack) {
                return NextResponse.json(
                    { error: "Invalid credit add-on" },
                    { status: 400 }
                );
            }

            addOnPrice = pack.price;
            addOnPackId = pack.id;
            addOnCredits = pack.credits;
        }

        const totalAmount = PRO_SLOT_PRICE + addOnPrice;

        // ── Create Razorpay order ──
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const order = await razorpay.orders.create({
            amount: totalAmount * 100, // Razorpay expects paise
            currency: "INR",
            receipt: `acf_slot_${organizationId.slice(0, 8)}_${Date.now()}`,
            notes: {
                type: "slot_purchase",
                organization_id: organizationId,
                user_id: userId,
                // Bundle metadata — used by verify route
                ai_credits: String(addOnCredits),
                ai_pack_id: addOnPackId || "",
                ai_addon_price: String(addOnPrice),
            },
        });

        return NextResponse.json({
            ...order,
            totalAmount,
            addOnCredits,
            addOnPrice,
        });
    } catch (err: any) {
        console.error("BILLING CREATE-ORDER ERROR:", err);
        return NextResponse.json(
            { error: "Payment server error" },
            { status: 500 }
        );
    }
}
