-- Fix RLS policies for shared reference tables (workflows, payment_stats)
-- These are read-only reference data, not user-specific data.
-- They need to be readable by all roles (anon, authenticated, service_role)
-- so that API routes work regardless of auth context.

-- Drop the overly restrictive policies
DROP POLICY IF EXISTS "Authenticated users can read workflows" ON workflows;
DROP POLICY IF EXISTS "Authenticated users can read payment stats" ON payment_stats;

-- Allow any role to SELECT from workflows (shared reference data)
CREATE POLICY "Anyone can read workflows"
  ON workflows FOR SELECT
  USING (true);

-- Allow any role to SELECT from payment_stats (shared reference data)
CREATE POLICY "Anyone can read payment stats"
  ON payment_stats FOR SELECT
  USING (true);
