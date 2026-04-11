/* ================================================================
   Migration: Rename plan types
   
   early_adopter → pro
   enterprise    → institutional
   
   This migration safely updates stored plan_type values in the
   organizations table and updates the CHECK constraint.
   
   Backward compatibility is handled at the application layer via
   lib/config/pricing.ts → normalizePlanType() + LEGACY_PLAN_MAP
   ================================================================ */

-- 1. Drop the old CHECK constraint first (it only allows 'free', 'early_adopter', 'enterprise')
ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_plan_type_check;

-- 2. Add the new CHECK constraint that accepts both old and new values
ALTER TABLE organizations
  ADD CONSTRAINT organizations_plan_type_check
  CHECK (plan_type IN ('free', 'pro', 'institutional', 'early_adopter', 'enterprise'));

-- 3. Now safely update existing rows
UPDATE organizations
SET plan_type = 'pro'
WHERE plan_type = 'early_adopter';

UPDATE organizations
SET plan_type = 'institutional'
WHERE plan_type = 'enterprise';

-- 4. Update the default description for slot purchases
UPDATE organizer_slot_purchases
SET description = 'Conference Slot — Pro Plan'
WHERE description = 'Conference Slot — Early Adopter Plan';

-- 5. Update the column DEFAULT so new purchases use the new label
ALTER TABLE organizer_slot_purchases
  ALTER COLUMN description SET DEFAULT 'Conference Slot — Pro Plan';
