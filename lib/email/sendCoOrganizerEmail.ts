import { sendEmail } from "@/lib/email/send";

interface CoOrganizerEmailParams {
    toEmail: string;
    toName: string | null;
    conferenceTitle: string;
    conferenceId: string;
    addedByName: string | null;
}

/**
 * Sends a notification email when a user is added as a co-organizer.
 * This is fire-and-forget — failures are logged but do NOT block the API response.
 */
export async function sendCoOrganizerEmail({
    toEmail,
    toName,
    conferenceTitle,
    conferenceId,
    addedByName,
}: CoOrganizerEmailParams): Promise<void> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://confairo.com";
    const dashboardLink = `${appUrl}/dashboard/organizer/conferences/${conferenceId}`;

    const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; background:#f6f8fb; padding:30px 15px; color:#222;">
    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; padding:30px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">

      <h2 style="margin-top:0; color:#111;">🤝 Co-Organizer Invitation</h2>

      <p>Hello ${toName || "there"},</p>

      <p>
        You have been added as a <strong>Co-Organizer</strong> for the following conference:
      </p>

      <div style="background:#f3f6fb; border-left:4px solid #6366f1; padding:12px 15px; margin:15px 0; border-radius:4px;">
        <p style="margin:0 0 6px;"><strong>Conference:</strong> ${conferenceTitle}</p>
        <p style="margin:0 0 6px;"><strong>Role:</strong> Co-Organizer</p>
        ${addedByName ? `<p style="margin:0;"><strong>Added by:</strong> ${addedByName}</p>` : ""}
      </div>

      <p>
        As a co-organizer, you can now manage submissions, schedule sessions, 
        handle reviewer assignments, manage certificates, and more.
      </p>

      <p style="margin-top:25px;">
        <a href="${dashboardLink}" 
           style="background:#6366f1; color:#fff; text-decoration:none; padding:12px 24px; border-radius:6px; display:inline-block; font-size:14px; font-weight:500;">
          View Conference
        </a>
      </p>

      <hr style="border:none; border-top:1px solid #eee; margin:30px 0;" />

      <p style="margin:0;">
        Regards,<br/>
        <strong>Confairo Team</strong>
      </p>

      <p style="font-size:12px; color:#777; margin-top:20px;">
        This email was sent automatically by <strong>Confairo</strong>.<br/>
        If you were not expecting this, please contact the conference organizer.
      </p>

    </div>
  </div>
  `;

    try {
        await sendEmail(
            toEmail,
            "You've been added as a Co-Organizer on Confairo",
            html
        );
    } catch (err) {
        console.error("[Co-Organizer Email] Failed to send:", err);
        // Non-blocking: do not throw — the co-organizer was already added successfully
    }
}
