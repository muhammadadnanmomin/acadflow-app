import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/send";
import {
  paperAccepted,
  paperRejected,
} from "@/lib/email/templates";

export async function POST(req: Request) {
  const { email, name, conference, status } = await req.json();

  const html =
    status === "accepted"
      ? paperAccepted(name, conference)
      : paperRejected(name, conference);

  await sendEmail(
    email,
    `Paper ${status === "accepted" ? "Accepted 🎉" : "Decision Update"}`,
    html
  );

  return NextResponse.json({ success: true });
}