import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { reviewerDecisionNotification } from "@/lib/email/templates";

export async function POST(req: Request) {
    try {
        const { submissionId, reviewerName, decision } = await req.json();

        const supabase = await createServerSupabaseClient();

        // Fetch paper + conference + organizer email in one chain
        const { data: paper } = await supabase
            .from("paper_submissions")
            .select("title, conference_id, conferences ( title, organizer_id )")
            .eq("id", submissionId)
            .single();

        if (!paper?.conferences) {
            return NextResponse.json({ success: false, reason: "conference_not_found" });
        }

        const conference = (paper.conferences as any).title || "Conference";
        const organizerId = (paper.conferences as any).organizer_id;

        if (!organizerId) {
            return NextResponse.json({ success: false, reason: "organizer_not_found" });
        }

        // Fetch organizer email
        const { data: organizer } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", organizerId)
            .single();

        if (!organizer?.email) {
            return NextResponse.json({ success: false, reason: "organizer_email_not_found" });
        }

        const paperTitle = paper.title || "Paper Submission";
        const cleanReviewerName = reviewerName || "Reviewer";

        const html = reviewerDecisionNotification(
            cleanReviewerName,
            paperTitle,
            conference,
            decision
        );

        await sendEmail(
            organizer.email,
            `Reviewer Decision Submitted — ${conference}`,
            html
        );

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Reviewer decision email failed:", err);
        return NextResponse.json({ success: false, reason: "email_error" });
    }
}
