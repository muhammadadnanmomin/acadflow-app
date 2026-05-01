-- ============================================================
-- AI Usage Tracking — Credit & Add-on Management
-- Tracks per-conference AI credit usage and purchased add-ons
-- Free plan → 5 credits | Pro plan → 100 credits
-- ============================================================

-- -----------------------------------------------------------
-- 1. ai_usage — One row per conference (credit ledger)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conference_id UUID NOT NULL UNIQUE REFERENCES conferences(id) ON DELETE CASCADE,
  used_credits INT DEFAULT 0 CHECK (used_credits >= 0),
  total_credits INT DEFAULT 5 CHECK (total_credits >= 0),
  plan_type TEXT DEFAULT 'free',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fast lookup by conference
CREATE INDEX IF NOT EXISTS idx_ai_usage_conference
  ON ai_usage(conference_id);

-- -----------------------------------------------------------
-- 2. ai_credit_purchases — Add-on purchase history
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_credit_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conference_id UUID NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
  credits_added INT NOT NULL,
  amount_paid INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fast lookup by conference
CREATE INDEX IF NOT EXISTS idx_ai_credit_purchases_conference
  ON ai_credit_purchases(conference_id);

-- -----------------------------------------------------------
-- 3. Row Level Security
-- -----------------------------------------------------------
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on ai_usage"
  ON ai_usage
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on ai_credit_purchases"
  ON ai_credit_purchases
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- -----------------------------------------------------------
-- 4. Auto-provision: Insert an ai_usage row when a new
--    conference is created so every conference starts with
--    a credit ledger automatically.
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION provision_ai_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ai_usage (conference_id, used_credits, total_credits, plan_type)
  VALUES (NEW.id, 0, 5, 'free')
  ON CONFLICT (conference_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_provision_ai_usage
  AFTER INSERT ON conferences
  FOR EACH ROW
  EXECUTE FUNCTION provision_ai_usage();

-- -----------------------------------------------------------
-- 5. Helper: Safely consume 1 AI credit (row-locked)
--    Returns TRUE if a credit was consumed, FALSE if limit hit.
--    Uses SELECT FOR UPDATE to prevent concurrent over-spend.
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_ai_usage(p_conference_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_used INT;
  v_total INT;
BEGIN
  -- Lock the row to prevent concurrent double-deduction
  SELECT used_credits, total_credits
    INTO v_used, v_total
    FROM ai_usage
   WHERE conference_id = p_conference_id
     FOR UPDATE;

  -- Row doesn't exist
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Already at or over limit
  IF v_used >= v_total THEN
    RETURN FALSE;
  END IF;

  -- Safe to deduct
  UPDATE ai_usage
     SET used_credits = v_used + 1,
         updated_at = now()
   WHERE conference_id = p_conference_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------
-- 6. Helper: Add purchased credits (transactional + validated)
--    Wraps insert + update in a single atomic operation.
--    Rejects invalid input (non-positive credits/amount).
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION add_ai_credits(
  p_conference_id UUID,
  p_credits INT,
  p_amount INT
)
RETURNS VOID AS $$
BEGIN
  -- Input validation
  IF p_credits <= 0 THEN
    RAISE EXCEPTION 'credits must be positive, got %', p_credits;
  END IF;
  IF p_amount < 0 THEN
    RAISE EXCEPTION 'amount cannot be negative, got %', p_amount;
  END IF;

  -- Lock the row to prevent concurrent modification
  PERFORM 1 FROM ai_usage
   WHERE conference_id = p_conference_id
     FOR UPDATE;

  -- Record the purchase
  INSERT INTO ai_credit_purchases (conference_id, credits_added, amount_paid)
  VALUES (p_conference_id, p_credits, p_amount);

  -- Increase the conference's total credits
  UPDATE ai_usage
  SET total_credits = total_credits + p_credits,
      updated_at = now()
  WHERE conference_id = p_conference_id;
END;
$$ LANGUAGE plpgsql;
