/* ================================================================
   Confairo — DOCX Certificate Generator (Template-Based)

   Primary path: loads the appropriate template via templateResolver
   and injects dynamic values via docxtemplater ({{placeholder}} syntax).

   Fallback path: if the template file is not found, the legacy
   `docx`-package layout is used so the API never breaks in dev.
   ================================================================ */

import fs from "fs/promises";
import { CertificateData, CertificateType } from "./types";
import { generateDocxFromTemplate } from "./generateDocxFromTemplate";
import { getTemplatePath } from "./templateResolver";

/* ------------------------------------------------------------------ */
/*  Date formatter                                                     */
/* ------------------------------------------------------------------ */

function fmtDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Body text builders (per certificate type)                          */
/* ------------------------------------------------------------------ */

function buildParticipationBody(data: CertificateData): string {
  const { authorName, authorAffiliation, paperTitle, conferenceTitle, conferenceDates } = data;
  let body = `This is to certify that ${authorName || "Participant"}`;
  if (authorAffiliation) body += ` from ${authorAffiliation}`;
  body += " has presented a paper";
  if (paperTitle) body += ` entitled \u201C${paperTitle}\u201D`;
  body += ` at the ${conferenceTitle}`;
  if (conferenceDates) body += ` held during ${conferenceDates}.`;
  else body += ".";
  return body;
}

function buildBestPaperBody(data: CertificateData): string {
  const { authorName, authorAffiliation, paperTitle, conferenceTitle, conferenceDates } = data;
  let body = `This is to certify that the paper`;
  if (paperTitle) body += ` entitled \u201C${paperTitle}\u201D`;
  body += ` by ${authorName || "Participant"}`;
  if (authorAffiliation) body += ` from ${authorAffiliation}`;
  body += ` has been selected as the Best Paper at the ${conferenceTitle}`;
  if (conferenceDates) body += ` held during ${conferenceDates}`;
  body += ` for its outstanding contribution to the field.`;
  return body;
}

const BODY_BUILDERS: Record<CertificateType, (data: CertificateData) => string> = {
  participation: buildParticipationBody,
  best_paper: buildBestPaperBody,
};

/* ------------------------------------------------------------------ */
/*  Default award text                                                 */
/* ------------------------------------------------------------------ */

const DEFAULT_AWARD_TEXT: Partial<Record<CertificateType, string>> = {
  best_paper:
    "This paper has been selected as the Best Paper for its outstanding contribution.",
};

/* ================================================================== */
/*  PRIMARY — template-driven DOCX                                    */
/* ================================================================== */

export async function generateCertificateDocx(data: CertificateData): Promise<Buffer> {
  const {
    certificateType = "participation",
    authorName,
    authorAffiliation,
    conferenceTitle,
    conferenceDates,
    paperTitle,
    verificationCode,
    issuedAt,
    conferenceOrgs,
    awardText,
  } = data;

  /* ---- Try loading the template ---- */
  const templatePath = getTemplatePath(certificateType);
  let templateBuffer: Buffer;
  try {
    templateBuffer = await fs.readFile(templatePath);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      console.warn(
        `[generateCertificateDocx] Template not found — using fallback.\n` +
          `  Expected: ${templatePath}\n` +
          "  Place your Word template there and restart the dev server."
      );
      return generateCertificateDocxFallback(data);
    }
    throw err;
  }

  /* ---- Build the body sentence ---- */
  const bodyBuilder = BODY_BUILDERS[certificateType] ?? BODY_BUILDERS.participation;
  const bodyText = bodyBuilder(data);

  /* ---- Build org names string ---- */
  const organizationNames =
    conferenceOrgs.length > 0
      ? conferenceOrgs.map((o) => o.name).join("  |  ")
      : "";

  /* ---- Variables map (one entry per {{placeholder}} in template) ---- */
  const variables: Record<string, string> = {
    authorName:        authorName || "Participant",
    authorAffiliation: authorAffiliation || "",
    conferenceTitle,
    conferenceDates:   conferenceDates || "",
    paperTitle:        paperTitle || "",
    verificationCode,
    issuedDate:        fmtDate(issuedAt),
    organizationNames,
    bodyText,
    awardText:         awardText || DEFAULT_AWARD_TEXT[certificateType] || "",
  };

  /* ---- Fill template and return ---- */
  return generateDocxFromTemplate(templateBuffer, variables);
}

/* ================================================================== */
/*  FALLBACK — legacy docx-package layout                             */
/*  Kept so the API always works even without a template file.        */
/* ================================================================== */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  VerticalAlign,
  convertInchesToTwip,
  PageOrientation,
} from "docx";

const BLUE_DARK = "29407A";
const GOLD      = "B87C09";
const TEXT_MAIN = "1F1F24";
const TEXT_SUB  = "666670";
const CRIMSON   = "8B0000";

function spacer(points = 6): Paragraph {
  return new Paragraph({
    spacing: { before: 0, after: convertInchesToTwip(points / 72) },
    text: "",
  });
}

function goldRule(): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    border: {
      bottom: { color: GOLD, space: 1, style: BorderStyle.SINGLE, size: 12 },
    },
    text: "",
    spacing: {
      before: convertInchesToTwip(6 / 72),
      after: convertInchesToTwip(10 / 72),
    },
  });
}

/* ---- Heading config per type ---- */

interface HeadingConfig {
  line1: string;
  line2: string;
  line2Color: string;
}

const HEADING_CONFIG: Record<CertificateType, HeadingConfig> = {
  participation: {
    line1: "CERTIFICATE",
    line2: "OF PARTICIPATION",
    line2Color: GOLD,
  },
  best_paper: {
    line1: "BEST PAPER",
    line2: "AWARD",
    line2Color: CRIMSON,
  },
};

