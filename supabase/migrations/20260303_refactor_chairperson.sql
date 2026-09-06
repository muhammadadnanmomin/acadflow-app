-- ============================================================
-- Confairo — Refactor Chairperson & Coordinator to Manual Entry
-- Safe migration: preserves existing rows, no cascade issues.
-- ============================================================

-- 1. Remove old UUID columns
ALTER TABLE sessions DROP COLUMN IF EXISTS chairperson_id;
ALTER TABLE sessions DROP COLUMN IF EXISTS coordinator_id;

-- 2. Add new text columns
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS chairperson_name  TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS chairperson_email TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS coordinator_name  TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS coordinator_email TEXT;

-- 3. Drop the old chairperson conflict DB function (no longer UUID-based)
DROP FUNCTION IF EXISTS check_chairperson_conflict(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID);

-- 4. Recreate chairperson conflict function using name instead of ID
CREATE OR REPLACE FUNCTION check_chairperson_conflict(
  p_chairperson_name TEXT,
  p_start_time       TIMESTAMPTZ,
  p_end_time         TIMESTAMPTZ,
  p_exclude_id       UUID DEFAULT NULL
)
RETURNS TABLE (
  id         UUID,
  title      TEXT,
  start_time TIMESTAMPTZ,
  end_time   TIMESTAMPTZ
)
LANGUAGE sql STABLE
AS $$
  SELECT s.id, s.title, s.start_time, s.end_time
  FROM   sessions s
  WHERE  s.chairperson_name IS NOT NULL
    AND  s.chairperson_name = p_chairperson_name
    AND  s.status != 'cancelled'
    AND  s.start_time < p_end_time
    AND  s.end_time   > p_start_time
    AND  (p_exclude_id IS NULL OR s.id != p_exclude_id);
$$;

-- 5. Drop the old chairperson index (was on chairperson_id)
DROP INDEX IF EXISTS idx_sessions_chairperson_time;

-- 6. Create new index on chairperson_name
CREATE INDEX IF NOT EXISTS idx_sessions_chairperson_name_time
  ON sessions (chairperson_name, start_time, end_time)
  WHERE chairperson_name IS NOT NULL;
