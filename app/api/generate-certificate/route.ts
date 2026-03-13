import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { supabaseAdmin } from "@/lib/supabase/admin";
import crypto from "crypto";
import QRCode from "qrcode";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PAGE_W = 842; // A4 landscape
const PAGE_H = 595;
const MARGIN = 40;

/* ------------------------------------------------------------------ */
/*  Color palette                                                      */
/* ------------------------------------------------------------------ */

const COL_GOLD = rgb(0.72, 0.53, 0.04);       // decorative border & accents
const COL_DARK = rgb(0.12, 0.12, 0.14);       // main text
const COL_SUB = rgb(0.35, 0.35, 0.4);        // secondary text
const COL_BG = rgb(0.98, 0.97, 0.94);       // light beige background
const COL_LINE = rgb(0.78, 0.65, 0.35);       // border lines

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function centerX(pageWidth: number, textWidth: number) {
  return (pageWidth - textWidth) / 2;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function generateVerificationCode(): string {
  return "CERT-" + crypto.randomBytes(8).toString("hex").toUpperCase();
}

/* ------------------------------------------------------------------ */
/*  POST handler                                                       */
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  try {
    const {
      paperId,
      authorId,
      authorName,
      conferenceId,
      conferenceTitle,
      paperTitle,
    } = await req.json();

    if (!paperId || !authorId) {
      return NextResponse.json(
        { error: "Missing paperId or authorId" },
        { status: 400 }
      );
    }

    /* -------------------------------------------------------------- */
    /*  Duplicate check – return existing cert if already generated    */
    /* -------------------------------------------------------------- */

    const { data: existing } = await supabaseAdmin
      .from("certificates")
      .select("id,file_url,verification_code")
      .eq("paper_id", paperId)
      .eq("author_id", authorId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        existing: true,
        url: existing.file_url,
        certificateId: existing.id,
        verificationCode: existing.verification_code,
      });
    }

    /* -------------------------------------------------------------- */
    /*  Create PDF                                                     */
    /* -------------------------------------------------------------- */

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    /* -------------------------------------------------------------- */
    /*  Background                                                     */
    /* -------------------------------------------------------------- */

    page.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE_W,
      height: PAGE_H,
      color: COL_BG,
    });

    /* -------------------------------------------------------------- */
    /*  Decorative border (double frame)                                */
    /* -------------------------------------------------------------- */

    // Outer border
    page.drawRectangle({
      x: MARGIN,
      y: MARGIN,
      width: PAGE_W - MARGIN * 2,
      height: PAGE_H - MARGIN * 2,
      borderColor: COL_LINE,
      borderWidth: 2,
    });

    // Inner border
    const INNER = MARGIN + 8;
    page.drawRectangle({
      x: INNER,
      y: INNER,
      width: PAGE_W - INNER * 2,
      height: PAGE_H - INNER * 2,
      borderColor: COL_LINE,
      borderWidth: 0.75,
    });

    /* -------------------------------------------------------------- */
    /*  Corner accents (small decorative squares)                       */
    /* -------------------------------------------------------------- */

    const corners = [
      { x: MARGIN + 2, y: MARGIN + 2 },
      { x: PAGE_W - MARGIN - 8, y: MARGIN + 2 },
      { x: MARGIN + 2, y: PAGE_H - MARGIN - 8 },
      { x: PAGE_W - MARGIN - 8, y: PAGE_H - MARGIN - 8 },
    ];
    for (const c of corners) {
      page.drawRectangle({
        x: c.x,
        y: c.y,
        width: 6,
        height: 6,
        color: COL_GOLD,
      });
    }

    /* -------------------------------------------------------------- */
    /*  Decorative top line                                             */
    /* -------------------------------------------------------------- */

    const lineY = PAGE_H - 78;
    page.drawLine({
      start: { x: MARGIN + 60, y: lineY },
      end: { x: PAGE_W - MARGIN - 60, y: lineY },
      thickness: 1,
      color: COL_LINE,
    });

    /* -------------------------------------------------------------- */
    /*  Title: CERTIFICATE OF PRESENTATION                             */
    /* -------------------------------------------------------------- */

    const titleText = "CERTIFICATE OF PRESENTATION";
    const titleSize = 32;
    const titleW = fontBold.widthOfTextAtSize(titleText, titleSize);
    const titleY = PAGE_H - 110;

    page.drawText(titleText, {
      x: centerX(PAGE_W, titleW),
      y: titleY,
      size: titleSize,
      font: fontBold,
      color: COL_GOLD,
    });

    /* -------------------------------------------------------------- */
    /*  Subtitle                                                       */
    /* -------------------------------------------------------------- */

    const subText = "This is to certify that";
    const subSize = 14;
    const subW = fontItalic.widthOfTextAtSize(subText, subSize);
    const subY = titleY - 50;

    page.drawText(subText, {
      x: centerX(PAGE_W, subW),
      y: subY,
      size: subSize,
      font: fontItalic,
      color: COL_SUB,
    });

    /* -------------------------------------------------------------- */
    /*  Author name                                                    */
    /* -------------------------------------------------------------- */

    const nameText = authorName || "Participant";
    const nameSize = 28;
    const nameW = fontBold.widthOfTextAtSize(nameText, nameSize);
    const nameY = subY - 40;

    page.drawText(nameText, {
      x: centerX(PAGE_W, nameW),
      y: nameY,
      size: nameSize,
      font: fontBold,
      color: COL_DARK,
    });

    // Decorative underline below author name
    const underW = Math.min(nameW + 60, PAGE_W - 200);
    page.drawLine({
      start: { x: centerX(PAGE_W, underW), y: nameY - 8 },
      end: { x: centerX(PAGE_W, underW) + underW, y: nameY - 8 },
      thickness: 0.75,
      color: COL_LINE,
    });

    /* -------------------------------------------------------------- */
    /*  Description                                                    */
    /* -------------------------------------------------------------- */

    const descText = "has successfully presented a research paper at";
    const descSize = 14;
    const descW = fontRegular.widthOfTextAtSize(descText, descSize);
    const descY = nameY - 38;

    page.drawText(descText, {
      x: centerX(PAGE_W, descW),
      y: descY,
      size: descSize,
      font: fontRegular,
      color: COL_SUB,
    });

    /* -------------------------------------------------------------- */
    /*  Conference title                                                */
    /* -------------------------------------------------------------- */

    const confText = conferenceTitle || "Conference";
    const confSize = 22;
    const confW = fontBold.widthOfTextAtSize(confText, confSize);
    const confY = descY - 38;

    page.drawText(confText, {
      x: centerX(PAGE_W, confW),
      y: confY,
      size: confSize,
      font: fontBold,
      color: COL_DARK,
    });

    /* -------------------------------------------------------------- */
    /*  Paper title (optional)                                         */
    /* -------------------------------------------------------------- */

    let nextY = confY - 34;

    if (paperTitle) {
      const ptLabel = "Paper: ";
      const ptLabelSize = 12;
      const ptTitleSize = 13;

      const fullWidth =
        fontRegular.widthOfTextAtSize(ptLabel, ptLabelSize) +
        fontItalic.widthOfTextAtSize(paperTitle, ptTitleSize);

      // Truncate very long titles visually
      const maxWidth = PAGE_W - MARGIN * 2 - 120;
      const displayTitle =
        fullWidth > maxWidth
          ? paperTitle.substring(0, 70) + "…"
          : paperTitle;

      const displayW =
        fontRegular.widthOfTextAtSize(ptLabel, ptLabelSize) +
        fontItalic.widthOfTextAtSize(displayTitle, ptTitleSize);

      const ptX = centerX(PAGE_W, displayW);

      page.drawText(ptLabel, {
        x: ptX,
        y: nextY,
        size: ptLabelSize,
        font: fontRegular,
        color: COL_SUB,
      });

      page.drawText(displayTitle, {
        x: ptX + fontRegular.widthOfTextAtSize(ptLabel, ptLabelSize),
        y: nextY,
        size: ptTitleSize,
        font: fontItalic,
        color: COL_DARK,
      });

      nextY -= 28;
    }

    /* -------------------------------------------------------------- */
    /*  Bottom decorative line                                         */
    /* -------------------------------------------------------------- */

    const bottomLineY = MARGIN + 100;
    page.drawLine({
      start: { x: MARGIN + 60, y: bottomLineY },
      end: { x: PAGE_W - MARGIN - 60, y: bottomLineY },
      thickness: 0.5,
      color: COL_LINE,
    });

    /* -------------------------------------------------------------- */
    /*  Signature section                                              */
    /* -------------------------------------------------------------- */

    const sigY = MARGIN + 58;
    const sigLineW = 160;

    // Left signature
    const leftSigX = MARGIN + 80;
    page.drawLine({
      start: { x: leftSigX, y: sigY + 18 },
      end: { x: leftSigX + sigLineW, y: sigY + 18 },
      thickness: 0.75,
      color: COL_DARK,
    });

    const leftLabel = "Conference Chair";
    const leftLabelW = fontRegular.widthOfTextAtSize(leftLabel, 10);
    page.drawText(leftLabel, {
      x: leftSigX + (sigLineW - leftLabelW) / 2,
      y: sigY,
      size: 10,
      font: fontRegular,
      color: COL_SUB,
    });

    // Right signature
    const rightSigX = PAGE_W - MARGIN - 80 - sigLineW;
    page.drawLine({
      start: { x: rightSigX, y: sigY + 18 },
      end: { x: rightSigX + sigLineW, y: sigY + 18 },
      thickness: 0.75,
      color: COL_DARK,
    });

    const rightLabel = "Organizing Committee";
    const rightLabelW = fontRegular.widthOfTextAtSize(rightLabel, 10);
    page.drawText(rightLabel, {
      x: rightSigX + (sigLineW - rightLabelW) / 2,
      y: sigY,
      size: 10,
      font: fontRegular,
      color: COL_SUB,
    });

    /* -------------------------------------------------------------- */
    /*  Date                                                           */
    /* -------------------------------------------------------------- */

    const dateText = `Issued on: ${formatDate(new Date())}`;
    const dateSize = 10;
    const dateW = fontRegular.widthOfTextAtSize(dateText, dateSize);

    page.drawText(dateText, {
      x: centerX(PAGE_W, dateW),
      y: sigY - 18,
      size: dateSize,
      font: fontRegular,
      color: COL_SUB,
    });

    /* -------------------------------------------------------------- */
    /*  Verification code + QR code                                    */
    /* -------------------------------------------------------------- */

    const verificationCode = generateVerificationCode();

    // Verification text (bottom-left area)
    const vcText = `Verification: ${verificationCode}`;
    const vcSize = 7;

    page.drawText(vcText, {
      x: MARGIN + 14,
      y: MARGIN + 14,
      size: vcSize,
      font: fontRegular,
      color: COL_SUB,
    });

    // QR code (bottom-right corner)
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify/${verificationCode}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 200,
      margin: 1,
      color: { dark: "#1E1E24", light: "#FAF8F0" },
    });

    // Decode base64 data URL and embed into PDF
    const qrBase64 = qrDataUrl.split(",")[1];
    const qrBytes = Uint8Array.from(atob(qrBase64), (ch) => ch.charCodeAt(0));
    const qrImage = await pdfDoc.embedPng(qrBytes);

    const qrSize = 52;
    const qrX = PAGE_W - MARGIN - qrSize - 14;
    const qrY = MARGIN + 14;

    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    });

    // "Scan to verify" label below QR
    const scanLabel = "Scan to verify";
    const scanLabelSize = 5.5;
    const scanLabelW = fontRegular.widthOfTextAtSize(scanLabel, scanLabelSize);
    page.drawText(scanLabel, {
      x: qrX + (qrSize - scanLabelW) / 2,
      y: qrY - 8,
      size: scanLabelSize,
      font: fontRegular,
      color: COL_SUB,
    });

    /* -------------------------------------------------------------- */
    /*  Save & upload                                                  */
    /* -------------------------------------------------------------- */

    const pdfBytes = await pdfDoc.save();

    // Compute SHA-256 hash for tamper protection
    const pdfHash = crypto
      .createHash("sha256")
      .update(pdfBytes)
      .digest("hex");

    // Structured path: conference_id/paper_id/author_id.pdf
    const storagePath = conferenceId
      ? `${conferenceId}/${paperId}/${authorId}.pdf`
      : `${paperId}/${authorId}.pdf`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("certificates")
      .upload(storagePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data } = supabaseAdmin.storage
      .from("certificates")
      .getPublicUrl(storagePath);

    /* -------------------------------------------------------------- */
    /*  Insert certificate record                                      */
    /* -------------------------------------------------------------- */

    const { data: certRow, error: insertError } = await supabaseAdmin
      .from("certificates")
      .insert({
        paper_id: paperId,
        author_id: authorId,
        conference_id: conferenceId || null,
        certificate_type: "presentation",
        file_url: data.publicUrl,
        verification_code: verificationCode,
        pdf_hash: pdfHash,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Certificate DB insert error:", insertError);
      // Still return the URL even if DB insert fails
    }

    return NextResponse.json({
      success: true,
      existing: false,
      url: data.publicUrl,
      certificateId: certRow?.id || null,
      verificationCode,
    });

  } catch (err: any) {
    console.error("CERT API ERROR:", err);

    return NextResponse.json(
      { error: err.message || "Server error generating certificate" },
      { status: 500 }
    );
  }
}