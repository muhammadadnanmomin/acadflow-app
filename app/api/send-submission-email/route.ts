import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/send";
import { submissionReceived } from "@/lib/email/templates";

export async function POST(req: Request) {
  const { email, name, conference } = await req.json();

  await sendEmail(
    email,
    `Paper Submission Confirmation — ${conference}`,
    submissionReceived(name, conference)
  );

  return NextResponse.json({ success: true });
}