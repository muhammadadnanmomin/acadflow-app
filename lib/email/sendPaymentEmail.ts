/* ================================================================
   AcadFlow — Payment Confirmation Email
   Sends a branded email after slot purchase or conference fee payment.
   Used server-side only (API routes).
   ================================================================ */

import { sendEmail } from "@/lib/email/send";

export interface PaymentEmailData {
    /** Recipient email */
    to: string;
    /** Recipient name */
    name: string;
    /** Razorpay payment ID */
    paymentId: string;
    /** Razorpay order ID */
    orderId: string;
    /** Amount in INR */
    amount: number;
    /** What was paid for */
    description: string;
    /** Conference name (optional) */
    conferenceName?: string;
    /** Payment date */
    paidAt?: string;
}

/**
 * Send a branded payment confirmation email.
 * Non-blocking — failures are logged but don't break the payment flow.
 */
export async function sendPaymentConfirmationEmail(
    data: PaymentEmailData
): Promise<void> {
    const formattedAmount = `₹${data.amount.toLocaleString("en-IN")}`;
    const formattedDate = new Date(data.paidAt || Date.now()).toLocaleDateString(
        "en-IN",
        { day: "2-digit", month: "long", year: "numeric" }
    );

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4f46e5,#6366f1);border-radius:12px 12px 0 0;padding:32px 28px;text-align:center;">
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.3px;">
        AcadFlow
      </h1>
      <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">
        Payment Confirmation
      </p>
    </div>

    <!-- Body -->
    <div style="background:#fff;padding:32px 28px;border:1px solid #e2e8f0;border-top:0;">

      <!-- Success icon -->
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:#dcfce7;border-radius:50%;padding:12px;">
          <span style="font-size:28px;">✓</span>
        </div>
      </div>

      <h2 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#111827;text-align:center;">
        Payment Successful!
      </h2>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;text-align:center;">
        Hi ${data.name}, your payment has been verified and confirmed.
      </p>

      <!-- Details card -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:6px 0;color:#6b7280;">Description</td>
            <td style="padding:6px 0;text-align:right;font-weight:600;color:#111827;">
              ${data.description}
            </td>
          </tr>
          ${data.conferenceName ? `
          <tr>
            <td style="padding:6px 0;color:#6b7280;">Conference</td>
            <td style="padding:6px 0;text-align:right;font-weight:600;color:#111827;">
              ${data.conferenceName}
            </td>
          </tr>
          ` : ""}
          <tr>
            <td style="padding:6px 0;color:#6b7280;">Amount</td>
            <td style="padding:6px 0;text-align:right;font-weight:700;color:#16a34a;">
              ${formattedAmount}
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;">Payment ID</td>
            <td style="padding:6px 0;text-align:right;font-family:monospace;font-size:12px;color:#374151;">
              ${data.paymentId}
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;">Order ID</td>
            <td style="padding:6px 0;text-align:right;font-family:monospace;font-size:12px;color:#374151;">
              ${data.orderId}
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280;">Date</td>
            <td style="padding:6px 0;text-align:right;color:#111827;">
              ${formattedDate}
            </td>
          </tr>
        </table>
      </div>

      <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
        You can download your receipt anytime from the
        <a href="https://acadflow.com/dashboard/organizer/payments" style="color:#4f46e5;text-decoration:none;">Payments</a> page.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:20px 28px;text-align:center;border-radius:0 0 12px 12px;background:#f1f5f9;border:1px solid #e2e8f0;border-top:0;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">
        AcadFlow — Academic Conference Management Platform
      </p>
      <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">
        For support, contact acadflow.platform@gmail.com
      </p>
    </div>

  </div>
</body>
</html>
    `.trim();

    try {
        await sendEmail(data.to, "AcadFlow — Payment Confirmation", html);
        console.log(`📧 Payment confirmation sent to ${data.to}`);
    } catch (err) {
        // Non-blocking — log but don't throw
        console.error("⚠️ Payment email failed (non-blocking):", err);
    }
}
