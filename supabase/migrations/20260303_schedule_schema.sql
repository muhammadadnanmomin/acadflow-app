-- ============================================================
-- AcadFlow — Multi-Track Hybrid Scheduling Schema
-- ============================================================

-- 1. ENUM TYPES
-- ------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE session_type_enum AS ENUM (
    'keynote', 'technical', 'invited', 'workshop', 'ceremony', 'break'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE session_mode_enum AS ENUM (
    'offline', 'online', 'hybrid'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE session_status_enum AS ENUM (
    'scheduled', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- 2. TABLES
-- ------------------------------------------------------------

-- Conference Days
CREATE TABLE IF NOT EXISTS conference_days (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  day_number   INT  NOT NULL,
  date         DATE NOT NULL,
  label        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (conference_id, day_number),
  UNIQUE (conference_id, date)
);

-- Tracks (conference-wide, NOT tied to a specific day)
CREATE TABLE IF NOT EXISTS tracks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  room_name     TEXT,
  color_code    TEXT NOT NULL DEFAULT '#6366f1',
  sort_order    INT  NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (conference_id, name)
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id   UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  day_id          UUID NOT NULL REFERENCES conference_days(id) ON DELETE CASCADE,
  track_id        UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  session_type    session_type_enum NOT NULL DEFAULT 'technical',
  mode            session_mode_enum NOT NULL DEFAULT 'offline',
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ NOT NULL,
  venue           TEXT,
  room            TEXT,
  platform        TEXT,
  meeting_link    TEXT,
  timezone        TEXT,
  chairperson_id  UUID,
  coordinator_id  UUID,
  status          session_status_enum NOT NULL DEFAULT 'scheduled',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Session Presentations (papers assigned to a session)
CREATE TABLE IF NOT EXISTS session_presentations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  paper_id          UUID NOT NULL REFERENCES paper_submissions(id) ON DELETE CASCADE,
  presentation_order INT NOT NULL DEFAULT 0,
  custom_start_time TIMESTAMPTZ,
  custom_end_time   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (session_id, paper_id),
  UNIQUE (session_id, presentation_order)
);


-- 3. INDEXES
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_conference_days_conf
  ON conference_days (conference_id);

CREATE INDEX IF NOT EXISTS idx_tracks_conf
  ON tracks (conference_id);

CREATE INDEX IF NOT EXISTS idx_sessions_conf
  ON sessions (conference_id);

CREATE INDEX IF NOT EXISTS idx_sessions_day
  ON sessions (day_id);

CREATE INDEX IF NOT EXISTS idx_sessions_track_time
  ON sessions (track_id, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_sessions_room_time
  ON sessions (room, start_time, end_time)
  WHERE room IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_chairperson_time
  ON sessions (chairperson_id, start_time, end_time)
  WHERE chairperson_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_session_presentations_session
  ON session_presentations (session_id);

CREATE INDEX IF NOT EXISTS idx_session_presentations_paper
  ON session_presentations (paper_id);


-- 4. CONFLICT-DETECTION DATABASE FUNCTIONS
-- ------------------------------------------------------------

-- 4a. Track time-overlap check
CREATE OR REPLACE FUNCTION check_track_time_overlap(
  p_track_id    UUID,
  p_start_time  TIMESTAMPTZ,
  p_end_time    TIMESTAMPTZ,
  p_exclude_id  UUID DEFAULT NULL
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
  WHERE  s.track_id = p_track_id
    AND  s.status  != 'cancelled'
    AND  s.start_time < p_end_time
    AND  s.end_time   > p_start_time
    AND  (p_exclude_id IS NULL OR s.id != p_exclude_id);
$$;


-- 4b. Room double-booking check
CREATE OR REPLACE FUNCTION check_room_conflict(
  p_conference_id UUID,
  p_room          TEXT,
  p_start_time    TIMESTAMPTZ,
  p_end_time      TIMESTAMPTZ,
  p_exclude_id    UUID DEFAULT NULL
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
  WHERE  s.conference_id = p_conference_id
    AND  s.room IS NOT NULL
    AND  s.room = p_room
    AND  s.status != 'cancelled'
    AND  s.start_time < p_end_time
    AND  s.end_time   > p_start_time
    AND  (p_exclude_id IS NULL OR s.id != p_exclude_id);
$$;


-- 4c. Chairperson overlap check
CREATE OR REPLACE FUNCTION check_chairperson_conflict(
  p_chairperson_id UUID,
  p_start_time     TIMESTAMPTZ,
  p_end_time       TIMESTAMPTZ,
  p_exclude_id     UUID DEFAULT NULL
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
  WHERE  s.chairperson_id = p_chairperson_id
    AND  s.status != 'cancelled'
    AND  s.start_time < p_end_time
    AND  s.end_time   > p_start_time
    AND  (p_exclude_id IS NULL OR s.id != p_exclude_id);
$$;


-- 4d. Paper duplicate check
CREATE OR REPLACE FUNCTION check_paper_duplicate(
  p_paper_id   UUID,
  p_exclude_session_id UUID DEFAULT NULL
)
RETURNS TABLE (
  session_id    UUID,
  session_title TEXT
)
LANGUAGE sql STABLE
AS $$
  SELECT sp.session_id, s.title AS session_title
  FROM   session_presentations sp
  JOIN   sessions s ON s.id = sp.session_id
  WHERE  sp.paper_id = p_paper_id
    AND  s.status   != 'cancelled'
    AND  (p_exclude_session_id IS NULL OR sp.session_id != p_exclude_session_id);
$$;
