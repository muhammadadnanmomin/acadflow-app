export const submissionReceived = (name: string, conf: string) => `
  <div style="font-family: Arial, sans-serif; line-height:1.6; color:#222;">
    
    <p>Dear ${name || "Author"},</p>

    <p>
      Your paper has been successfully submitted to
      <strong>${conf}</strong>.
    </p>

    <p>
      The submission is now under review. You will be notified once
      the evaluation process is complete.
    </p>

    <p>
      Please keep this email for your records.
    </p>

    <br/>

    <p>
      Regards,<br/>
      <strong>Conference Organizing Committee</strong><br/>
      ${conf}<br/>
      <em>Powered by Confairo</em>
    </p>

  </div>
`;


export const paperAccepted = (name: string, conf: string) => `
  <div style="font-family: Arial, sans-serif; line-height:1.6; color:#222;">
    
    <p>Dear ${name || "Author"},</p>

    <p>
      We are pleased to inform you that your paper has been 
      <strong>accepted</strong> for presentation at 
      <strong>${conf}</strong>.
    </p>

    <p>
      Congratulations on this achievement. Your contribution is valued, and we
      look forward to your participation in the conference.
    </p>

    <p>
      Further instructions regarding registration, presentation guidelines,
      and camera-ready submission (if applicable) will be shared soon.
    </p>

    <p>
      If you have any questions, please feel free to contact the conference
      organizing committee.
    </p>

    <br/>

    <p>
      Kind regards,<br/>
      <strong>Conference Organizing Committee</strong><br/>
      ${conf}<br/>
      <em>Powered by Confairo</em>
    </p>

  </div>
`;


export const paperRejected = (name: string, conf: string) => `
  <div style="font-family: Arial, sans-serif; line-height:1.6; color:#222;">
    
    <p>Dear ${name || "Author"},</p>

    <p>
      Thank you for submitting your paper to <strong>${conf}</strong>.
    </p>

    <p>
      After careful review by the evaluation committee, we regret to inform you
      that your submission was not accepted for presentation.
    </p>

    <p>
      Due to the high number of quality submissions received, the selection
      process was highly competitive.
    </p>

    <p>
      We sincerely appreciate your interest in the conference and encourage you
      to submit your work to future editions.
    </p>

    <br/>

    <p>
      Kind regards,<br/>
      <strong>Conference Organizing Committee</strong><br/>
      ${conf}<br/>
      <em>Powered by Confairo</em>
    </p>

  </div>
`;


export const paperRevisionRequired = (
  name: string,
  conference: string,
  comments?: string
) => `
  <div style="font-family: Arial, sans-serif; line-height:1.6; color:#222;">
    
    <p>Dear ${name || "Author"},</p>

    <p>
      Thank you for submitting your paper to
      <strong>${conference}</strong>.
    </p>

    <p>
      After careful evaluation, the review committee has determined that your
      submission requires <strong>revisions</strong> before a final decision
      can be made.
    </p>

    ${comments
    ? `
    <div style="background:#fef9e7; border-left:4px solid #f39c12; padding:12px 16px; margin:16px 0; border-radius:4px;">
      <p style="margin:0 0 6px; font-weight:bold; color:#7d6608;">Reviewer Comments</p>
      <p style="margin:0; white-space:pre-wrap;">${comments}</p>
    </div>
    `
    : ""
  }

    <p><strong>Next Steps:</strong></p>
    <ul style="margin:4px 0 16px; padding-left:20px;">
      <li>Please review the feedback provided above carefully.</li>
      <li>Revise your paper accordingly and resubmit through the platform.</li>
      <li>Ensure all requested changes are addressed before resubmission.</li>
    </ul>

    <p>
      We encourage you to submit your revised manuscript at your earliest
      convenience. Timely resubmission will help ensure your paper is
      considered in the current review cycle.
    </p>

    <p>
      If you have any questions regarding the feedback or the revision
      process, please do not hesitate to contact the conference organizing
      committee.
    </p>

    <br/>

    <p>
      Kind regards,<br/>
      <strong>Conference Organizing Committee</strong><br/>
      ${conference}<br/>
      <em>Powered by Confairo</em>
    </p>

  </div>
`;


