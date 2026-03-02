import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/send";
import { reviewerInviteEmail } from "@/lib/email/templates";

export async function POST(req: Request) {
  const { email, conference, link } = await req.json();

  await sendEmail(
    email,
    `Reviewer Invitation — ${conference}`,
    reviewerInviteEmail(email, conference, link)
  );

  return NextResponse.json({ success: true });
}