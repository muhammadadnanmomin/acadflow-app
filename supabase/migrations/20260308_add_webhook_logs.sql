-- ============================================================
-- Webhook Logs Table
-- Stores every Razorpay webhook call for audit + idempotency
-- ============================================================

CREATE TABLE IF NOT EXISTS webhook_logs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type            TEXT NOT NULL,
  razorpay_event_id     TEXT UNIQUE,
  razorpay_payment_id   TEXT,
  razorpay_order_id     TEXT,
  payload               JSONB NOT NULL,
  signature             TEXT NOT NULL,
  processed             BOOLEAN DEFAULT false,
  error                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- Fast lookup for idempotency check
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id
  ON webhook_logs(razorpay_event_id);

-- Fast lookup when debugging a specific payment
CREATE INDEX IF NOT EXISTS idx_webhook_logs_payment_id
  ON webhook_logs(razorpay_payment_id);

-- ============================================================
-- Additional columns on paper_submissions
-- ============================================================

ALTER TABLE paper_submissions
  ADD COLUMN IF NOT EXISTS payment_method  TEXT,
  ADD COLUMN IF NOT EXISTS refund_status   TEXT;
