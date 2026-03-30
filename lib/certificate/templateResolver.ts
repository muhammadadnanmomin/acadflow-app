/* ================================================================
   AcadFlow — Certificate Template Resolver
   Maps certificate types to their DOCX template file paths.
   Extensible for future award types.
   ================================================================ */

import path from "path";
import { CertificateType } from "./types";

const TEMPLATE_DIR = path.join(process.cwd(), "public", "templates");

const TEMPLATE_MAP: Record<CertificateType, string> = {
  participation: "certificate.docx",
  best_paper: "best-paper-certificate.docx",
};

export function getTemplatePath(certificateType: CertificateType): string {
  const filename = TEMPLATE_MAP[certificateType] ?? TEMPLATE_MAP.participation;
  return path.join(TEMPLATE_DIR, filename);
}