export const reviewerInviteEmail = (
  name: string,
  conference: string,
  link: string
) => `
  <div style="font-family: Arial, sans-serif; line-height:1.6; color:#222;">
    
    <p>Hello ${name || "Reviewer"},</p>

    <p>
      You have been invited to serve as a reviewer for the conference
      <strong>${conference}</strong>.
    </p>

    <p>
      Please click the link below to accept the invitation and access your
      reviewer dashboard:
    </p>

    <p>
      <a href="${link}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">
        Accept Reviewer Invitation
      </a>
    </p>

    <p>
      This invitation link will expire in 7 days.
    </p>

    <br/>

    <p>
      Regards,<br/>
      <strong>Conference Organizing Committee</strong><br/>
      ${conference}<br/>
      <em>Powered by Confairo</em>
    </p>

  </div>
`;

export const reviewerAssignedEmail = (
  name: string,
  conference: string,
  paperTitle: string
) => `
  <div style="font-family: Arial, Helvetica, sans-serif; background:#f6f8fb; padding:30px 15px; color:#222;">
    
    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; padding:30px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">

      <h2 style="margin-top:0; color:#111;">Paper Review Assignment</h2>

      <p>Hello ${name || "Reviewer"},</p>

      <p>
        You have been assigned a paper to review for the conference:
      </p>

      <p style="font-size:16px; font-weight:bold; margin:10px 0 20px;">
        ${conference}
      </p>

      <div style="background:#f3f6fb; border-left:4px solid #3b82f6; padding:12px 15px; margin:15px 0;">
        <strong>Paper Title</strong><br/>
        ${paperTitle}
      </div>

      <p>
        Please log in to your reviewer dashboard to evaluate the submission and submit your review.
      </p>

      <p style="margin-top:25px;">
        <a href="#" 
           style="background:#111; color:#fff; text-decoration:none; padding:10px 18px; border-radius:6px; display:inline-block; font-size:14px;">
          Open Reviewer Dashboard
        </a>
      </p>

      <hr style="border:none; border-top:1px solid #eee; margin:30px 0;" />

      <p style="margin:0;">
        Regards,<br/>
        <strong>Conference Organizing Committee</strong><br/>
        ${conference}
      </p>

      <p style="font-size:12px; color:#777; margin-top:20px;">
        This email was sent automatically by <strong>Confairo</strong>.<br/>
        If you were not expecting this assignment, please contact the conference organizer.
      </p>

    </div>

  </div>
`;


export const paymentSuccess = (name: string, conf: string) => `
  <h2>Payment Successful ✅</h2>
  <p>Hi ${name},</p>
  <p>Your payment for <b>${conf}</b> is confirmed.</p>
  <p>Receipt and participation details will follow.</p>
`;


export const reviewerDecisionNotification = (
  reviewerName: string,
  paperTitle: string,
  conference: string,
  decision: string
) => {
  const decisionLabel =
    decision === "accepted"
      ? "Accept"
      : decision === "rejected"
        ? "Reject"
        : decision === "revision_required"
          ? "Revision Required"
          : decision;

  return `
  <div style="font-family: Arial, sans-serif; line-height:1.6; color:#222;">

    <p>Dear Organizer,</p>

    <p>
      A reviewer has submitted their evaluation for a paper in
      <strong>${conference}</strong>.
    </p>

    <div style="background:#f3f6fb; border-left:4px solid #3b82f6; padding:12px 16px; margin:16px 0; border-radius:4px;">
      <p style="margin:0 0 6px;"><strong>Reviewer:</strong> ${reviewerName || "Reviewer"}</p>
      <p style="margin:0 0 6px;"><strong>Paper:</strong> ${paperTitle || "Paper Submission"}</p>
      <p style="margin:0;"><strong>Decision:</strong> ${decisionLabel}</p>
    </div>

    <p>
      Please log in to your organizer dashboard to review this decision
      and take any necessary action.
    </p>

    <br/>

    <p>
      Regards,<br/>
      <strong>Conference Management System</strong><br/>
      ${conference}<br/>
      <em>Powered by Confairo</em>
    </p>

  </div>
`;
};


