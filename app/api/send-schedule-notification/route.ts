import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/send";
import {
    sessionScheduleNotification,
    chairpersonAssignmentNotification,
} from "@/lib/email/templates";

interface NotificationPayload {
    conference: string;
    session_title: string;
    datetime: string;
    mode: "offline" | "online" | "hybrid";
    venue?: string;
    meeting_link?: string;
    speakers: { name: string; email: string }[];
    chairperson?: { name: string; email: string };
}

export async function POST(req: Request) {
    try {
        const payload: NotificationPayload = await req.json();

        const emailPromises: Promise<unknown>[] = [];

        // Notify all speakers
        for (const speaker of payload.speakers) {
            emailPromises.push(
                sendEmail(
                    speaker.email,
                    `Session Scheduled — ${payload.session_title} | ${payload.conference}`,
                    sessionScheduleNotification(
                        speaker.name,
                        payload.conference,
                        payload.session_title,
                        payload.datetime,
                        payload.mode,
                        payload.venue,
                        payload.meeting_link
                    )
                )
            );
        }

        // Notify chairperson
        if (payload.chairperson) {
            emailPromises.push(
                sendEmail(
                    payload.chairperson.email,
                    `Chairperson Assignment — ${payload.session_title} | ${payload.conference}`,
                    chairpersonAssignmentNotification(
                        payload.chairperson.name,
                        payload.conference,
                        payload.session_title,
                        payload.datetime
                    )
                )
            );
        }

        await Promise.all(emailPromises);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Schedule notification error:", error);
        return NextResponse.json(
            { error: "Failed to send notifications" },
            { status: 500 }
        );
    }
}
