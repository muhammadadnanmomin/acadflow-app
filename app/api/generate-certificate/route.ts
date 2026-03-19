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
/*  Multi-org helpers                                                  */
/* ------------------------------------------------------------------ */

interface ConferenceOrg {
  name: string;
  logo_url: string | null;
}

/**
 * Fetch all unique organizations linked to a conference via:
 *   conference_organizers → organization_members → organizations
 *
 * Returns max 4 deduplicated records (by org name).
 */
async function getConferenceOrganizations(
  conferenceId: string
): Promise<ConferenceOrg[]> {
  /* Step 1 — get all organizer user_ids */
  const { data: organizerRows, error: orgErr } = await supabaseAdmin
    .from("conference_organizers")
    .select("user_id")
    .eq("conference_id", conferenceId);

  if (orgErr || !organizerRows || organizerRows.length === 0) return [];

  const userIds = [...new Set(organizerRows.map((r: { user_id: string }) => r.user_id))];

  /* Step 2 — get organization_ids for those users */
  const { data: memberRows, error: memErr } = await supabaseAdmin
    .from("organization_members")
    .select("organization_id")
    .in("user_id", userIds);

  if (memErr || !memberRows || memberRows.length === 0) return [];

  const orgIds = [...new Set(memberRows.map((r: { organization_id: string }) => r.organization_id))];

  /* Step 3 — fetch organizations (name + logo_url) */
  const { data: orgs, error: orgsErr } = await supabaseAdmin
    .from("organizations")
    .select("name, logo_url")
    .in("id", orgIds);

  if (orgsErr || !orgs || orgs.length === 0) return [];

  /* Deduplicate by name and cap at 4 */
  const seen = new Set<string>();
  const unique: ConferenceOrg[] = [];
  for (const org of orgs) {
    const key = (org.name ?? "").toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push({ name: org.name ?? "", logo_url: org.logo_url ?? null });
    if (unique.length === 4) break;
  }
  return unique;
}

