-- Add payment fee breakdown columns to paper_submissions
-- Stores the full fee breakdown for audit trail, reconciliation, and receipt re-generation.

ALTER TABLE paper_submissions
  ADD COLUMN IF NOT EXISTS payment_order_id       TEXT,
  ADD COLUMN IF NOT EXISTS payment_amount          NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS payment_conference_fee  NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS payment_gateway_fee     NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS payment_gst             NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS paid_at                 TIMESTAMPTZ;
