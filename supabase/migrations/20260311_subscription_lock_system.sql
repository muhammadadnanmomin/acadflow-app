-- ============================================================
-- Confairo — Subscription Lock System Migration
-- Introduces slot-based conference model for early_adopter plan
-- ============================================================

-- 1. Add conference_slots column (default 1 for free-plan orgs)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS conference_slots INTEGER DEFAULT 1;

-- 2. Migrate existing 'pro' orgs → 'early_adopter'
--    Copy conference_limit into conference_slots before dropping
UPDATE organizations
SET conference_slots = COALESCE(conference_limit, 1),
    plan_type = 'early_adopter'
WHERE plan_type = 'pro';

-- 3. Drop old columns that are now centralized in app config
ALTER TABLE organizations
  DROP COLUMN IF EXISTS conference_limit;

ALTER TABLE organizations
  DROP COLUMN IF EXISTS submission_limit;

-- 4. Update plan_type CHECK constraint
--    Drop old constraint first, then add new one
ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_plan_type_check;

ALTER TABLE organizations
  ADD CONSTRAINT organizations_plan_type_check
    CHECK (plan_type IN ('free', 'early_adopter', 'enterprise'));
