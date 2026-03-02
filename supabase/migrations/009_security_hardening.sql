-- ============================================================
-- 009_security_hardening.sql
-- Fixes all CRITICAL and HIGH RLS/permission issues
-- Date: 2026-03-02
-- ============================================================

REVOKE EXECUTE ON FUNCTION claim_founding_leader_slot() FROM anon;
REVOKE EXECUTE ON FUNCTION claim_founding_leader_slot() FROM public;
GRANT EXECUTE ON FUNCTION claim_founding_leader_slot() TO authenticated;
GRANT EXECUTE ON FUNCTION claim_founding_leader_slot() TO service_role;

REVOKE EXECUTE ON FUNCTION reset_report_count_if_needed(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION reset_report_count_if_needed(UUID) FROM public;
REVOKE EXECUTE ON FUNCTION reset_report_count_if_needed(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION reset_report_count_if_needed(UUID) TO service_role;

DROP POLICY IF EXISTS "Anyone can read workflows" ON workflows;
CREATE POLICY "Authenticated users can read workflows"
  ON workflows FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can read payment stats" ON payment_stats;
CREATE POLICY "Authenticated users can read payment stats"
  ON payment_stats FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can read app_config" ON app_config;
CREATE POLICY "Authenticated users can read app_config"
  ON app_config FOR SELECT
  USING (auth.role() = 'authenticated');
