import crypto from "crypto";
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server-client";

export async function POST(req: Request) {
  const body = await req.text();

  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature" },
      { status: 400 }
    );
  }

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  if (expected !== signature) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  const event = JSON.parse(body);

  // Payment success
  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;

    const receipt = payment.notes?.receipt;

    if (receipt) {
      const parts = receipt.split("_");

      const conferenceId = parts[1];
      const userId = parts[2];

      await supabaseServerClient
        .from("conference_registrations")
        .update({ paid: true })
        .eq("conference_id", conferenceId)
        .eq("user_id", userId);
    }
  }

  return NextResponse.json({ status: "ok" });
}
