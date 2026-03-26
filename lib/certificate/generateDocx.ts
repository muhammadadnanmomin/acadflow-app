/* ================================================================
   AcadFlow — DOCX Certificate Generator (Template-Based)

   Primary path: loads /public/templates/certificate.docx and injects
   dynamic values via docxtemplater ({{placeholder}} syntax).

   Fallback path: if the template file is not found, the legacy
   `docx`-package layout is used so the API never breaks in dev.
   ================================================================ */

import fs from "fs/promises";
import path from "path";
import { CertificateData } from "./types";
import { generateDocxFromTemplate } from "./generateDocxFromTemplate";

/* ------------------------------------------------------------------ */
/*  Template path (resolved at runtime in Node.js)                    */
/* ------------------------------------------------------------------ */

const TEMPLATE_PATH = path.join(process.cwd(), "public", "templates", "certificate.docx");

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

/* ================================================================== */
/*  PRIMARY — template-driven DOCX                                    */
/* ================================================================== */

/**
 * Generates a DOCX certificate from a Word template file.
 * Reads /public/templates/certificate.docx, fills in all {{placeholders}},
 * and returns the resulting buffer.
 *
 * Falls back to generateCertificateDocxFallback() if the template
 * file is missing (useful during local development before the template
 * is placed).
 */
export async function generateCertificateDocx(data: CertificateData): Promise<Buffer> {
  const {
    authorName,
    authorAffiliation,
    conferenceTitle,
    conferenceDates,
    paperTitle,
    verificationCode,
    issuedAt,
    conferenceOrgs,
  } = data;

  /* ---- Try loading the template ---- */
  let templateBuffer: Buffer;
  try {
    templateBuffer = await fs.readFile(TEMPLATE_PATH);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      console.warn(
        "[generateCertificateDocx] Template not found — using fallback.\n" +
          `  Expected: ${TEMPLATE_PATH}\n` +
          "  Place your Word template there and restart the dev server."
      );
      return generateCertificateDocxFallback(data);
    }
    throw err;
  }

  /* ---- Build the body sentence (matches PDF wording exactly) ---- */
  let bodyText = `This is to certify that ${authorName || "Participant"}`;
  if (authorAffiliation) bodyText += ` from ${authorAffiliation}`;
  bodyText += " has presented a paper";
  if (paperTitle) bodyText += ` entitled \u201C${paperTitle}\u201D`;
  bodyText += ` at the ${conferenceTitle}`;
  if (conferenceDates) bodyText += ` held during ${conferenceDates}.`;
  else bodyText += ".";

  /* ---- Build org names string ---- */
  const organizationNames =
    conferenceOrgs.length > 0
      ? conferenceOrgs.map((o) => o.name).join("  |  ")
      : "";

  /* ---- Variables map (one entry per {{placeholder}} in template) ---- */
  const variables: Record<string, string> = {
    authorName:          authorName || "Participant",
    authorAffiliation:   authorAffiliation || "",
    conferenceTitle,
    conferenceDates:     conferenceDates || "",
    paperTitle:          paperTitle || "",
    verificationCode,
    issuedDate:          fmtDate(issuedAt),
    organizationNames,
    bodyText,
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

/** @internal Exported for tests / debugging only — prefer generateCertificateDocx() */
export async function generateCertificateDocxFallback(data: CertificateData): Promise<Buffer> {
  const {
    conferenceTitle,
    verificationCode,
    issuedAt,
    conferenceSignatures,
  } = data;

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

          /* CERTIFICATE heading */
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: {
              before: convertInchesToTwip(6 / 72),
              after: convertInchesToTwip(4 / 72),
            },
            children: [
              new TextRun({
                text: "CERTIFICATE",
                bold: true,
                color: BLUE_DARK,
                size: 72,
                characterSpacing: 120,
              }),
            ],
          }),

          /* OF PARTICIPATION */
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: convertInchesToTwip(14 / 72) },
            children: [
              new TextRun({
                text: "OF PARTICIPATION",
                color: GOLD,
                size: 28,
                bold: true,
                characterSpacing: 80,
              }),
            ],
          }),

          goldRule(),
          spacer(12),

          /* Body paragraph */
          (() => {
            const runs: TextRun[] = [];
            const add = (text: string, bold = false) =>
              runs.push(new TextRun({ text, bold, color: TEXT_MAIN, size: 26 }));

            add("This is to certify that ");
            add(data.authorName || "Participant", true);
            if (data.authorAffiliation) {
              add(" from ");
              add(data.authorAffiliation, true);
            }
            add(" has presented a paper ");
            if (data.paperTitle) {
              add("entitled \u201C");
              add(data.paperTitle, true);
              add("\u201D ");
            }
            add("at the ");
            add(data.conferenceTitle);
            if (data.conferenceDates) {
              add(` held during ${data.conferenceDates}.`);
            } else {
              add(".");
            }

            return new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: {
                before: 0,
                after: convertInchesToTwip(18 / 72),
                line: 360,
              },
              children: runs,
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
                text: "Powered by AcadFlow",
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
