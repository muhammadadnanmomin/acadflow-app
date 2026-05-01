// ============================================================
// AcadFlow — Verify AI Credit Pack Purchase
// ============================================================
import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAICreditPack } from "@/lib/config/pricing";
import { purchaseAICredits, getAIUsage } from "@/lib/ai/credits";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, paymentId, signature, conferenceId, packId } = body;

    if (!orderId || !paymentId || !signature || !conferenceId || !packId) {
      return NextResponse.json(
        { error: "Missing payment data" },
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

    /* ---- Verify Razorpay signature ---- */
    const generated = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(orderId + "|" + paymentId)
      .digest("hex");

    if (generated !== signature) {
      console.error("❌ AI credit purchase signature mismatch");
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    /* ---- Add credits ---- */
    const result = await purchaseAICredits(
      conferenceId,
      pack.credits,
      pack.price
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to add credits" },
        { status: 500 }
      );
    }

    /* ---- Return updated usage ---- */
    const usage = await getAIUsage(conferenceId);

    return NextResponse.json({
      success: true,
      credits_added: pack.credits,
      usage,
    });
  } catch (err) {
    console.error("AI CREDITS VERIFY ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
