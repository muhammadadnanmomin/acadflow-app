-- ============================================================
-- RLS policies for conference_staff table
-- Users can read their own staff memberships
-- Conference owners (via conferences table) can view all staff
-- Only service role (admin) can insert/update/delete
-- ============================================================

-- Ensure RLS is enabled
ALTER TABLE public.conference_staff ENABLE ROW LEVEL SECURITY;

-- 1. Users can read their own staff records
CREATE POLICY "Users can view own staff roles"
  ON public.conference_staff
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Conference owners can view all staff for their conferences
--    (uses conferences table to avoid self-referencing recursion)
CREATE POLICY "Conference owners can view staff"
  ON public.conference_staff
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conferences c
      WHERE c.id = conference_staff.conference_id
        AND c.organizer_id = auth.uid()
    )
  );
