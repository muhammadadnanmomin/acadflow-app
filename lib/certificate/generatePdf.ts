/* ================================================================
   AcadFlow — PDF Certificate Generator
   Supports multiple certificate types (participation, best_paper).
   ================================================================ */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { CertificateData, CertificateType } from "./types";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PAGE_W = 842; // A4 landscape
const PAGE_H = 595;
const MARGIN = 40;

/* ------------------------------------------------------------------ */
/*  Color palette                                                      */
/* ------------------------------------------------------------------ */

const COL_PRIMARY = rgb(0.16, 0.24, 0.46);  // deep academic blue
const COL_GOLD    = rgb(0.72, 0.53, 0.04);  // gold accent
const COL_TEXT    = rgb(0.12, 0.12, 0.14);  // main text
const COL_SUB     = rgb(0.4,  0.4,  0.45);  // secondary text
const COL_BG      = rgb(0.98, 0.97, 0.94);  // warm background
const COL_CRIMSON = rgb(0.55, 0.0, 0.0);    // best paper emphasis

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

function centerX(pageWidth: number, textWidth: number) {
  return (pageWidth - textWidth) / 2;
}

function fmtDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type TextSegment = { text: string; isBold?: boolean };
type TextAtom    = { text: string; isBold: boolean; width: number };

