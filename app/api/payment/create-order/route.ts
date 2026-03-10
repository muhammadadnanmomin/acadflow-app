import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { calculateFeeBreakdown } from "@/lib/payment/fees";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { conferenceFee, conferenceId, userId, submissionId, registrationId, paymentType } = body;

    const isListener = paymentType === "listener";

    if (!conferenceFee || !conferenceId || !userId || (!submissionId && !isListener)) {
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
    if (isListener && registrationId) {
      // Listener: check conference_registrations.paid
      const { data: reg } = await supabaseAdmin
        .from("conference_registrations")
        .select("paid")
        .eq("id", registrationId)
        .single();

      if (reg?.paid) {
        return NextResponse.json(
          { error: "Payment already completed for this registration" },
          { status: 409 }
        );
      }
    } else if (submissionId) {
      // Author: check paper_submissions.payment_status
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
    }

    // ── Server-side fee validation ──
    // Fetch actual conference fees from DB to prevent frontend tampering
    // Validate fee against category fee table
    const { data: feeRows } = await supabaseAdmin
      .from("conference_fee_categories")
      .select(`
    physical_presentation_fee,
    virtual_presentation_fee,
    full_paper_publication_fee,
    abstract_publication_fee,
    listener_fee
  `)
      .eq("conference_id", conferenceId);

    if (!feeRows || feeRows.length === 0) {
      return NextResponse.json(
        { error: "Conference fee configuration not found" },
        { status: 404 }
      );
    }

    // Calculate maximum possible fee across all categories
    let maxPossibleFee = 0;

    feeRows.forEach((row) => {
      const maxPresentation = Math.max(
        Number(row.physical_presentation_fee || 0),
        Number(row.virtual_presentation_fee || 0)
      );

      const maxPublication = Math.max(
        Number(row.full_paper_publication_fee || 0),
        Number(row.abstract_publication_fee || 0)
      );

      const listener = Number(row.listener_fee || 0);

      maxPossibleFee = Math.max(
        maxPossibleFee,
        maxPresentation + maxPublication,
        listener
      );
    });

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
        submissionId: submissionId || "",
        registrationId: registrationId || "",
        paymentType: paymentType || "author",
        conferenceFee: String(breakdown.conferenceFee),
        processingFee: String(breakdown.processingFee),
        total: String(breakdown.total),
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