async function renderOrganizationLogos(
  pdfDoc: any,
  page: any,
  fontBold: any,
  orgs: ConferenceOrg[],
  startY: number
): Promise<{ endY: number; sectionHeight: number }> {
  if (orgs.length === 0) return { endY: startY, sectionHeight: 0 };

  const LOGO_MAX   = 50;   // max logo dimension (width & height)
  const NAME_SIZE  = 11;
  const NAME_GAP   = 6;    // gap: logo bottom → name baseline
  const BOTTOM_PAD = 0;    // removed arbitrary padding below names to let exact spacing control the gap

  // Equal spacing between logos in a single row
  const SLOT_WIDTH = orgs.length === 4 ? 140 : 160; // Slightly tighter spacing
  const COL_W      = SLOT_WIDTH - 15;

  const startX = (PAGE_W / 2) - ((orgs.length - 1) * SLOT_WIDTH) / 2;
  const xCentresRow1 = orgs.map((_, i) => startX + i * SLOT_WIDTH);

  /* ---- Pre-fetch and embed all logos ---- */
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

  /* ---- Dynamic heights ---- */
  const maxLogoH = Math.max(...logoData.map((l) => l.height), 0);
  const rowH     = maxLogoH + NAME_GAP + NAME_SIZE * 2; // allow 2 name lines
  const sectionHeight = rowH + BOTTOM_PAD;

  const rowTopY = startY;
  const logoBaseY = rowTopY - maxLogoH;

  /* ---- Slot renderer ---- */
  const drawOrgSlot = async (
    org: ConferenceOrg,
    logo: LogoData,
    cx: number
  ) => {
    if (logo.image) {
      page.drawImage(logo.image, {
        x: cx - logo.width / 2,
        y: logoBaseY, // All logos share the SAME baseline
        width: logo.width,
        height: logo.height,
      });
    }

    /* Name — wrap to COL_W, max 2 lines */
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
        // silently drop beyond 2 lines
      }
    }
    for (const [idx, lineText] of [line1, line2].entries()) {
      if (!lineText) continue;
      const lw = fontBold.widthOfTextAtSize(lineText, NAME_SIZE);
      page.drawText(lineText, {
        x: cx - lw / 2,
        y: nameBaseY - idx * (NAME_SIZE + 2), // slightly tighter line height
        size: NAME_SIZE,
        font: fontBold,
        color: COL_TEXT,
      });
    }
  };

  for (let i = 0; i < orgs.length; i++) {
    await drawOrgSlot(orgs[i], logoData[i], xCentresRow1[i]);
  }

  return { endY: startY - sectionHeight, sectionHeight };
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

    let resolvedConferenceTitle = conferenceTitle || "International Academic Conference";
    let conferenceDates = "";

    // Typed signature record
    interface SignatureRecord {
      name?: string;
      role: string;
      image_url: string;
      type?: string;
    }
    let conferenceSignatures: SignatureRecord[] = [];

    /* Conference details (title, dates, signatures) */
    if (conferenceId) {
      const { data: conference } = await supabaseAdmin
        .from("conferences")
        .select(`
          title,
          short_name,
          conference_logo_url,
          start_date,
          end_date,
          signatures
        `)
        .eq("id", conferenceId)
        .single();

      if (conference) {
        resolvedConferenceTitle = conference.title || resolvedConferenceTitle;
        conferenceSignatures = (conference.signatures as SignatureRecord[]) ?? [];

        if (conference.start_date) {
          const start = formatDate(new Date(conference.start_date));
          const end = conference.end_date
            ? formatDate(new Date(conference.end_date))
            : null;
          conferenceDates = end ? `${start} – ${end}` : start;
        }
      }
    }

    /* Multi-org fetch via conference_organizers → organization_members → organizations */
    const conferenceOrgs: ConferenceOrg[] = conferenceId
      ? await getConferenceOrganizations(conferenceId)
      : [];

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
    const namesToTitleGap = 12; // name → title: 12px
    const titleToDividerGap = 10; // title → divider: 10px
    const dividerToCertificateGap = 15; // divider → CERTIFICATE
    const titleGap = 20; // CERTIFICATE → Paragraph

    const ORG_ROW_H     = 50 + 6 + 11 * 2;   // maxLogo(50) + nameGap(6) + 2 lines(11*2)
    const ORG_BOTTOM    = 0;
    const orgSectionH   = conferenceOrgs.length > 0 ? ORG_ROW_H + ORG_BOTTOM : 0;

    if (orgSectionH > 0) {
      totalBlockHeight += orgSectionH;
      totalBlockHeight += namesToTitleGap;
    } else {
      totalBlockHeight += 10;
    }
    
    totalBlockHeight += SIZE_CONF + titleToDividerGap + 1 + dividerToCertificateGap; // 1 is divider thickness
    totalBlockHeight += SIZE_TITLE + titleGap;
    
    // Paragraph height: (N-1)*GAP_LINE + SIZE_BODY
    totalBlockHeight += ((bodyLines.length > 0 ? bodyLines.length - 1 : 0) * GAP_LINE) + SIZE_BODY;

    // Center the whole unified block in available space, then bias upward significantly
    // to bring header much closer to top border (-20 to -30px requested up)
    let curY = (PAGE_H / 2) + (totalBlockHeight / 2) + 65; 

    /* -------------------------------------------------------------- */
    /*  1. HEADER SECTION (Unified Flow)                               */
    /* -------------------------------------------------------------- */

    /* ---- Multi-organization section ---- */
    if (conferenceOrgs.length > 0) {
      const { endY } = await renderOrganizationLogos(
        pdfDoc,
        page,
        fontBold,
        conferenceOrgs,
        curY
      );
      curY = endY;
      
      curY -= namesToTitleGap;
    } else {
      curY -= 10;
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
      curY -= titleToDividerGap;
    }

    // Subtle divider under Conference Title
    {
      const anchorWidth = 40; 
      const ax = centerX(PAGE_W, anchorWidth);
      page.drawLine({
        start: { x: ax, y: curY },
        end:   { x: ax + anchorWidth, y: curY },
        thickness: 1.0,
        color: COL_GOLD,
      });
      curY -= dividerToCertificateGap;
    }

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

    const sigY = MARGIN + 60;
    const sigW = 120;

    if (conferenceSignatures.length >= 2) {
      /* ---- Dynamic signatures from DB ---- */
      const count = Math.min(conferenceSignatures.length, 3);

      // Compute evenly-spaced centre X positions
      // 2 sigs → 25% and 75%
      // 3 sigs → left/center/right thirds
      const xCentres: number[] = [];
      if (count === 2) {
        xCentres.push(MARGIN + (PAGE_W - MARGIN * 2) * 0.25);
        xCentres.push(MARGIN + (PAGE_W - MARGIN * 2) * 0.75);
      } else {
        const colW = (PAGE_W - MARGIN * 2) / 3;
        for (let i = 0; i < 3; i++) {
          xCentres.push(MARGIN + colW * i + colW / 2);
        }
      }

      for (let i = 0; i < count; i++) {
        const sig = conferenceSignatures[i];
        const cx = xCentres[i];
        const lx = cx - sigW / 2;

        // ---- 1. Signature Image (Highest) ----
        const IMG_W = 100;
        const IMG_H = 38;
        const lineY = sigY + 32;

        try {
          const imgRes = await fetch(sig.image_url);
          if (imgRes.ok) {
            const imgBuf = await imgRes.arrayBuffer();
            const imgBytes = new Uint8Array(imgBuf);
            let sigImage;
            try   { sigImage = await pdfDoc.embedPng(imgBytes); }
            catch { sigImage = await pdfDoc.embedJpg(imgBytes); }

            const scaled = sigImage.scaleToFit(IMG_W, IMG_H);
            page.drawImage(sigImage, {
              x: cx - scaled.width / 2,
              y: lineY + 5, // ~5px padding above line
              width: scaled.width,
              height: scaled.height,
            });
          }
        } catch (sigImgErr) {
          console.warn(`Could not embed signature image [${i}]:`, sigImgErr);
        }

        // ---- 2. Horizontal Line (Below Image) ----
        page.drawLine({
          start: { x: lx, y: lineY },
          end:   { x: lx + sigW, y: lineY },
          thickness: 0.5,
          color: COL_TEXT,
        });

        // ---- 3 & 4. Name and Role (Below Line) ----
        let currentY = lineY - 18; // ~10-12px gap from line to name baseline

        if (sig.name) {
          const nameSize = SIZE_SIG + 1;
          const nameW = fontBold.widthOfTextAtSize(sig.name, nameSize);
          page.drawText(sig.name, {
            x: cx - nameW / 2,
            y: currentY,
            size: nameSize,
            font: fontBold,
            color: COL_TEXT,
          });
          currentY -= 16; // ~8-10px gap from name to role baseline
        }

        const roleSize = SIZE_SIG - 1;
        const roleW = fontRegular.widthOfTextAtSize(sig.role, roleSize);
        page.drawText(sig.role, {
          x: cx - roleW / 2,
          y: currentY,
          size: roleSize,
          font: fontRegular,
          color: COL_SUB,
        });
      }
    } else {
      /* ---- Fallback: fewer than 2 signatures → static placeholder lines ---- */
      const colW = (PAGE_W - MARGIN * 2) / 3;
      const sigLabels = ["Convener", "Principal", "Director"];

      for (let i = 0; i < 3; i++) {
        const cx = MARGIN + colW * i + colW / 2;
        const lx = cx - sigW / 2;
        const lineY = sigY + 32;

        page.drawLine({
          start: { x: lx, y: lineY },
          end:   { x: lx + sigW, y: lineY },
          thickness: 0.5,
          color: COL_TEXT,
        });

        const lbl  = sigLabels[i];
        const roleSize = SIZE_SIG - 1;
        const lblW = fontRegular.widthOfTextAtSize(lbl, roleSize);
        
        let currentY = lineY - 18; // Fallback directly below line
        
        page.drawText(lbl, {
          x: cx - lblW / 2,
          y: currentY,
          size: roleSize,
          font: fontRegular,
          color: COL_SUB,
        });
      }
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