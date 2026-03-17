-- ============================================================
-- AcadFlow — Conference Proceedings System
-- Tables, access-control function, and RLS policies
-- ============================================================

-- 1. Proceedings table
CREATE TABLE IF NOT EXISTS public.conference_proceedings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  file_path     TEXT NOT NULL,            -- storage path, never a public URL
  is_published  BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. Audit log
CREATE TABLE IF NOT EXISTS public.proceedings_access_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID,
  conference_id UUID,
  accessed_at   TIMESTAMPTZ DEFAULT now()
);

-- 3. Access-control function
CREATE OR REPLACE FUNCTION public.can_access_proceedings(conf_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    -- Accepted + Paid + Presented authors
    SELECT 1 FROM paper_submissions ps
    WHERE ps.conference_id = conf_id
      AND ps.user_id = auth.uid()
      AND ps.status = 'Accepted'
      AND ps.payment_status = 'paid'
      AND ps.presented = true

    UNION ALL

    -- Paid attendees
    SELECT 1 FROM conference_registrations cr
    WHERE cr.conference_id = conf_id
      AND cr.user_id = auth.uid()
      AND cr.role = 'attendee'
      AND cr.paid = true

    UNION ALL

    -- Organizers / owners always have access
    SELECT 1 FROM conference_staff cs
    WHERE cs.conference_id = conf_id
      AND cs.user_id = auth.uid()
      AND cs.role IN ('organizer', 'owner')
  );
$$;

-- 4. Enable RLS
ALTER TABLE conference_proceedings ENABLE ROW LEVEL SECURITY;

-- 5. SELECT policy — gated by can_access_proceedings()
CREATE POLICY "Allow authorized users to view proceedings"
  ON conference_proceedings
  FOR SELECT
  USING ( can_access_proceedings(conference_id) );

-- 6. INSERT policy — only organizers / owners
CREATE POLICY "Allow organizers to insert proceedings"
  ON conference_proceedings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conference_staff cs
      WHERE cs.conference_id = conference_proceedings.conference_id
        AND cs.user_id = auth.uid()
        AND cs.role IN ('organizer', 'owner')
    )
  );

-- 7. UPDATE policy — only organizers / owners
CREATE POLICY "Allow organizers to update proceedings"
  ON conference_proceedings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conference_staff cs
      WHERE cs.conference_id = conference_proceedings.conference_id
        AND cs.user_id = auth.uid()
        AND cs.role IN ('organizer', 'owner')
    )
  );

-- 8. DELETE policy — only organizers / owners
CREATE POLICY "Allow organizers to delete proceedings"
  ON conference_proceedings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conference_staff cs
      WHERE cs.conference_id = conference_proceedings.conference_id
        AND cs.user_id = auth.uid()
        AND cs.role IN ('organizer', 'owner')
    )
  );
