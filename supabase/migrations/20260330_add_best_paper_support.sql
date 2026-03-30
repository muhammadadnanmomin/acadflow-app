-- ================================================================
-- AcadFlow — Best Paper Award Support
-- Adds award_type to paper_submissions and updates the certificates
-- unique index to allow multiple certificate types per author.
-- ================================================================

-- 1. Add award_type column to paper_submissions
ALTER TABLE paper_submissions
  ADD COLUMN IF NOT EXISTS award_type TEXT NOT NULL DEFAULT 'none';

-- 2. Drop old unique index (paper_id, author_id) so we can have
--    multiple certificate types per author per paper
DROP INDEX IF EXISTS idx_cert_paper_author;

-- 3. Recreate unique index including certificate_type
CREATE UNIQUE INDEX idx_cert_paper_author_type
    ON certificates(paper_id, author_id, certificate_type);
