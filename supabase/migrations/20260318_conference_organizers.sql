-- ============================================================
-- conference_organizers — multi-organizer support
-- ============================================================

CREATE TABLE IF NOT EXISTS conference_organizers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id   UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'organizer'
                  CHECK (role IN ('owner', 'organizer')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_conference_organizer UNIQUE (conference_id, user_id)
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_conference_organizers_user
  ON conference_organizers(user_id);

-- Index for fast lookups by conference
CREATE INDEX IF NOT EXISTS idx_conference_organizers_conference
  ON conference_organizers(conference_id);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE conference_organizers ENABLE ROW LEVEL SECURITY;

-- Everyone can read organizer rows for conferences they belong to
CREATE POLICY "Users can view organizers of their conferences"
  ON conference_organizers FOR SELECT
  USING (
    user_id = auth.uid()
    OR conference_id IN (
      SELECT id FROM conferences WHERE organizer_id = auth.uid()
    )
  );

-- Only conference owners can insert co-organizers
CREATE POLICY "Owners can add co-organizers"
  ON conference_organizers FOR INSERT
  WITH CHECK (
    conference_id IN (
      SELECT id FROM conferences WHERE organizer_id = auth.uid()
    )
    OR (user_id = auth.uid() AND role = 'owner')
  );

-- Only conference owners can remove co-organizers
CREATE POLICY "Owners can remove co-organizers"
  ON conference_organizers FOR DELETE
  USING (
    conference_id IN (
      SELECT id FROM conferences WHERE organizer_id = auth.uid()
    )
  );

-- ============================================================
-- Backfill: insert existing conference owners
-- ============================================================

INSERT INTO conference_organizers (conference_id, user_id, role)
SELECT id, organizer_id, 'owner'
FROM conferences
ON CONFLICT (conference_id, user_id) DO NOTHING;
