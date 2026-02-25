-- Migration: 008_tiered_pricing.sql
-- Adds three-tier subscription model (free / starter / professional / founding_leader)
-- replacing the previous PWYW payment_tier column.
-- IMPORTANT: Do NOT drop old columns — add new ones and update constraints only.

-- ─── Users table: new subscription fields ────────────────────────────────────

-- Primary tier column (replaces old payment_tier for new logic)
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier TEXT
  DEFAULT 'free'
  CHECK (subscription_tier IN ('free', 'starter', 'professional', 'founding_leader'));

-- Report counting per billing cycle
ALTER TABLE users ADD COLUMN IF NOT EXISTS reports_used_this_cycle INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_cycle_start TIMESTAMPTZ DEFAULT NOW();

-- Activation tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_report_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;

-- Free report tracking (for non-subscribers: only one report ever)
ALTER TABLE users ADD COLUMN IF NOT EXISTS free_report_used BOOLEAN DEFAULT FALSE;

-- Stripe fields (may already exist — safe to re-run with IF NOT EXISTS)
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- ─── Documents table: alchemy tracking ───────────────────────────────────────

-- Track whether the Alchemy section was included in a document
ALTER TABLE documents ADD COLUMN IF NOT EXISTS includes_alchemy BOOLEAN DEFAULT FALSE;

-- NOTE: alchemy_content JSONB already exists from 001_initial_schema.sql.
-- The raw markdown string is accessible via alchemy_content->>'raw'.
-- No additional TEXT column is needed.

-- ─── app_config: global key/value store ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Founding Leader slot counter (cap = 100)
INSERT INTO app_config (key, value)
  VALUES ('founding_leader', '{"count": 0, "cap": 100}')
  ON CONFLICT (key) DO NOTHING;

-- RLS: authenticated users can read, service role can write
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read app_config" ON app_config;
CREATE POLICY "Anyone can read app_config" ON app_config
  FOR SELECT USING (TRUE);

-- ─── Functions ────────────────────────────────────────────────────────────────

-- Atomically claim one Founding Leader slot.
-- Returns TRUE if a slot was successfully claimed, FALSE if cap is reached.
CREATE OR REPLACE FUNCTION claim_founding_leader_slot()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count INTEGER;
  cap           INTEGER;
BEGIN
  SELECT (value->>'count')::INTEGER, (value->>'cap')::INTEGER
    INTO current_count, cap
    FROM app_config
   WHERE key = 'founding_leader'
     FOR UPDATE;        -- row-level lock prevents race conditions

  IF current_count >= cap THEN
    RETURN FALSE;
  END IF;

  UPDATE app_config
     SET value      = jsonb_set(value, '{count}', to_jsonb(current_count + 1)),
         updated_at = NOW()
   WHERE key = 'founding_leader';

  RETURN TRUE;
END;
$$;

-- Reset a user's monthly report count if their billing cycle has elapsed.
CREATE OR REPLACE FUNCTION reset_report_count_if_needed(user_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
     SET reports_used_this_cycle = 0,
         billing_cycle_start     = NOW()
   WHERE id = user_uuid
     AND billing_cycle_start < NOW() - INTERVAL '30 days';
END;
$$;

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
