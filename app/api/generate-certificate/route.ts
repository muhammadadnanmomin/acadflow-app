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
/*  AcadFlow color palette                                             */
/* ------------------------------------------------------------------ */

const COL_PRIMARY = rgb(0.16, 0.24, 0.46);    // deep academic blue
const COL_GOLD = rgb(0.72, 0.53, 0.04);       // gold accent
const COL_TEXT = rgb(0.12, 0.12, 0.14);       // main text
const COL_SUB = rgb(0.4, 0.4, 0.45);          // secondary text
const COL_BG = rgb(0.98, 0.97, 0.94);         // warm background
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
    /*  Decorative border (enhanced double frame)                       */
    /* -------------------------------------------------------------- */

    // Outer border (slightly thicker)
    page.drawRectangle({
      x: MARGIN,
      y: MARGIN,
      width: PAGE_W - MARGIN * 2,
      height: PAGE_H - MARGIN * 2,
      borderColor: COL_LINE,
      borderWidth: 2.5,
    });

    // Inner border (thin)
    const INNER = MARGIN + 10;
    page.drawRectangle({
      x: INNER,
      y: INNER,
      width: PAGE_W - INNER * 2,
      height: PAGE_H - INNER * 2,
      borderColor: COL_LINE,
      borderWidth: 0.75,
    });

    /* -------------------------------------------------------------- */
    /*  Corner accents (decorative squares)                             */
    /* -------------------------------------------------------------- */

    const cSz = 7;
    const corners = [
      { x: MARGIN + 2, y: MARGIN + 2 },
      { x: PAGE_W - MARGIN - cSz - 1, y: MARGIN + 2 },
      { x: MARGIN + 2, y: PAGE_H - MARGIN - cSz - 1 },
      { x: PAGE_W - MARGIN - cSz - 1, y: PAGE_H - MARGIN - cSz - 1 },
    ];
    for (const c of corners) {
      page.drawRectangle({
        x: c.x,
        y: c.y,
        width: cSz,
        height: cSz,
        color: COL_GOLD,
      });
    }

    /* -------------------------------------------------------------- */
    /*  Conference header section                                       */
    /* -------------------------------------------------------------- */

    const headerText = conferenceTitle || "International Academic Conference";
    const headerSize = 18;
    const headerW = fontBold.widthOfTextAtSize(headerText, headerSize);
    const headerY = PAGE_H - 80;

    page.drawText(headerText, {
      x: centerX(PAGE_W, headerW),
      y: headerY,
      size: headerSize,
      font: fontBold,
      color: COL_PRIMARY,
    });

    const subHeaderText = "International Academic Conference";
    const subHeaderSize = 10;
    const subHeaderW = fontRegular.widthOfTextAtSize(subHeaderText, subHeaderSize);
    const subHeaderY = headerY - 18;

    page.drawText(subHeaderText, {
      x: centerX(PAGE_W, subHeaderW),
      y: subHeaderY,
      size: subHeaderSize,
      font: fontRegular,
      color: COL_SUB,
    });

    /* -------------------------------------------------------------- */
    /*  Decorative line below header                                    */
    /* -------------------------------------------------------------- */

    const lineY = subHeaderY - 14;
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
    const titleY = lineY - 36;

    page.drawText(titleText, {
      x: centerX(PAGE_W, titleW),
      y: titleY,
      size: titleSize,
      font: fontBold,
      color: COL_GOLD,
    });

    /* -------------------------------------------------------------- */
    /*  "This is to certify that"                                       */
    /* -------------------------------------------------------------- */

    const certifyText = "This is to certify that";
    const certifySize = 14;
    const certifyW = fontItalic.widthOfTextAtSize(certifyText, certifySize);
    const certifyY = titleY - 42;

    page.drawText(certifyText, {
      x: centerX(PAGE_W, certifyW),
      y: certifyY,
      size: certifySize,
      font: fontItalic,
      color: COL_SUB,
    });

    /* -------------------------------------------------------------- */
    /*  Author name (visual focus – largest body text)                  */
    /* -------------------------------------------------------------- */

    const nameText = authorName || "Participant";
    const nameSize = 30;
    const nameW = fontBold.widthOfTextAtSize(nameText, nameSize);
    const nameY = certifyY - 38;

    page.drawText(nameText, {
      x: centerX(PAGE_W, nameW),
      y: nameY,
      size: nameSize,
      font: fontBold,
      color: COL_TEXT,
    });

    // Decorative underline below author name
    const underW = Math.min(nameW + 60, PAGE_W - 200);
    page.drawLine({
      start: { x: centerX(PAGE_W, underW), y: nameY - 10 },
      end: { x: centerX(PAGE_W, underW) + underW, y: nameY - 10 },
      thickness: 0.75,
      color: COL_LINE,
    });

    /* -------------------------------------------------------------- */
    /*  "has presented a research paper entitled"                       */
    /* -------------------------------------------------------------- */

    const desc1Text = "has presented a research paper entitled";
    const descSize = 14;
    const desc1W = fontRegular.widthOfTextAtSize(desc1Text, descSize);
    const desc1Y = nameY - 34;

    page.drawText(desc1Text, {
      x: centerX(PAGE_W, desc1W),
      y: desc1Y,
      size: descSize,
      font: fontRegular,
      color: COL_SUB,
    });

    /* -------------------------------------------------------------- */
    /*  Paper title (italic, in quotes)                                 */
    /* -------------------------------------------------------------- */

    let nextY = desc1Y - 26;

    if (paperTitle) {
      const ptTitleSize = 14;
      const maxWidth = PAGE_W - MARGIN * 2 - 120;

      // Add quotes around paper title
      const quotedTitle = `\u201C${paperTitle}\u201D`;
      const quotedW = fontItalic.widthOfTextAtSize(quotedTitle, ptTitleSize);

      // Truncate very long titles visually
      const displayTitle =
        quotedW > maxWidth
          ? `\u201C${paperTitle.substring(0, 65)}\u2026\u201D`
          : quotedTitle;

      const displayW = fontItalic.widthOfTextAtSize(displayTitle, ptTitleSize);

      page.drawText(displayTitle, {
        x: centerX(PAGE_W, displayW),
        y: nextY,
        size: ptTitleSize,
        font: fontItalic,
        color: COL_TEXT,
      });

      nextY -= 26;
    }

    /* -------------------------------------------------------------- */
    /*  "at the" + Conference title                                     */
    /* -------------------------------------------------------------- */

    const atTheText = "at the";
    const atTheW = fontRegular.widthOfTextAtSize(atTheText, descSize);
    page.drawText(atTheText, {
      x: centerX(PAGE_W, atTheW),
      y: nextY,
      size: descSize,
      font: fontRegular,
      color: COL_SUB,
    });

    nextY -= 26;

    const confText = conferenceTitle || "Conference";
    const confSize = 18;
    const confW = fontBold.widthOfTextAtSize(confText, confSize);

    page.drawText(confText, {
      x: centerX(PAGE_W, confW),
      y: nextY,
      size: confSize,
      font: fontBold,
      color: COL_PRIMARY,
    });

    nextY -= 22;

    /* -------------------------------------------------------------- */
    /*  "organized under the Academic Conference Program."              */
    /* -------------------------------------------------------------- */

    const orgText = "organized under the Academic Conference Program.";
    const orgW = fontRegular.widthOfTextAtSize(orgText, 11);
    page.drawText(orgText, {
      x: centerX(PAGE_W, orgW),
      y: nextY,
      size: 11,
      font: fontRegular,
      color: COL_SUB,
    });

    nextY -= 22;

    /* -------------------------------------------------------------- */
    /*  Recognition line                                                */
    /* -------------------------------------------------------------- */

    const recogText = "This certificate is awarded in recognition of the author\u2019s valuable";
    const recogW = fontItalic.widthOfTextAtSize(recogText, 10);
    page.drawText(recogText, {
      x: centerX(PAGE_W, recogW),
      y: nextY,
      size: 10,
      font: fontItalic,
      color: COL_SUB,
    });

    const recog2Text = "contribution to academic research and scholarly discussion.";
    const recog2W = fontItalic.widthOfTextAtSize(recog2Text, 10);
    page.drawText(recog2Text, {
      x: centerX(PAGE_W, recog2W),
      y: nextY - 14,
      size: 10,
      font: fontItalic,
      color: COL_SUB,
    });

    /* -------------------------------------------------------------- */
    /*  Bottom decorative line                                         */
    /* -------------------------------------------------------------- */

    const bottomLineY = MARGIN + 110;
    page.drawLine({
      start: { x: MARGIN + 60, y: bottomLineY },
      end: { x: PAGE_W - MARGIN - 60, y: bottomLineY },
      thickness: 0.5,
      color: COL_LINE,
    });

    /* -------------------------------------------------------------- */
    /*  Signature section (wider spacing)                               */
    /* -------------------------------------------------------------- */

    const sigY = MARGIN + 68;
    const sigLineW = 170;

    // Left signature
    const leftSigX = MARGIN + 70;
    page.drawLine({
      start: { x: leftSigX, y: sigY + 20 },
      end: { x: leftSigX + sigLineW, y: sigY + 20 },
      thickness: 0.75,
      color: COL_TEXT,
    });

    const leftLabel = "Conference Chair";
    const leftLabelW = fontRegular.widthOfTextAtSize(leftLabel, 10);
    page.drawText(leftLabel, {
      x: leftSigX + (sigLineW - leftLabelW) / 2,
      y: sigY + 4,
      size: 10,
      font: fontRegular,
      color: COL_SUB,
    });

    // Right signature
    const rightSigX = PAGE_W - MARGIN - 70 - sigLineW;
    page.drawLine({
      start: { x: rightSigX, y: sigY + 20 },
      end: { x: rightSigX + sigLineW, y: sigY + 20 },
      thickness: 0.75,
      color: COL_TEXT,
    });

    const rightLabel = "Organizing Committee";
    const rightLabelW = fontRegular.widthOfTextAtSize(rightLabel, 10);
    page.drawText(rightLabel, {
      x: rightSigX + (sigLineW - rightLabelW) / 2,
      y: sigY + 4,
      size: 10,
      font: fontRegular,
      color: COL_SUB,
    });

    /* -------------------------------------------------------------- */
    /*  Date + AcadFlow branding                                       */
    /* -------------------------------------------------------------- */

    const dateText = `Issued on: ${formatDate(new Date())}`;
    const dateSize = 10;
    const dateW = fontRegular.widthOfTextAtSize(dateText, dateSize);

    page.drawText(dateText, {
      x: centerX(PAGE_W, dateW),
      y: sigY - 14,
      size: dateSize,
      font: fontRegular,
      color: COL_SUB,
    });

    // "Powered by AcadFlow" branding
    const brandText = "Powered by AcadFlow";
    const brandSize = 8;
    const brandW = fontRegular.widthOfTextAtSize(brandText, brandSize);
    page.drawText(brandText, {
      x: centerX(PAGE_W, brandW),
      y: sigY - 28,
      size: brandSize,
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