/** @internal Exported for tests / debugging only — prefer generateCertificateDocx() */
export async function generateCertificateDocxFallback(data: CertificateData): Promise<Buffer> {
  const {
    certificateType = "participation",
    conferenceTitle,
    verificationCode,
    issuedAt,
    conferenceSignatures,
    awardText,
  } = data;

  const heading = HEADING_CONFIG[certificateType] ?? HEADING_CONFIG.participation;
  const bodyBuilder = BODY_BUILDERS[certificateType] ?? BODY_BUILDERS.participation;

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
              width:  convertInchesToTwip(11.69),
              height: convertInchesToTwip(8.27),
            },
            margin: {
              top:    convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.75),
              left:   convertInchesToTwip(1.2),
              right:  convertInchesToTwip(1.2),
            },
          },
        },
        children: [
          /* Org names */
          ...(data.conferenceOrgs.length > 0
            ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 0, after: convertInchesToTwip(6 / 72) },
                  children: data.conferenceOrgs.map(
                    (org, i) =>
                      new TextRun({
                        text:
                          org.name +
                          (i < data.conferenceOrgs.length - 1 ? "  |  " : ""),
                        bold: true,
                        size: 22,
                        color: BLUE_DARK,
                      })
                  ),
                }),
              ]
            : [spacer(10)]),

          /* Conference subtitle */
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: convertInchesToTwip(4 / 72) },
            children: [
              new TextRun({
                text: conferenceTitle,
                color: TEXT_SUB,
                size: 22,
                italics: true,
              }),
            ],
          }),

          goldRule(),

          /* Heading line 1 */
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: {
              before: convertInchesToTwip(6 / 72),
              after: convertInchesToTwip(4 / 72),
            },
            children: [
              new TextRun({
                text: heading.line1,
                bold: true,
                color: BLUE_DARK,
                size: 72,
                characterSpacing: 120,
              }),
            ],
          }),

          /* Heading line 2 */
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: convertInchesToTwip(14 / 72) },
            children: [
              new TextRun({
                text: heading.line2,
                color: heading.line2Color,
                size: 28,
                bold: true,
                characterSpacing: 80,
              }),
            ],
          }),

          goldRule(),

          /* Award text (best paper only) */
          ...(certificateType === "best_paper"
            ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: {
                    before: convertInchesToTwip(4 / 72),
                    after: convertInchesToTwip(8 / 72),
                  },
                  children: [
                    new TextRun({
                      text:
                        awardText ||
                        DEFAULT_AWARD_TEXT.best_paper ||
                        "",
                      italics: true,
                      size: 22,
                      color: CRIMSON,
                    }),
                  ],
                }),
              ]
            : []),

          spacer(12),

          /* Body paragraph */
          (() => {
            const bodyText = bodyBuilder(data);
            return new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: {
                before: 0,
                after: convertInchesToTwip(18 / 72),
                line: 360,
              },
              children: [
                new TextRun({ text: bodyText, color: TEXT_MAIN, size: 26 }),
              ],
            });
          })(),

          spacer(20),

          /* Signature table */
          (() => {
            const sigs = conferenceSignatures;
            const count = Math.min(sigs.length, 3);
            const labels =
              count >= 2
                ? sigs.slice(0, count).map((s) => ({ name: s.name, role: s.role }))
                : [
                    { name: undefined, role: "Convener" },
                    { name: undefined, role: "Principal" },
                    { name: undefined, role: "Director" },
                  ];
            const cellWidth = Math.floor(9600 / labels.length);

            const cells = labels.map(
              (sig) =>
                new TableCell({
                  width: { size: cellWidth, type: WidthType.DXA },
                  verticalAlign: VerticalAlign.BOTTOM,
                  shading: { type: ShadingType.CLEAR, fill: "FFFFFF" },
                  borders: {
                    top:    { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    left:   { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    right:  { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                  },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      border: {
                        bottom: {
                          style: BorderStyle.SINGLE,
                          size: 6,
                          color: TEXT_MAIN,
                          space: 1,
                        },
                      },
                      text: "  ",
                      spacing: {
                        before: convertInchesToTwip(40 / 72),
                        after: convertInchesToTwip(4 / 72),
                      },
                    }),
                    ...(sig.name
                      ? [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 0, after: 0 },
                            children: [
                              new TextRun({
                                text: sig.name,
                                bold: true,
                                size: 20,
                                color: TEXT_MAIN,
                              }),
                            ],
                          }),
                        ]
                      : []),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 0, after: 0 },
                      children: [
                        new TextRun({
                          text: sig.role,
                          size: 18,
                          color: TEXT_SUB,
                          italics: true,
                        }),
                      ],
                    }),
                  ],
                })
            );

            return new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [new TableRow({ children: cells })],
              borders: {
                top:              { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                bottom:           { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                left:             { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                right:            { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                insideVertical:   { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
              },
            });
          })(),

          /* Footer */
          spacer(20),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: convertInchesToTwip(2 / 72) },
            children: [
              new TextRun({
                text: `Issued: ${fmtDate(issuedAt)}`,
                size: 16,
                color: TEXT_SUB,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: convertInchesToTwip(2 / 72) },
            children: [
              new TextRun({ text: "Verification Code: ", size: 16, color: TEXT_SUB }),
              new TextRun({ text: verificationCode, size: 16, color: TEXT_MAIN, bold: true }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 },
            children: [
              new TextRun({
                text: "Powered by Confairo",
                size: 16,
                color: TEXT_SUB,
                italics: true,
              }),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
