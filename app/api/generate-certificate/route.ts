import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

/* ------------------------------------------------------------------ */
/*  POST handler                                                       */
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  try {
    const { paperId, authorName, conferenceTitle, paperTitle } =
      await req.json();

    if (!paperId) {
      return NextResponse.json(
        { error: "Missing paperId" },
        { status: 400 }
      );
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
    /*  Save & upload (unchanged)                                      */
    /* -------------------------------------------------------------- */

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