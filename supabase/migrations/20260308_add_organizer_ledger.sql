-- ============================================================
-- Organizer Financial Ledger
-- Append-only double-entry inspired ledger
-- ============================================================

CREATE TABLE IF NOT EXISTS organizer_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payment_id      TEXT,
  entry_type      TEXT NOT NULL
                  CHECK (entry_type IN ('payment_credit','manual_payout','refund','adjustment')),
  credit          NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  debit           NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  balance_after   NUMERIC(12,2) NOT NULL,
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),

  -- Each entry is either a credit or a debit, never both
  CONSTRAINT chk_credit_xor_debit CHECK (
    (credit > 0 AND debit = 0) OR (credit = 0 AND debit > 0)
  )
);

-- Fast: get latest balance for an organizer
CREATE INDEX IF NOT EXISTS idx_ledger_organizer_created
  ON organizer_ledger(organizer_id, created_at DESC);

-- Fast: look up entries by payment reference
CREATE INDEX IF NOT EXISTS idx_ledger_payment_id
  ON organizer_ledger(payment_id);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE organizer_ledger ENABLE ROW LEVEL SECURITY;

-- Organizers can read their own ledger entries
CREATE POLICY "organizers_select_own_ledger"
  ON organizer_ledger
  FOR SELECT
  USING (auth.uid() = organizer_id);

-- Only server (service role) can insert — no client-side writes
-- (supabaseAdmin bypasses RLS, so no INSERT policy is needed)
