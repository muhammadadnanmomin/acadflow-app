/* ================================================================
   AcadFlow — Best Paper DOCX Template Generator
   Run once: npx ts-node scripts/generate-best-paper-template.ts
   Creates public/templates/best-paper-certificate.docx
   ================================================================ */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
  PageOrientation,
} from "docx";
import fs from "fs";
import path from "path";

const BLUE_DARK = "29407A";
const CRIMSON   = "8B0000";
const TEXT_MAIN = "1F1F24";
const TEXT_SUB  = "666670";
const GOLD      = "B87C09";

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
      bottom: { color: CRIMSON, space: 1, style: BorderStyle.SINGLE, size: 12 },
    },
    text: "",
    spacing: {
      before: convertInchesToTwip(6 / 72),
      after: convertInchesToTwip(10 / 72),
    },
  });
}

async function main() {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
              width: convertInchesToTwip(11.69),
              height: convertInchesToTwip(8.27),
            },
            margin: {
              top: convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(1.2),
              right: convertInchesToTwip(1.2),
            },
          },
        },
        children: [
          /* Organization names */
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: convertInchesToTwip(6 / 72) },
            children: [
              new TextRun({
                text: "{{organizationNames}}",
                bold: true,
                size: 22,
                color: BLUE_DARK,
              }),
            ],
          }),

          /* Conference title */
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: convertInchesToTwip(4 / 72) },
            children: [
              new TextRun({
                text: "{{conferenceTitle}}",
                color: TEXT_SUB,
                size: 22,
                italics: true,
              }),
            ],
          }),

          goldRule(),

          /* BEST PAPER heading */
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: {
              before: convertInchesToTwip(6 / 72),
              after: convertInchesToTwip(4 / 72),
            },
            children: [
              new TextRun({
                text: "BEST PAPER",
                bold: true,
                color: CRIMSON,
                size: 72,
                characterSpacing: 120,
              }),
            ],
          }),

          /* AWARD subtitle */
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: convertInchesToTwip(8 / 72) },
            children: [
              new TextRun({
                text: "AWARD",
                color: CRIMSON,
                size: 36,
                bold: true,
                characterSpacing: 80,
              }),
            ],
          }),

          goldRule(),

          /* Award text */
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: {
              before: convertInchesToTwip(4 / 72),
              after: convertInchesToTwip(10 / 72),
            },
            children: [
              new TextRun({
                text: "{{awardText}}",
                italics: true,
                size: 22,
                color: CRIMSON,
              }),
            ],
          }),

          spacer(6),

          /* Body text */
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: {
              before: 0,
              after: convertInchesToTwip(18 / 72),
              line: 360,
            },
            children: [
              new TextRun({
                text: "{{bodyText}}",
                color: TEXT_MAIN,
                size: 26,
              }),
            ],
          }),

          spacer(24),

          /* Conference dates */
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: convertInchesToTwip(16 / 72) },
            children: [
              new TextRun({
                text: "{{conferenceDates}}",
                size: 20,
                color: TEXT_SUB,
                italics: true,
              }),
            ],
          }),

          spacer(30),

          /* Footer: issued date */
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: convertInchesToTwip(2 / 72) },
            children: [
              new TextRun({
                text: "Issued: {{issuedDate}}",
                size: 16,
                color: TEXT_SUB,
              }),
            ],
          }),

          /* Footer: verification code */
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: convertInchesToTwip(2 / 72) },
            children: [
              new TextRun({ text: "Verification Code: ", size: 16, color: TEXT_SUB }),
              new TextRun({
                text: "{{verificationCode}}",
                size: 16,
                color: TEXT_MAIN,
                bold: true,
              }),
            ],
          }),

          /* Footer: branding */
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

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(
    process.cwd(),
    "public",
    "templates",
    "best-paper-certificate.docx"
  );

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Template generated: ${outPath}`);
}

main().catch(console.error);
