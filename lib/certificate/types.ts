/* ================================================================
   AcadFlow — Certificate Generator Types
   Shared between generatePdf.ts and generateDocx.ts
   ================================================================ */

export type CertificateFormat = "pdf" | "docx";

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
  authorName: string;
  authorAffiliation: string;
  paperTitle: string;
  conferenceTitle: string;
  conferenceDates: string;
  verificationCode: string;
  issuedAt: Date;
  conferenceOrgs: CertificateOrg[];
  conferenceSignatures: CertificateSignature[];
}
