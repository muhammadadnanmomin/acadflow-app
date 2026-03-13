-- ================================================================
-- AcadFlow — Add pdf_hash column for certificate tamper protection
-- ================================================================

ALTER TABLE certificates
ADD COLUMN IF NOT EXISTS pdf_hash TEXT;
