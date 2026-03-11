/* ================================================================
   AcadFlow — Certificate System Types
   Shared types for certificates, paper authors, and submissions.
   ================================================================ */

export interface PaperAuthor {
    id: string;
    submission_id: string;
    name: string;
    email: string | null;
    affiliation: string | null;
    author_order: number;
    is_primary: boolean;
}

export interface Certificate {
    id: string;
    paper_id: string;
    author_id: string;
    conference_id: string;
    certificate_type: string;
    file_url: string | null;
    verification_code: string | null;
    issued_at: string;
}

export interface CertificatePaperSubmission {
    id: string;
    title: string;
    status: string;
    payment_status: string | null;
    presented: boolean | null;
    presented_at: string | null;
    conference_id: string;
}
