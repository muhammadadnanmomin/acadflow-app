-- ================================================================
-- AcadFlow — Conference Signatures
-- Adds a JSONB column to store organizer signature data per conference.
-- Schema per element:
--   { name: string (optional), role: string, image_url: string, type: "drawn" }
-- ================================================================

ALTER TABLE conferences
  ADD COLUMN IF NOT EXISTS signatures JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN conferences.signatures IS
  'Array of organizer signature objects. Each: { name?, role, image_url, type: drawn|uploaded }.';
