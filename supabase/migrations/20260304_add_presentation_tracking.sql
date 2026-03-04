-- Add presentation tracking to paper_submissions
-- Certificates should only be issued after a paper has been presented

ALTER TABLE paper_submissions
  ADD COLUMN IF NOT EXISTS presented boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS presented_at timestamptz NULL;
