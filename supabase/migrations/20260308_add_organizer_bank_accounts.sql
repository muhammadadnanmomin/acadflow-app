-- ============================================================
-- Organizer Bank Accounts
-- Collects bank details for future Razorpay Route payouts
-- ============================================================

CREATE TABLE IF NOT EXISTS organizer_bank_accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_holder_name   TEXT NOT NULL,
  account_number        TEXT NOT NULL,
  ifsc_code             TEXT NOT NULL,
  bank_name             TEXT NOT NULL,
  branch_name           TEXT,
  is_verified           BOOLEAN DEFAULT false,
  razorpay_account_id   TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now(),

  -- One bank account per organizer
  CONSTRAINT uq_organizer_bank UNIQUE (organizer_id)
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_bank_accounts_organizer
  ON organizer_bank_accounts(organizer_id);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE organizer_bank_accounts ENABLE ROW LEVEL SECURITY;

-- Organizers can read their own bank details
CREATE POLICY "organizers_select_own_bank"
  ON organizer_bank_accounts
  FOR SELECT
  USING (auth.uid() = organizer_id);

-- Organizers can insert their own bank details
CREATE POLICY "organizers_insert_own_bank"
  ON organizer_bank_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

-- Organizers can update their own bank details
CREATE POLICY "organizers_update_own_bank"
  ON organizer_bank_accounts
  FOR UPDATE
  USING (auth.uid() = organizer_id)
  WITH CHECK (auth.uid() = organizer_id);

-- Service role (admin) can do anything (implicit, bypasses RLS)
