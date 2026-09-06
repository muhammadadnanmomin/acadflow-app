-- ============================================================
-- Confairo — Add SaaS plan fields to organizations
-- plan_type: free | pro | enterprise
-- conference_limit / submission_limit: NULL = unlimited
-- ============================================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free'
    CHECK (plan_type IN ('free', 'pro', 'enterprise'));

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS conference_limit INTEGER DEFAULT 1;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS submission_limit INTEGER DEFAULT 150;

-- Store Razorpay payment ID for audit / webhook reconciliation
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS payment_id TEXT;
