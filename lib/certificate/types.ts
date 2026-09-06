/* ================================================================
   Confairo — Certificate Generator Types
   Shared between generatePdf.ts and generateDocx.ts
   ================================================================ */

export type CertificateFormat = "pdf" | "docx";

export type CertificateType = "participation" | "best_paper";

export const CERTIFICATE_TYPE_LABELS: Record<CertificateType, string> = {
  participation: "Certificate of Participation",
  best_paper: "Best Paper Award",
};

export interface CertificateOrg {
  name: string;
  logo_url: string | null;
}

export interface CertificateSignature {
  name?: string;
  role: string;
  image_url: string;
  type?: string;
}

/** All the dynamic content needed to render a certificate in any format. */
export interface CertificateData {
  certificateType: CertificateType;
  authorName: string;
  authorAffiliation: string;
  paperTitle: string;
  conferenceTitle: string;
  conferenceDates: string;
  verificationCode: string;
  issuedAt: Date;
  conferenceOrgs: CertificateOrg[];
  conferenceSignatures: CertificateSignature[];
  awardText?: string;
}
