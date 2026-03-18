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

type TextSegment = { text: string; isBold?: boolean };
type TextAtom = { text: string; isBold: boolean; width: number };

function createAtoms(segments: TextSegment[], fontRegular: any, fontBold: any, size: number): TextAtom[] {
  const atoms: TextAtom[] = [];
  for (const seg of segments) {
    const font = seg.isBold ? fontBold : fontRegular;
    const tokens = seg.text.split(/(\s+)/);
    for (const token of tokens) {
      if (!token) continue;
      if (/\s+/.test(token)) {
        for (let i = 0; i < token.length; i++) {
          atoms.push({ text: token[i], isBold: !!seg.isBold, width: font.widthOfTextAtSize(token[i], size) });
        }
      } else {
        atoms.push({ text: token, isBold: !!seg.isBold, width: font.widthOfTextAtSize(token, size) });
      }
    }
  }
  return atoms;
}

function wrapAtoms(atoms: TextAtom[], maxWidth: number) {
  const lines: { atoms: TextAtom[]; width: number }[] = [];
  let currentAtoms: TextAtom[] = [];
  let currentWidth = 0;

  for (const atom of atoms) {
    if (currentWidth + atom.width > maxWidth && currentAtoms.length > 0) {
      if (atom.text === " ") continue;
      lines.push({ atoms: currentAtoms, width: currentWidth });
      currentAtoms = [atom];
      currentWidth = atom.width;
    } else {
      currentAtoms.push(atom);
      currentWidth += atom.width;
    }
  }
  if (currentAtoms.length > 0) {
    lines.push({ atoms: currentAtoms, width: currentWidth });
  }

  for (const line of lines) {
    while (line.atoms.length > 0 && line.atoms[line.atoms.length - 1].text === " ") {
      const popped = line.atoms.pop()!;
      line.width -= popped.width;
    }
    while (line.atoms.length > 0 && line.atoms[0].text === " ") {
      const shifted = line.atoms.shift()!;
      line.width -= shifted.width;
    }
  }

  return lines;
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
    /*  Fetch conference + organization details                        */
    /* -------------------------------------------------------------- */

    let organizationName = "";
    let resolvedConferenceTitle = conferenceTitle || "International Academic Conference";
    let organizationLogoUrl: string | null = null;
    let conferenceDates = "";

    if (conferenceId) {
      const { data: conference } = await supabaseAdmin
        .from("conferences")
        .select(`
          title,
          short_name,
          conference_logo_url,
          start_date,
          end_date,
          organizations (
            name,
            logo_url
          )
        `)
        .eq("id", conferenceId)
        .single();

      if (conference) {
        resolvedConferenceTitle = conference.title || resolvedConferenceTitle;
        const org = conference.organizations as any;
        organizationName = org?.name || "";
        organizationLogoUrl = org?.logo_url || null;

        if (conference.start_date) {
          const start = formatDate(new Date(conference.start_date));
          const end = conference.end_date
            ? formatDate(new Date(conference.end_date))
            : null;
          conferenceDates = end ? `${start} – ${end}` : start;
        }
      }
    }

    /* Fetch author affiliation */
    let authorAffiliation = "";
    if (authorId) {
      const { data: authorRow } = await supabaseAdmin
        .from("paper_authors")
        .select("affiliation")
        .eq("id", authorId)
        .maybeSingle();
      authorAffiliation = authorRow?.affiliation || "";
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
    /*  Single elegant border                                          */
    /* -------------------------------------------------------------- */

    page.drawRectangle({
      x: MARGIN,
      y: MARGIN,
      width: PAGE_W - MARGIN * 2,
      height: PAGE_H - MARGIN * 2,
      borderColor: COL_GOLD,
      borderWidth: 1.5,
    });

    /* ============================================================== */
    /*  LAYOUT — True Centered Block Approach                          */
    /*                                                                 */
    /*  1. HEADER: Anchored at top (logo + org + conf name)            */
    /*  2. CORE BLOCK: (Title + Name + Paragraph) EXACTLY CENTERED     */
    /*  3. SIGNATURES: Lower 25% of the page                           */
    /*  4. FOOTER: Anchored at bottom margin                           */
    /* ============================================================== */

    /* ---- Formatting Constants ---- */
    const SIZE_ORG    = 18; // Increased from 16
    const SIZE_CONF   = 12; // Retained
    const SIZE_TITLE  = 40; // Retained
    const SIZE_BODY   = 15;
    const SIZE_SIG    = 10;
    const SIZE_FOOT   = 9;

    const BODY_MAX_W  = 440; // Narrower width for Word-like centering
    const GAP_LINE    = 20;  // 20px consistent line height


    /* ---- Prepare Text ---- */
    const nameText = authorName || "Participant";

    const segments: TextSegment[] = [
      { text: "This is to certify that " },
      { text: nameText, isBold: true },
    ];
    if (authorAffiliation) {
      segments.push({ text: " from " });
      segments.push({ text: authorAffiliation, isBold: true });
    }
    segments.push({ text: " has presented a paper " });
    if (paperTitle) {
      segments.push({ text: `entitled \u201C` });
      segments.push({ text: paperTitle, isBold: true });
      segments.push({ text: `\u201D ` });
    }
    segments.push({ text: "at the " });
    segments.push({ text: resolvedConferenceTitle, isBold: false });
    if (conferenceDates) {
      segments.push({ text: ` held during ${conferenceDates}.` });
    } else {
      segments.push({ text: "." });
    }

    const atoms = createAtoms(segments, fontRegular, fontBold, SIZE_BODY);
    const bodyLines = wrapAtoms(atoms, BODY_MAX_W);

    /* ---- Math: Calculate the height of the CORE BLOCK ---- */
    // Compute total block height to vertically center the entire flow.
    let totalBlockHeight = 0;
    const logoGap  = 12; // Increased
    const orgGap   = 16; // Increased
    const confGap  = 22; // Conf -> Anchor
    
    // Add additional sizing for our inserted graphical anchor structure
    const anchorHeight = 4;
    const anchorGap = 20; // Anchor -> CERTIFICATE
    const titleGap = 26; // CERTIFICATE -> Paragraph (Reduced)

    if (organizationLogoUrl) totalBlockHeight += 44 + logoGap;
    if (organizationName) totalBlockHeight += SIZE_ORG + orgGap;
    totalBlockHeight += SIZE_CONF + confGap;
    totalBlockHeight += anchorHeight + anchorGap;
    totalBlockHeight += SIZE_TITLE + titleGap;
    
    // Paragraph height: (N-1)*GAP_LINE + SIZE_BODY
    totalBlockHeight += ((bodyLines.length > 0 ? bodyLines.length - 1 : 0) * GAP_LINE) + SIZE_BODY;

    // Center the whole unified block in available space, then bias upward by ~65px
    let curY = (PAGE_H / 2) + (totalBlockHeight / 2) + 65;

    /* -------------------------------------------------------------- */
    /*  1. HEADER SECTION (Unified Flow)                               */
    /* -------------------------------------------------------------- */

    if (organizationLogoUrl) {
      try {
        const logoRes = await fetch(organizationLogoUrl);
        if (logoRes.ok) {
          const logoArrayBuf = await logoRes.arrayBuffer();
          const logoBytes    = new Uint8Array(logoArrayBuf);
          let logoImage;
          try   { logoImage = await pdfDoc.embedPng(logoBytes); }
          catch { logoImage = await pdfDoc.embedJpg(logoBytes); }
          const logoDim = logoImage.scaleToFit(44, 44);
          
          curY -= logoDim.height;
          page.drawImage(logoImage, {
            x: centerX(PAGE_W, logoDim.width),
            y: curY,
            width: logoDim.width,
            height: logoDim.height,
          });
          curY -= logoGap;
        }
      } catch (logoErr) {
        console.warn("Could not embed organization logo:", logoErr);
      }
    }

    if (organizationName) {
      curY -= SIZE_ORG;
      const orgW = fontBold.widthOfTextAtSize(organizationName, SIZE_ORG);
      page.drawText(organizationName, {
        x: centerX(PAGE_W, orgW),
        y: curY,
        size: SIZE_ORG,
        font: fontBold,
        color: COL_TEXT,
      });
      curY -= orgGap;
    }

    {
      curY -= SIZE_CONF;
      const confW = fontRegular.widthOfTextAtSize(resolvedConferenceTitle, SIZE_CONF);
      page.drawText(resolvedConferenceTitle, {
        x: centerX(PAGE_W, confW),
        y: curY,
        size: SIZE_CONF,
        font: fontRegular,
        color: COL_SUB,
      });
      curY -= confGap;
    }
    
    // Introduce Header Anchor divider (Decorative line)
    curY -= anchorHeight;
    const anchorWidth = 60; // short, centered elegant rule
    const ax = centerX(PAGE_W, anchorWidth);
    page.drawLine({
      start: { x: ax, y: curY + 2 },
      end:   { x: ax + anchorWidth, y: curY + 2 },
      thickness: 1.5,
      color: COL_GOLD,
    });
    curY -= anchorGap;

    /* -------------------------------------------------------------- */
    /*  2. TITLE & CERTIFYING PARAGRAPH                                */
    /* -------------------------------------------------------------- */

    // --- TITLE ---
    curY -= SIZE_TITLE;
    const titleW = fontBold.widthOfTextAtSize("CERTIFICATE", SIZE_TITLE);
    page.drawText("CERTIFICATE", {
      x: centerX(PAGE_W, titleW),
      y: curY,
      size: SIZE_TITLE,
      font: fontBold,
      color: COL_PRIMARY,
    });
    curY -= titleGap;

    // --- CERTIFYING PARAGRAPH (Pseudo-Justified) ---
    // Start drawing body lines
    curY -= SIZE_BODY; // first line baseline
    for (let i = 0; i < bodyLines.length; i++) {
      const line = bodyLines[i];
      const isLastLine = i === bodyLines.length - 1;
      let spaceToAdd = 0;
      let spaceCount = 0;
      
      if (!isLastLine) {
        spaceCount = line.atoms.filter((a) => a.text === " ").length;
        if (spaceCount > 0) {
          // distribute remaining spacing evenly across the spaces
          spaceToAdd = Math.max(0, (BODY_MAX_W - line.width) / spaceCount);
        }
      }

      // If pseudo-justifying, curX starts so total width occupies BODY_MAX_W.
      // If it's the last line, it centers just normally.
      let curX = (!isLastLine && spaceCount > 0) 
                 ? centerX(PAGE_W, BODY_MAX_W) 
                 : centerX(PAGE_W, line.width);

      for (const atom of line.atoms) {
        page.drawText(atom.text, {
          x: curX,
          y: curY,
          size: SIZE_BODY,
          font: atom.isBold ? fontBold : fontRegular,
          color: COL_TEXT,
        });
        curX += atom.width + (atom.text === " " ? spaceToAdd : 0);
      }
      curY -= GAP_LINE;
    }

    /* -------------------------------------------------------------- */
    /*  3. SIGNATURE SECTION (Lower 25%)                               */
    /* -------------------------------------------------------------- */
    
    // Position signatures with clear separation globally anchored lower
    const sigY   = MARGIN + 60; // Slightly lower anchored to increase paragraph gap
    const sigW   = 120;
    const colW   = (PAGE_W - MARGIN * 2) / 3;
    const sigLabels = ["Convener", "Principal", "Director"];

    for (let i = 0; i < 3; i++) {
      const cx  = MARGIN + colW * i + colW / 2;
      const lx  = cx - sigW / 2;

      page.drawLine({
        start: { x: lx, y: sigY + 18 },
        end:   { x: lx + sigW, y: sigY + 18 },
        thickness: 0.5,
        color: COL_TEXT,
      });

      const lbl  = sigLabels[i];
      const lblW = fontRegular.widthOfTextAtSize(lbl, SIZE_SIG);
      page.drawText(lbl, {
        x: cx - lblW / 2,
        y: sigY + 3,
        size: SIZE_SIG,
        font: fontRegular,
        color: COL_SUB,
      });
    }

    /* -------------------------------------------------------------- */
    /*  4. FOOTER (Bottom Margin Anchored)                             */
    /* -------------------------------------------------------------- */
    
    /* ---- Fixed footer baseline ---- */
    const FOOTER_BASE = MARGIN + 12;

    const verificationCode = generateVerificationCode();

    // Left — verification
    const vcText = `Verification: ${verificationCode}`;
    page.drawText(vcText, {
      x: MARGIN + 12,
      y: FOOTER_BASE,
      size: SIZE_FOOT,
      font: fontRegular,
      color: COL_SUB,
    });

    // Center — branding
    const brandText = "Powered by AcadFlow";
    const brandW    = fontRegular.widthOfTextAtSize(brandText, SIZE_FOOT);
    page.drawText(brandText, {
      x: centerX(PAGE_W, brandW),
      y: FOOTER_BASE,
      size: SIZE_FOOT,
      font: fontRegular,
      color: COL_SUB,
    });

    const dateStr  = `Issued: ${formatDate(new Date())}`;
    const dateW    = fontRegular.widthOfTextAtSize(dateStr, SIZE_FOOT);
    page.drawText(dateStr, {
      x: centerX(PAGE_W, dateW),
      y: FOOTER_BASE + 14,
      size: SIZE_FOOT,
      font: fontRegular,
      color: COL_SUB,
    });

    // Right — QR Code
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify/${verificationCode}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 200,
      margin: 1,
      color: { dark: "#1E1E24", light: "#FAF8F0" },
    });
    const qrBase64 = qrDataUrl.split(",")[1];
    const qrBytes  = Uint8Array.from(atob(qrBase64), (ch) => ch.charCodeAt(0));
    const qrImage  = await pdfDoc.embedPng(qrBytes);

    const QR_DIM   = 40;
    const qrX      = PAGE_W - MARGIN - QR_DIM - 12;
    const qrY      = FOOTER_BASE - 4;

    page.drawImage(qrImage, { x: qrX, y: qrY, width: QR_DIM, height: QR_DIM });

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