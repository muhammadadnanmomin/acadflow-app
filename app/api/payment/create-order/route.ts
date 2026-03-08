import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { calculateFeeBreakdown } from "@/lib/payment/fees";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { conferenceFee, conferenceId, userId, submissionId } = body;

    if (!conferenceFee || !conferenceId || !userId || !submissionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // ── Guard: prevent double payment ──
    const { data: submission } = await supabaseAdmin
      .from("paper_submissions")
      .select("payment_status")
      .eq("id", submissionId)
      .single();

    if (submission?.payment_status === "paid") {
      return NextResponse.json(
        { error: "Payment already completed for this submission" },
        { status: 409 }
      );
    }

    // ── Server-side fee validation ──
    // Fetch actual conference fees from DB to prevent frontend tampering
    const { data: conf } = await supabaseAdmin
      .from("conferences")
      .select(
        "physical_presentation_fee, virtual_presentation_fee, full_paper_publication_fee, abstract_publication_fee"
      )
      .eq("id", conferenceId)
      .single();

    if (!conf) {
      return NextResponse.json(
        { error: "Conference not found" },
        { status: 404 }
      );
    }

    // Validate that the submitted conference fee doesn't exceed
    // the maximum possible fee (both highest options combined)
    const maxPossibleFee =
      Math.max(
        Number(conf.physical_presentation_fee || 0),
        Number(conf.virtual_presentation_fee || 0)
      ) +
      Math.max(
        Number(conf.full_paper_publication_fee || 0),
        Number(conf.abstract_publication_fee || 0)
      );

    if (conferenceFee > maxPossibleFee || conferenceFee <= 0) {
      return NextResponse.json(
        { error: "Invalid conference fee amount" },
        { status: 400 }
      );
    }

    // ── Calculate full fee breakdown server-side ──
    const breakdown = calculateFeeBreakdown(conferenceFee);

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: breakdown.razorpayAmountPaise,
      currency: "INR",
      receipt: `acf_${conferenceId.slice(0, 8)}_${userId.slice(0, 8)}`,
      notes: {
        conferenceId,
        userId,
        submissionId,
        conferenceFee: String(breakdown.conferenceFee),
        gatewayFee: String(breakdown.gatewayFee),
        gstOnGateway: String(breakdown.gstOnGateway),
        totalPayable: String(breakdown.totalPayable),
      },
    });

    // Return order + breakdown so frontend can confirm amounts
    return NextResponse.json({
      ...order,
      breakdown,
    });
  } catch (err: any) {
    console.error("PAYMENT ORDER ERROR:", err);
    return NextResponse.json(
      { error: "Payment server error" },
      { status: 500 }
    );
  }
}
