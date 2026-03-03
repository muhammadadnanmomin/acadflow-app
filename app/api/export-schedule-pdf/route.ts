import { NextResponse } from "next/server";
import { exportScheduleJSON } from "@/lib/schedule/actions";
import { generateSchedulePDF } from "@/lib/schedule/pdf/generateSchedulePDF";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const conferenceId = searchParams.get("conferenceId");

        if (!conferenceId) {
            return NextResponse.json(
                { error: "conferenceId is required" },
                { status: 400 }
            );
        }

        // 1. Fetch the full schedule data using existing export logic
        const scheduleData = await exportScheduleJSON(conferenceId);

        // 2. Generate the PDF buffer
        const pdfBuffer = await generateSchedulePDF(scheduleData);

        // 3. Build a safe filename
        const safeName = scheduleData.conference_name
            .replace(/[^a-zA-Z0-9\s-]/g, "")
            .replace(/\s+/g, "_")
            .substring(0, 80);

        const fileName = `${safeName}_Schedule.pdf`;

        // 4. Return as a downloadable PDF
        return new Response(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${fileName}"`,
                "Content-Length": String(pdfBuffer.length),
            },
        });
    } catch (error) {
        console.error("PDF export error:", error);
        return NextResponse.json(
            { error: "Failed to generate PDF" },
            { status: 500 }
        );
    }
}
