/* ================================================================
   AcadFlow — Participant Payment Confirmation Email
   Sends after conference fee / listener payment verification.
   Server-side only (API routes).
   ================================================================ */

import { sendEmail } from "@/lib/email/send";

export interface PaymentConfirmationData {
    /** Recipient email */
    email: string;
    /** Recipient name */
    name: string;
    /** Conference name */
    conferenceName: string;
    /** Amount paid in INR */
    amount: number;
    /** Razorpay payment ID */
    paymentId: string;
    /** Razorpay order ID */
    orderId: string;
    /** Payment date */
    paidAt?: string | Date;
}

/**
 * Send a branded payment confirmation email to a participant.
 * Non-blocking — failures are logged but never break the payment flow.
 */
export async function sendPaymentConfirmation(
    data: PaymentConfirmationData
): Promise<void> {
    const formattedAmount = `₹${data.amount.toLocaleString("en-IN")}`;
    const paidDate = data.paidAt ? new Date(data.paidAt) : new Date();
    const formattedDate = paidDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
    const formattedTime = paidDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });

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
        <div style="display:inline-block;background:#dcfce7;border-radius:50%;padding:14px;">
          <span style="font-size:28px;line-height:1;">✓</span>
        </div>
      </div>

      <h2 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#111827;text-align:center;">
        Payment Successful! 🎉
      </h2>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;text-align:center;">
        Hi ${data.name}, your payment has been successfully processed.
      </p>

      <!-- Details card -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #f1f5f9;">Conference</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;border-bottom:1px solid #f1f5f9;">
              ${data.conferenceName}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #f1f5f9;">Amount Paid</td>
            <td style="padding:8px 0;text-align:right;font-weight:700;color:#16a34a;border-bottom:1px solid #f1f5f9;">
              ${formattedAmount}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #f1f5f9;">Payment ID</td>
            <td style="padding:8px 0;text-align:right;font-family:monospace;font-size:12px;color:#374151;border-bottom:1px solid #f1f5f9;">
              ${data.paymentId}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #f1f5f9;">Order ID</td>
            <td style="padding:8px 0;text-align:right;font-family:monospace;font-size:12px;color:#374151;border-bottom:1px solid #f1f5f9;">
              ${data.orderId}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;">Date</td>
            <td style="padding:8px 0;text-align:right;color:#111827;">
              ${formattedDate}, ${formattedTime}
            </td>
          </tr>
        </table>
      </div>

      <!-- Confirmation message -->
      <div style="margin:24px 0;padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">
        <p style="margin:0;font-size:14px;color:#166534;font-weight:500;">
          Your conference registration / submission has now been confirmed.
        </p>
      </div>

      <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
        A receipt for this payment can be downloaded from your
        <a href="https://acadflow.in/dashboard/participant/payments" style="color:#4f46e5;text-decoration:none;font-weight:500;">AcadFlow Dashboard</a>.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:20px 28px;text-align:center;border-radius:0 0 12px 12px;background:#f1f5f9;border:1px solid #e2e8f0;border-top:0;">
      <p style="margin:0;font-size:12px;font-weight:600;color:#6b7280;">
        AcadFlow
      </p>
      <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">
        Academic Conference Management Platform
      </p>
      <p style="margin:8px 0 0;font-size:11px;color:#9ca3af;">
        For support, contact
        <a href="mailto:acadflow.platform@gmail.com" style="color:#4f46e5;text-decoration:none;">acadflow.platform@gmail.com</a>
      </p>
    </div>

  </div>
</body>
</html>
    `.trim();

    try {
        await sendEmail(data.email, "AcadFlow — Payment Confirmation", html);
        console.log(`📧 Payment confirmation email sent: ${data.email}`);
    } catch (err) {
        // Non-blocking — log but never throw
        console.error("⚠️ Payment confirmation email failed (non-blocking):", err);
    }
}
