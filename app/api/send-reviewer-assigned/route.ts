import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/send";
import { reviewerAssignedEmail } from "@/lib/email/templates";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only key
);

export async function POST(req: Request) {
  try {
    const { reviewerId, conference, paperTitle } = await req.json();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", reviewerId)
      .single();

    if (error || !profile?.email) {
      console.error("Email not found:", error);
      return NextResponse.json({ error: "Email missing" }, { status: 400 });
    }

    await sendEmail(
      profile.email,
      `New Paper Assigned — ${conference}`,
      reviewerAssignedEmail(profile.name, conference, paperTitle)
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}