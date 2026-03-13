-- ================================================================
-- AcadFlow — Add certificate_generated flag to paper_submissions
-- Enables UI to quickly show certificate availability status.
-- ================================================================

ALTER TABLE paper_submissions
  ADD COLUMN IF NOT EXISTS certificate_generated BOOLEAN DEFAULT FALSE;
