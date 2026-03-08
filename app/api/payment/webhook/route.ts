import crypto from "crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { addLedgerCredit, addLedgerDebit } from "@/lib/payment/balance";

// ── Types ───────────────────────────────────────────────────────────

interface WebhookLogInsert {
  event_type: string;
  razorpay_event_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  payload: Record<string, any>;
  signature: string;
  processed: boolean;
  error: string | null;
}

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Verify the Razorpay webhook signature (HMAC SHA-256).
 * Returns `true` if the signature is valid.
 */
function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("❌ RAZORPAY_WEBHOOK_SECRET is not set");
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  // Timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Log a webhook event to the `webhook_logs` table.
 * Returns the inserted row ID, or `null` if the event was already processed (idempotent).
 */
async function logWebhookEvent(
  data: WebhookLogInsert
): Promise<{ id: string; alreadyProcessed: boolean } | null> {
  // ── Idempotency check ──
  // If this exact Razorpay event ID was already received, skip processing.
  if (data.razorpay_event_id) {
    const { data: existing } = await supabaseAdmin
      .from("webhook_logs")
      .select("id, processed")
      .eq("razorpay_event_id", data.razorpay_event_id)
      .maybeSingle();

    if (existing) {
      return { id: existing.id, alreadyProcessed: true };
    }
  }

  // Insert the log row
  const { data: inserted, error } = await supabaseAdmin
    .from("webhook_logs")
    .insert(data)
    .select("id")
    .single();

  if (error) {
    console.error("❌ Failed to insert webhook log:", error.message);
    return null;
  }

  return { id: inserted.id, alreadyProcessed: false };
}

/**
 * Mark a webhook log as processed (or store an error).
 */
async function markWebhookProcessed(
  logId: string,
  error?: string
): Promise<void> {
  await supabaseAdmin
    .from("webhook_logs")
    .update({
      processed: !error,
      error: error ?? null,
    })
    .eq("id", logId);
}

// ── Event Handlers ──────────────────────────────────────────────────

/**
 * payment.captured — The payment was successful.
 *
 * Updates:
 *   • paper_submissions → payment_status = "paid", payment_method, paid_at
 *   • conference_registrations → paid = true
 *   • organizer_ledger → credit entry for conference fee
 */
async function handlePaymentCaptured(
  payment: Record<string, any>
): Promise<void> {
  const orderId = payment.order_id;
  const paymentId = payment.id;
  const method = payment.method; // "upi", "card", "netbanking", "wallet"

  // ── Update paper_submissions via order ID ──
  if (orderId) {
    await supabaseAdmin
      .from("paper_submissions")
      .update({
        payment_status: "paid",
        presentation_payment_id: paymentId,
        payment_method: method ?? null,
        paid_at: new Date().toISOString(),
      })
      .eq("payment_order_id", orderId);
  }

  // ── Update conference_registrations via receipt notes ──
  const notes = payment.notes ?? {};
  const conferenceId = notes.conferenceId;
  const userId = notes.userId;

  if (conferenceId && userId) {
    await supabaseAdmin
      .from("conference_registrations")
      .update({ paid: true })
      .eq("conference_id", conferenceId)
      .eq("user_id", userId);
  }

  // Fallback: parse receipt string (legacy format: acf_{confId}_{userId})
  if (!conferenceId && payment.receipt) {
    const parts = payment.receipt.split("_");
    if (parts.length >= 3) {
      await supabaseAdmin
        .from("conference_registrations")
        .update({ paid: true })
        .eq("conference_id", parts[1])
        .eq("user_id", parts[2]);
    }
  }

  // ── Ledger: Credit the conference organizer ──
  // Determine the conference fee (organizer's share)
  const conferenceFee = Number(notes.conferenceFee) || (payment.amount / 100);
  const resolvedConferenceId = conferenceId || (payment.receipt?.split("_")?.[1]);

  if (resolvedConferenceId) {
    // Look up the organizer for this conference
    const { data: conference } = await supabaseAdmin
      .from("conferences")
      .select("organizer_id, title")
      .eq("id", resolvedConferenceId)
      .maybeSingle();

    if (conference?.organizer_id) {
      try {
        await addLedgerCredit(supabaseAdmin, {
          organizerId: conference.organizer_id,
          amount: conferenceFee,
          entryType: "payment_credit",
          paymentId: paymentId,
          description: `Payment received for ${conference.title || "conference"}`,
        });
      } catch (err) {
        console.error("⚠️ Ledger credit failed (non-blocking):", err);
      }
    }
  }
}

/**
 * payment.failed — The payment attempt failed.
 *
 * Updates paper_submissions → payment_status = "failed"
 */
async function handlePaymentFailed(
  payment: Record<string, any>
): Promise<void> {
  const orderId = payment.order_id;

  if (orderId) {
    await supabaseAdmin
      .from("paper_submissions")
      .update({ payment_status: "failed" })
      .eq("payment_order_id", orderId)
      .neq("payment_status", "paid"); // never downgrade a paid status
  }
}

