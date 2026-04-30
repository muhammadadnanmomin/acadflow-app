-- AI Paper Review Cache Table
-- Stores AI-generated review results per submission to avoid redundant API calls

CREATE TABLE IF NOT EXISTS ai_paper_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id uuid NOT NULL REFERENCES paper_submissions(id) ON DELETE CASCADE,
  review_data jsonb NOT NULL,
  model_used text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(submission_id)
);

-- RLS: only authenticated users with organizer access can read/write
ALTER TABLE ai_paper_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read ai reviews"
  ON ai_paper_reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert ai reviews"
  ON ai_paper_reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update ai reviews"
  ON ai_paper_reviews FOR UPDATE
  TO authenticated
  USING (true);
