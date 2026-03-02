import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/send";
import {
  paperAccepted,
  paperRejected,
  paperRevisionRequired,
} from "@/lib/email/templates";

export async function POST(req: Request) {
  const { email, name, conference, status, comments } = await req.json();

  let html: string;
  let subject: string;

  if (status === "accepted") {
    html = paperAccepted(name, conference);
    subject = "Paper Accepted 🎉";
  } else if (status === "revision_required") {
    html = paperRevisionRequired(name, conference, comments);
    subject = `Revision Required — ${conference}`;
  } else {
    html = paperRejected(name, conference);
    subject = "Paper Decision Update";
  }

  await sendEmail(email, subject, html);

  return NextResponse.json({ success: true });
}