import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { paperId, authorName, conferenceTitle } = await req.json();

    if (!paperId) {
      return NextResponse.json(
        { error: "Missing paperId" },
        { status: 400 }
      );
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([800, 600]);

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    page.drawText("Certificate of Presentation", {
      x: 180,
      y: 500,
      size: 24,
      font,
    });

    page.drawText(authorName || "Participant", {
      x: 260,
      y: 380,
      size: 18,
      font,
    });

    page.drawText(conferenceTitle || "Conference", {
      x: 240,
      y: 300,
      size: 16,
    });

    const pdfBytes = await pdfDoc.save();
    const filePath = `${paperId}.pdf`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("certificates")
      .upload(filePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data } = supabaseAdmin.storage
      .from("certificates")
      .getPublicUrl(filePath);

    return NextResponse.json({ url: data.publicUrl });

  } catch (err: any) {
    console.error("CERT API ERROR:", err);

    return NextResponse.json(
      { error: err.message || "Server error generating certificate" },
      { status: 500 }
    );
  }
}