export const sessionScheduleNotification = (
  name: string,
  conference: string,
  sessionTitle: string,
  datetime: string,
  mode: "offline" | "online" | "hybrid",
  venue?: string,
  meetingLink?: string
) => `
  <div style="font-family: Arial, Helvetica, sans-serif; background:#f6f8fb; padding:30px 15px; color:#222;">
    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; padding:30px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">

      <h2 style="margin-top:0; color:#111;">📅 Session Scheduled</h2>

      <p>Dear ${name || "Presenter"},</p>

      <p>
        Your presentation has been scheduled for the conference
        <strong>${conference}</strong>.
      </p>

      <div style="background:#f3f6fb; border-left:4px solid #6366f1; padding:12px 15px; margin:15px 0; border-radius:4px;">
        <p style="margin:0 0 6px;"><strong>Session:</strong> ${sessionTitle}</p>
        <p style="margin:0 0 6px;"><strong>Date & Time:</strong> ${datetime}</p>
        <p style="margin:0 0 6px;"><strong>Mode:</strong> ${mode.charAt(0).toUpperCase() + mode.slice(1)}</p>
        ${venue ? `<p style="margin:0 0 6px;"><strong>Venue:</strong> ${venue}</p>` : ""}
        ${meetingLink ? `<p style="margin:0;"><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ""}
      </div>

      <p>
        Please ensure you are prepared and available at the scheduled time.
        If you have any questions, contact the conference organizing committee.
      </p>

      <hr style="border:none; border-top:1px solid #eee; margin:30px 0;" />

      <p style="margin:0;">
        Regards,<br/>
        <strong>Conference Organizing Committee</strong><br/>
        ${conference}
      </p>

      <p style="font-size:12px; color:#777; margin-top:20px;">
        This email was sent automatically by <strong>Confairo</strong>.
      </p>
    </div>
  </div>
`;


export const chairpersonAssignmentNotification = (
  name: string,
  conference: string,
  sessionTitle: string,
  datetime: string
) => `
  <div style="font-family: Arial, Helvetica, sans-serif; background:#f6f8fb; padding:30px 15px; color:#222;">
    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; padding:30px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">

      <h2 style="margin-top:0; color:#111;">🎓 Chairperson Assignment</h2>

      <p>Dear ${name || "Chairperson"},</p>

      <p>
        You have been assigned as the <strong>Session Chairperson</strong> for
        the conference <strong>${conference}</strong>.
      </p>

      <div style="background:#fef9e7; border-left:4px solid #f59e0b; padding:12px 15px; margin:15px 0; border-radius:4px;">
        <p style="margin:0 0 6px;"><strong>Session:</strong> ${sessionTitle}</p>
        <p style="margin:0;"><strong>Date & Time:</strong> ${datetime}</p>
      </div>

      <p>
        As the session chairperson, you will be responsible for moderating the session,
        introducing speakers, and managing Q&A. Please log in to your dashboard for
        full session details.
      </p>

      <hr style="border:none; border-top:1px solid #eee; margin:30px 0;" />

      <p style="margin:0;">
        Regards,<br/>
        <strong>Conference Organizing Committee</strong><br/>
        ${conference}
      </p>

      <p style="font-size:12px; color:#777; margin-top:20px;">
        This email was sent automatically by <strong>Confairo</strong>.
      </p>
    </div>
  </div>
`;