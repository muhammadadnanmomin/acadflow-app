// ============================================================
// AcadFlow — Create Razorpay Order for AI Credit Pack
// ============================================================
import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { getAICreditPack } from "@/lib/config/pricing";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { conferenceId, packId, userId } = body;

    if (!conferenceId || !packId || !userId) {
      return NextResponse.json(
        { error: "Missing conferenceId, packId, or userId" },
        { status: 400 }
      );
    }

    // Validate pack
    const pack = getAICreditPack(packId);
    if (!pack) {
      return NextResponse.json(
        { error: "Invalid credit pack" },
        { status: 400 }
      );
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
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
      amount: pack.price * 100, // Razorpay expects paise
      currency: "INR",
      receipt: `acf_ai_${conferenceId.slice(0, 8)}_${Date.now()}`,
      notes: {
        type: "ai_credit_purchase",
        conference_id: conferenceId,
        user_id: userId,
        pack_id: packId,
        credits: String(pack.credits),
        amount: String(pack.price),
      },
    });

    return NextResponse.json({
      ...order,
      pack,
    });
  } catch (err: any) {
    console.error("AI CREDITS CREATE-ORDER ERROR:", err);
    return NextResponse.json(
      { error: "Payment server error" },
      { status: 500 }
    );
  }
}
