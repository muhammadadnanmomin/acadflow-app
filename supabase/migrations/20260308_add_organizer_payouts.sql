-- ============================================================
-- Organizer Payouts
-- Manual payout tracking (future: Razorpay Route automation)
-- ============================================================

CREATE TABLE IF NOT EXISTS organizer_payouts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conference_id         UUID REFERENCES conferences(id) ON DELETE SET NULL,
  amount                NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  status                TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','processing','completed','failed')),
  notes                 TEXT,
  admin_notes           TEXT,
  processed_by          UUID REFERENCES profiles(id),
  razorpay_transfer_id  TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  processed_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payouts_organizer
  ON organizer_payouts(organizer_id);

CREATE INDEX IF NOT EXISTS idx_payouts_status
  ON organizer_payouts(status);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE organizer_payouts ENABLE ROW LEVEL SECURITY;

-- Organizers can read their own payouts
CREATE POLICY "organizers_select_own_payouts"
  ON organizer_payouts
  FOR SELECT
  USING (auth.uid() = organizer_id);

-- Organizers can insert their own payout requests
CREATE POLICY "organizers_insert_own_payouts"
  ON organizer_payouts
  FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);