function createAtoms(
  segments: TextSegment[],
  fontRegular: any,
  fontBold: any,
  size: number
): TextAtom[] {
  const atoms: TextAtom[] = [];
  for (const seg of segments) {
    const font   = seg.isBold ? fontBold : fontRegular;
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
  if (currentAtoms.length > 0) lines.push({ atoms: currentAtoms, width: currentWidth });

  for (const line of lines) {
    while (line.atoms.length > 0 && line.atoms[line.atoms.length - 1].text === " ") {
      const p = line.atoms.pop()!;
      line.width -= p.width;
    }
    while (line.atoms.length > 0 && line.atoms[0].text === " ") {
      const s = line.atoms.shift()!;
      line.width -= s.width;
    }
  }

  return lines;
}

/* ------------------------------------------------------------------ */
/*  Body-text segment builders per certificate type                    */
/* ------------------------------------------------------------------ */

function buildParticipationSegments(data: CertificateData): TextSegment[] {
  const segments: TextSegment[] = [
    { text: "This is to certify that " },
    { text: data.authorName || "Participant", isBold: true },
  ];
  if (data.authorAffiliation) {
    segments.push({ text: " from " });
    segments.push({ text: data.authorAffiliation, isBold: true });
  }
  segments.push({ text: " has presented a paper " });
  if (data.paperTitle) {
    segments.push({ text: `entitled \u201C` });
    segments.push({ text: data.paperTitle, isBold: true });
    segments.push({ text: `\u201D ` });
  }
  segments.push({ text: "at the " });
  segments.push({ text: data.conferenceTitle });
  if (data.conferenceDates) {
    segments.push({ text: ` held during ${data.conferenceDates}.` });
  } else {
    segments.push({ text: "." });
  }
  return segments;
}

function buildBestPaperSegments(data: CertificateData): TextSegment[] {
  const segments: TextSegment[] = [
    { text: "This is to certify that the paper" },
  ];
  if (data.paperTitle) {
    segments.push({ text: ` entitled \u201C` });
    segments.push({ text: data.paperTitle, isBold: true });
    segments.push({ text: `\u201D` });
  }
  segments.push({ text: " by " });
  segments.push({ text: data.authorName || "Participant", isBold: true });
  if (data.authorAffiliation) {
    segments.push({ text: " from " });
    segments.push({ text: data.authorAffiliation, isBold: true });
  }
  segments.push({ text: ` has been selected as the ` });
  segments.push({ text: "Best Paper", isBold: true });
  segments.push({ text: ` at the ${data.conferenceTitle}` });
  if (data.conferenceDates) {
    segments.push({ text: ` held during ${data.conferenceDates}` });
  }
  segments.push({ text: " for its outstanding contribution to the field." });
  return segments;
}

const SEGMENT_BUILDERS: Record<CertificateType, (data: CertificateData) => TextSegment[]> = {
  participation: buildParticipationSegments,
  best_paper: buildBestPaperSegments,
};

/* ------------------------------------------------------------------ */
/*  Title config per type                                              */
/* ------------------------------------------------------------------ */

interface TitleConfig {
  text: string;
  color: typeof COL_PRIMARY;
  size: number;
}

const TITLE_CONFIG: Record<CertificateType, TitleConfig> = {
  participation: { text: "CERTIFICATE", color: COL_PRIMARY, size: 40 },
  best_paper: { text: "BEST PAPER AWARD", color: COL_CRIMSON, size: 34 },
};

const DEFAULT_AWARD_TEXT: Partial<Record<CertificateType, string>> = {
  best_paper:
    "This paper has been selected as the Best Paper for its outstanding contribution.",
};

/* ------------------------------------------------------------------ */
/*  Multi-org logo renderer                                            */
/* ------------------------------------------------------------------ */

async function renderOrganizationLogos(
  pdfDoc: any,
  page: any,
  fontBold: any,
  orgs: CertificateData["conferenceOrgs"],
  startY: number
): Promise<{ endY: number; sectionHeight: number }> {
  if (orgs.length === 0) return { endY: startY, sectionHeight: 0 };

  const LOGO_MAX   = 50;
  const NAME_SIZE  = 11;
  const NAME_GAP   = 6;
  const BOTTOM_PAD = 0;

  const SLOT_WIDTH  = orgs.length === 4 ? 140 : 160;
  const COL_W       = SLOT_WIDTH - 15;
  const startX      = PAGE_W / 2 - ((orgs.length - 1) * SLOT_WIDTH) / 2;
  const xCentresRow = orgs.map((_, i) => startX + i * SLOT_WIDTH);

  interface LogoData { image: any | null; width: number; height: number; }
  const logoData: LogoData[] = [];

  for (const org of orgs) {
    if (!org.logo_url) { logoData.push({ image: null, width: 0, height: 0 }); continue; }
    try {
      const res = await fetch(org.logo_url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = new Uint8Array(await res.arrayBuffer());
      let img: any;
      try   { img = await pdfDoc.embedPng(buf); }
      catch { img = await pdfDoc.embedJpg(buf); }
      const dim = img.scaleToFit(LOGO_MAX, LOGO_MAX);
      logoData.push({ image: img, width: dim.width, height: dim.height });
    } catch {
      logoData.push({ image: null, width: 0, height: 0 });
    }
  }

  const maxLogoH      = Math.max(...logoData.map((l) => l.height), 0);
  const rowH          = maxLogoH + NAME_GAP + NAME_SIZE * 2;
  const sectionHeight = rowH + BOTTOM_PAD;
  const logoBaseY     = startY - maxLogoH;

  for (let i = 0; i < orgs.length; i++) {
    const org  = orgs[i];
    const logo = logoData[i];
    const cx   = xCentresRow[i];

    if (logo.image) {
      page.drawImage(logo.image, {
        x: cx - logo.width / 2,
        y: logoBaseY,
        width: logo.width,
        height: logo.height,
      });
    }

    const nameBaseY = logoBaseY - NAME_GAP - NAME_SIZE + 2;
    const words = org.name.split(" ");
    let line1 = "", line2 = "";
    for (const word of words) {
      const cand1 = line1 ? `${line1} ${word}` : word;
      if (fontBold.widthOfTextAtSize(cand1, NAME_SIZE) <= COL_W) {
        line1 = cand1;
      } else if (!line2) {
        line2 = word;
      } else {
        const cand2 = `${line2} ${word}`;
        if (fontBold.widthOfTextAtSize(cand2, NAME_SIZE) <= COL_W) line2 = cand2;
      }
    }
    for (const [idx, lineText] of ([line1, line2] as string[]).entries()) {
      if (!lineText) continue;
      const lw = fontBold.widthOfTextAtSize(lineText, NAME_SIZE);
      page.drawText(lineText, {
        x: cx - lw / 2,
        y: nameBaseY - idx * (NAME_SIZE + 2),
        size: NAME_SIZE,
        font: fontBold,
        color: COL_TEXT,
      });
    }
  }

  return { endY: startY - sectionHeight, sectionHeight };
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

export async function generateCertificatePdf(data: CertificateData): Promise<Uint8Array> {
  const {
    certificateType = "participation",
    authorName,
    authorAffiliation,
    paperTitle,
    conferenceTitle,
    conferenceDates,
    verificationCode,
    issuedAt,
    conferenceOrgs,
    conferenceSignatures,
    awardText,
  } = data;

  const pdfDoc = await PDFDocument.create();
  const page   = pdfDoc.addPage([PAGE_W, PAGE_H]);

  const fontBold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  /* Background */
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: COL_BG });

  /* Border */
  const borderColor = certificateType === "best_paper" ? COL_CRIMSON : COL_GOLD;
  page.drawRectangle({
    x: MARGIN, y: MARGIN,
    width: PAGE_W - MARGIN * 2, height: PAGE_H - MARGIN * 2,
    borderColor,
    borderWidth: certificateType === "best_paper" ? 2.0 : 1.5,
  });

  /* ---- Formatting constants ---- */
  const titleConfig = TITLE_CONFIG[certificateType] ?? TITLE_CONFIG.participation;
  const SIZE_CONF  = 12;
  const SIZE_BODY  = 15;
  const SIZE_SIG   = 10;
  const SIZE_FOOT  = 9;
  const SIZE_AWARD = 11;
  const BODY_MAX_W = 440;
  const GAP_LINE   = 20;

  /* ---- Prepare body text segments ---- */
  const segmentBuilder = SEGMENT_BUILDERS[certificateType] ?? SEGMENT_BUILDERS.participation;
  const segments = segmentBuilder(data);
  const atoms     = createAtoms(segments, fontRegular, fontBold, SIZE_BODY);
  const bodyLines = wrapAtoms(atoms, BODY_MAX_W);

  /* ---- Height math ---- */
  const namesToTitleGap       = 12;
  const titleToDividerGap     = 10;
  const dividerToCertGap      = 15;
  const titleGap              = 20;
  const ORG_ROW_H             = 50 + 6 + 11 * 2;
  const orgSectionH           = conferenceOrgs.length > 0 ? ORG_ROW_H : 0;
  const awardTextH            = certificateType === "best_paper" ? SIZE_AWARD + 16 : 0;

  let totalBlockHeight = 0;
  if (orgSectionH > 0) {
    totalBlockHeight += orgSectionH + namesToTitleGap;
  } else {
    totalBlockHeight += 10;
  }
  totalBlockHeight += SIZE_CONF + titleToDividerGap + 1 + dividerToCertGap;
  totalBlockHeight += titleConfig.size + titleGap + awardTextH;
  totalBlockHeight += ((bodyLines.length > 0 ? bodyLines.length - 1 : 0) * GAP_LINE) + SIZE_BODY;

  let curY = PAGE_H / 2 + totalBlockHeight / 2 + 65;

  /* ---- Org logos ---- */
  if (conferenceOrgs.length > 0) {
    const { endY } = await renderOrganizationLogos(pdfDoc, page, fontBold, conferenceOrgs, curY);
    curY = endY - namesToTitleGap;
  } else {
    curY -= 10;
  }

  /* ---- Conference title ---- */
  curY -= SIZE_CONF;
  const confW = fontRegular.widthOfTextAtSize(conferenceTitle, SIZE_CONF);
  page.drawText(conferenceTitle, { x: centerX(PAGE_W, confW), y: curY, size: SIZE_CONF, font: fontRegular, color: COL_SUB });
  curY -= titleToDividerGap;

  /* ---- Divider ---- */
  const anchorWidth = 40;
  const ax = centerX(PAGE_W, anchorWidth);
  page.drawLine({ start: { x: ax, y: curY }, end: { x: ax + anchorWidth, y: curY }, thickness: 1.0, color: borderColor });
  curY -= dividerToCertGap;

  /* ---- Title ---- */
  curY -= titleConfig.size;
  const titleW = fontBold.widthOfTextAtSize(titleConfig.text, titleConfig.size);
  page.drawText(titleConfig.text, { x: centerX(PAGE_W, titleW), y: curY, size: titleConfig.size, font: fontBold, color: titleConfig.color });
  curY -= titleGap;

  /* ---- Award highlight text (best paper only) ---- */
  if (certificateType === "best_paper") {
    const aText = awardText || DEFAULT_AWARD_TEXT.best_paper || "";
    const aTextW = fontRegular.widthOfTextAtSize(aText, SIZE_AWARD);
    curY -= SIZE_AWARD;
    page.drawText(aText, { x: centerX(PAGE_W, aTextW), y: curY, size: SIZE_AWARD, font: fontRegular, color: COL_CRIMSON });
    curY -= 16;
  }

  /* ---- Body paragraph (pseudo-justified) ---- */
  curY -= SIZE_BODY;
  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i];
    const isLast = i === bodyLines.length - 1;
    const spaceCount = line.atoms.filter((a) => a.text === " ").length;
    const spaceToAdd = !isLast && spaceCount > 0
      ? Math.max(0, (BODY_MAX_W - line.width) / spaceCount)
      : 0;
    let curX = !isLast && spaceCount > 0 ? centerX(PAGE_W, BODY_MAX_W) : centerX(PAGE_W, line.width);
    for (const atom of line.atoms) {
      page.drawText(atom.text, {
        x: curX, y: curY, size: SIZE_BODY,
        font: atom.isBold ? fontBold : fontRegular,
        color: COL_TEXT,
      });
      curX += atom.width + (atom.text === " " ? spaceToAdd : 0);
    }
    curY -= GAP_LINE;
  }

  /* ---- Signatures ---- */
  const sigY = MARGIN + 60;
  const sigW = 120;

  if (conferenceSignatures.length >= 2) {
    const count = Math.min(conferenceSignatures.length, 3);
    const xCentres: number[] = [];
    if (count === 2) {
      xCentres.push(MARGIN + (PAGE_W - MARGIN * 2) * 0.25);
      xCentres.push(MARGIN + (PAGE_W - MARGIN * 2) * 0.75);
    } else {
      const colW = (PAGE_W - MARGIN * 2) / 3;
      for (let i = 0; i < 3; i++) xCentres.push(MARGIN + colW * i + colW / 2);
    }

    for (let i = 0; i < count; i++) {
      const sig   = conferenceSignatures[i];
      const cx    = xCentres[i];
      const lx    = cx - sigW / 2;
      const lineY = sigY + 32;

      // Signature image
      try {
        const imgRes = await fetch(sig.image_url);
        if (imgRes.ok) {
          const imgBytes = new Uint8Array(await imgRes.arrayBuffer());
          let sigImage: any;
          try   { sigImage = await pdfDoc.embedPng(imgBytes); }
          catch { sigImage = await pdfDoc.embedJpg(imgBytes); }
          const scaled = sigImage.scaleToFit(100, 38);
          page.drawImage(sigImage, { x: cx - scaled.width / 2, y: lineY + 5, width: scaled.width, height: scaled.height });
        }
      } catch (e) {
        console.warn(`Signature image [${i}] failed:`, e);
      }

      // Line
      page.drawLine({ start: { x: lx, y: lineY }, end: { x: lx + sigW, y: lineY }, thickness: 0.5, color: COL_TEXT });

      // Name + role
      let y = lineY - 18;
      if (sig.name) {
        const nw = fontBold.widthOfTextAtSize(sig.name, SIZE_SIG + 1);
        page.drawText(sig.name, { x: cx - nw / 2, y, size: SIZE_SIG + 1, font: fontBold, color: COL_TEXT });
        y -= 16;
      }
      const roleW = fontRegular.widthOfTextAtSize(sig.role, SIZE_SIG - 1);
      page.drawText(sig.role, { x: cx - roleW / 2, y, size: SIZE_SIG - 1, font: fontRegular, color: COL_SUB });
    }
  } else {
    // Fallback placeholder lines
    const colW = (PAGE_W - MARGIN * 2) / 3;
    const labels = ["Convener", "Principal", "Director"];
    for (let i = 0; i < 3; i++) {
      const cx    = MARGIN + colW * i + colW / 2;
      const lx    = cx - sigW / 2;
      const lineY = sigY + 32;
      page.drawLine({ start: { x: lx, y: lineY }, end: { x: lx + sigW, y: lineY }, thickness: 0.5, color: COL_TEXT });
      const lw = fontRegular.widthOfTextAtSize(labels[i], SIZE_SIG - 1);
      page.drawText(labels[i], { x: cx - lw / 2, y: lineY - 18, size: SIZE_SIG - 1, font: fontRegular, color: COL_SUB });
    }
  }

  /* ---- Footer ---- */
  const FOOTER_BASE = MARGIN + 12;
  const verifyUrl   = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify/${verificationCode}`;

  page.drawText(`Verification: ${verificationCode}`, { x: MARGIN + 12, y: FOOTER_BASE, size: SIZE_FOOT, font: fontRegular, color: COL_SUB });

  const brandText = "Powered by AcadFlow";
  const brandW    = fontRegular.widthOfTextAtSize(brandText, SIZE_FOOT);
  page.drawText(brandText, { x: centerX(PAGE_W, brandW), y: FOOTER_BASE, size: SIZE_FOOT, font: fontRegular, color: COL_SUB });

  const dateStr = `Issued: ${fmtDate(issuedAt)}`;
  const dateW   = fontRegular.widthOfTextAtSize(dateStr, SIZE_FOOT);
  page.drawText(dateStr, { x: centerX(PAGE_W, dateW), y: FOOTER_BASE + 14, size: SIZE_FOOT, font: fontRegular, color: COL_SUB });

  // QR code
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 200, margin: 1, color: { dark: "#1E1E24", light: "#FAF8F0" } });
  const qrBase64  = qrDataUrl.split(",")[1];
  const qrBytes   = Uint8Array.from(atob(qrBase64), (ch) => ch.charCodeAt(0));
  const qrImage   = await pdfDoc.embedPng(qrBytes);
  page.drawImage(qrImage, { x: PAGE_W - MARGIN - 40 - 12, y: FOOTER_BASE - 4, width: 40, height: 40 });

  return pdfDoc.save();
}
