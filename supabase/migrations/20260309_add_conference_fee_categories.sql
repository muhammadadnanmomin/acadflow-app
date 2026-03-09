-- ============================================================
-- Migration: conference_fee_categories
-- Replaces flat fee columns on `conferences` with per-category
-- fee rows (Student, Academic, Industry, Listener).
-- Also adds participant_category to paper_submissions.
-- ============================================================

-- Add participant_category column to paper_submissions
ALTER TABLE paper_submissions
  ADD COLUMN IF NOT EXISTS participant_category text;

CREATE TABLE IF NOT EXISTS conference_fee_categories (
  id                        uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  conference_id             uuid        NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  category_name             text        NOT NULL,
  physical_presentation_fee numeric,
  virtual_presentation_fee  numeric,
  full_paper_publication_fee numeric,
  abstract_publication_fee  numeric,
  listener_fee              numeric,
  created_at                timestamptz DEFAULT now()
);

-- One row per category per conference
CREATE UNIQUE INDEX IF NOT EXISTS uq_conf_category
  ON conference_fee_categories(conference_id, category_name);

-- RLS: anyone can read (participants need to see fees)
ALTER TABLE conference_fee_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read fee categories"
  ON conference_fee_categories FOR SELECT
  USING (true);

-- Only the conference organizer may insert / update / delete
CREATE POLICY "Organizer can manage fee categories"
  ON conference_fee_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM conferences
      WHERE conferences.id = conference_fee_categories.conference_id
        AND conferences.organizer_id = auth.uid()
    )
  );
