-- ================================================================
-- Confairo — Organizer Slot Purchases table
-- Tracks every conference slot purchase for billing history.
-- ================================================================

CREATE TABLE IF NOT EXISTS organizer_slot_purchases (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    payment_id  TEXT NOT NULL,
    order_id    TEXT NOT NULL,
    amount      INTEGER NOT NULL DEFAULT 1999,
    description TEXT NOT NULL DEFAULT 'Conference Slot — Early Adopter Plan',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast org lookups
CREATE INDEX IF NOT EXISTS idx_slot_purchases_org
    ON organizer_slot_purchases(organization_id);

-- RLS: org members can read their own purchases
ALTER TABLE organizer_slot_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their slot purchases"
    ON organizer_slot_purchases
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
        )
    );