/**
 * order.paid — The order is fully paid (redundant safety net).
 *
 * Razorpay fires this after all payment attempts on an order succeed.
 * Acts as a backup for payment.captured.
 */
async function handleOrderPaid(
  order: Record<string, any>
): Promise<void> {
  const orderId = order.id;

  if (orderId) {
    // Only update if not already marked paid (idempotent)
    await supabaseAdmin
      .from("paper_submissions")
      .update({
        payment_status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("payment_order_id", orderId)
      .neq("payment_status", "paid");
  }
}

/**
 * refund.created — A refund was initiated.
 *
 * Updates:
 *   • paper_submissions → refund_status = "refund_initiated"
 *   • organizer_ledger → debit entry for refund amount
 */
async function handleRefundCreated(
  refund: Record<string, any>
): Promise<void> {
  const paymentId = refund.payment_id;
  const refundAmount = Number(refund.amount) / 100; // Razorpay sends in paise

  if (paymentId) {
    await supabaseAdmin
      .from("paper_submissions")
      .update({ refund_status: "refund_initiated" })
      .eq("presentation_payment_id", paymentId);

    // ── Ledger: Debit the organizer for the refund ──
    // Find the paper submission → conference → organizer
    const { data: submission } = await supabaseAdmin
      .from("paper_submissions")
      .select("conference_id")
      .eq("presentation_payment_id", paymentId)
      .maybeSingle();

    if (submission?.conference_id) {
      const { data: conference } = await supabaseAdmin
        .from("conferences")
        .select("organizer_id, title")
        .eq("id", submission.conference_id)
        .maybeSingle();

      if (conference?.organizer_id && refundAmount > 0) {
        try {
          await addLedgerDebit(supabaseAdmin, {
            organizerId: conference.organizer_id,
            amount: refundAmount,
            entryType: "refund",
            paymentId: paymentId,
            description: `Refund processed for ${conference.title || "conference"}`,
          });
        } catch (err) {
          console.error("⚠️ Ledger refund debit failed (non-blocking):", err);
        }
      }
    }
  }
}

// ── Main Route Handler ──────────────────────────────────────────────

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  // ── 1. Signature presence check ──
  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  // ── 2. Signature verification ──
  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  // ── 3. Parse event ──
  let event: Record<string, any>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const eventType: string = event.event ?? "unknown";
  const eventId: string | null = event.event_id ?? null;

  // Extract common IDs from the payload
  const payloadEntity =
    event.payload?.payment?.entity ??
    event.payload?.order?.entity ??
    event.payload?.refund?.entity ??
    {};

  const razorpayPaymentId: string | null =
    payloadEntity.id ?? payloadEntity.payment_id ?? null;
  const razorpayOrderId: string | null =
    payloadEntity.order_id ?? payloadEntity.id ?? null;

  // ── 4. Log the webhook & check idempotency ──
  const logResult = await logWebhookEvent({
    event_type: eventType,
    razorpay_event_id: eventId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_order_id: razorpayOrderId,
    payload: event,
    signature,
    processed: false,
    error: null,
  });

  // If logging failed entirely, still return 200 to prevent Razorpay retries
  if (!logResult) {
    console.error("⚠️ Webhook log insert failed, but returning 200 to prevent retry storm");
    return NextResponse.json({ status: "log_failed" });
  }

  // If already processed, return immediately (idempotent)
  if (logResult.alreadyProcessed) {
    return NextResponse.json({ status: "already_processed" });
  }

  const logId = logResult.id;

  // ── 5. Route the event ──
  try {
    switch (eventType) {
      case "payment.captured": {
        const payment = event.payload.payment.entity;
        await handlePaymentCaptured(payment);
        break;
      }

      case "payment.failed": {
        const payment = event.payload.payment.entity;
        await handlePaymentFailed(payment);
        break;
      }

      case "order.paid": {
        const order = event.payload.order.entity;
        await handleOrderPaid(order);
        break;
      }

      case "refund.created": {
        const refund = event.payload.refund.entity;
        await handleRefundCreated(refund);
        break;
      }

      default:
        // Unhandled event — log and acknowledge
        console.log(`ℹ️ Unhandled webhook event: ${eventType}`);
        await markWebhookProcessed(logId, `Unhandled event: ${eventType}`);
        return NextResponse.json({ status: "unhandled_event" });
    }

    // ── 6. Mark as processed ──
    await markWebhookProcessed(logId);

    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    // ── 7. Error handling ──
    // Log the error but still return 200 to prevent Razorpay retry storms.
    // The webhook_logs.error field allows debugging later.
    const errorMessage =
      err instanceof Error ? err.message : "Unknown processing error";

    console.error(`❌ Webhook processing error [${eventType}]:`, errorMessage);
    await markWebhookProcessed(logId, errorMessage);

    return NextResponse.json({ status: "processing_error" });
  }
}
