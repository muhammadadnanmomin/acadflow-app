-- ============================================================
-- AI Plagiarism Risk Detector — Cache Table
-- Stores cached plagiarism analysis results per submission
-- Includes model_version for cache invalidation on updates
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_plagiarism_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL UNIQUE REFERENCES paper_submissions(id) ON DELETE CASCADE,
  result_data JSONB NOT NULL,
  model_used TEXT,
  model_version TEXT DEFAULT 'plagiarism-v1.0',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by submission
CREATE INDEX IF NOT EXISTS idx_ai_plagiarism_checks_submission
  ON ai_plagiarism_checks(submission_id);

-- Allow service role full access (API uses service role key)
ALTER TABLE ai_plagiarism_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on ai_plagiarism_checks"
  ON ai_plagiarism_checks
  FOR ALL
  USING (true)
  WITH CHECK (true);
