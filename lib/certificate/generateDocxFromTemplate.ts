/* ================================================================
   AcadFlow — DOCX Template Engine
   Loads a .docx template buffer, replaces {{placeholders}} with
   actual values using docxtemplater + pizzip, and returns the
   rendered DOCX as a Node.js Buffer.
   ================================================================ */

import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

/**
 * Fills a .docx template with the given variables and returns the
 * resulting DOCX as a Buffer.
 *
 * @param templateBuffer - Raw bytes of the .docx template file.
 * @param variables      - Key/value map of placeholder → replacement text.
 *                         Use the same keys as the {{placeholders}} in the template.
 * @returns Buffer containing the filled DOCX document.
 * @throws  If the template is malformed or a required placeholder is missing.
 */
export function generateDocxFromTemplate(
  templateBuffer: Buffer,
  variables: Record<string, string>
): Buffer {
  /* 1. Unzip the DOCX (it's a ZIP archive internally) */
  const zip = new PizZip(templateBuffer);

  /* 2. Bind docxtemplater to the zip */
  const doc = new Docxtemplater(zip, {
    /* Throw immediately on any template error so we get a clear stack trace */
    paragraphLoop: true,
    linebreaks: true,
  });

  /* 3. Inject the data */
  doc.render(variables);

  /* 4. Re-generate and return the filled DOCX as a Node Buffer */
  const output = doc.getZip().generate({ type: "nodebuffer" }) as Buffer;
  return output;
}
