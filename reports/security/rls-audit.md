# RLS Security Audit Report

**Date**: 2026-03-02
**Auditor**: rls-auditor (automated)
**Scope**: All Supabase migration files in `supabase/migrations/`

---

## Executive Summary

The project has RLS enabled on all 7 public tables, which is good. However, there are **3 critical**, **3 high**, and **2 medium** severity findings including overly permissive `USING (true)` policies that expose internal data to unauthenticated users, SECURITY DEFINER functions callable by any role, and missing write-protection policies on several tables.

---

## Tables Inventory

| Table | Created In | RLS Enabled In | Status |
|-------|-----------|----------------|--------|
| `users` | 001 | 003 | RLS ON |
| `decisions` | 001 | 003 | RLS ON |
| `messages` | 001 | 003 | RLS ON |
| `documents` | 001 | 003 | RLS ON |
| `workflows` | 002 | 003 | RLS ON |
| `payment_stats` | 001 | 003 | RLS ON |
| `uploaded_documents` | 005 | 005 | RLS ON |
| `app_config` | 008 | 008 | RLS ON |

All 8 public tables have RLS enabled. No tables are missing RLS enablement.

---

## Detailed Findings

### Finding 1: `workflows` table has `USING (true)` SELECT policy -- exposes `source_book` and `full_prompt` to anon role

**Severity**: CRITICAL

**File**: `supabase/migrations/006_fix_workflows_rls.sql` (lines 11-13)

**Description**: Migration 006 replaced the original `auth.role() = 'authenticated'` policy with `USING (true)`, making the entire `workflows` table readable by the `anon` role (unauthenticated users). The `workflows` table contains sensitive internal columns:
- `source_book` -- labeled "INTERNAL ONLY" in the schema, contains book/methodology source names that users must never see per CLAUDE.md ("invisible workflow architecture")
- `full_prompt` -- contains the full AI prompt text, which is proprietary business logic

Any unauthenticated request to Supabase can read all workflow data including these internal fields.

**Fix SQL** (new migration):
```sql
-- Revert workflows to authenticated-only access
DROP POLICY IF EXISTS "Anyone can read workflows" ON workflows;

CREATE POLICY "Authenticated users can read workflows"
  ON workflows FOR SELECT
  USING (auth.role() = 'authenticated');
```

**Note**: If server-side API routes need to read workflows without user auth context, use the `service_role` key in those routes instead of relaxing RLS to anon.

---

### Finding 2: `payment_stats` table has `USING (true)` SELECT policy -- exposes aggregate payment data to anon role

**Severity**: HIGH

**File**: `supabase/migrations/006_fix_workflows_rls.sql` (lines 15-18)

**Description**: The `payment_stats` table is readable by the `anon` role. While this table contains aggregated data (segment averages, not individual payment info), exposing it to unauthenticated users is unnecessary. An attacker could query segment payment averages and counts without being logged in.

**Fix SQL** (new migration):
```sql
DROP POLICY IF EXISTS "Anyone can read payment stats" ON payment_stats;

CREATE POLICY "Authenticated users can read payment stats"
  ON payment_stats FOR SELECT
  USING (auth.role() = 'authenticated');
```

---

### Finding 3: `app_config` table has `USING (TRUE)` SELECT policy -- exposes config to anon role

**Severity**: HIGH

**File**: `supabase/migrations/008_tiered_pricing.sql` (lines 53-55)

**Description**: The `app_config` table is readable by the `anon` role. It currently stores the Founding Leader slot counter (count and cap). While not immediately dangerous, this table is a global key/value store that may hold sensitive configuration in the future. Exposing it to unauthenticated users violates the principle of least privilege.

**Fix SQL** (new migration):
```sql
DROP POLICY IF EXISTS "Anyone can read app_config" ON app_config;

CREATE POLICY "Authenticated users can read app_config"
  ON app_config FOR SELECT
  USING (auth.role() = 'authenticated');
```

---

### Finding 4: `app_config` table has no INSERT/UPDATE/DELETE policies -- service_role only by default, but no explicit restriction

**Severity**: MEDIUM

**File**: `supabase/migrations/008_tiered_pricing.sql`

**Description**: The `app_config` table has RLS enabled and only a SELECT policy. Since RLS is enabled and there are no INSERT/UPDATE/DELETE policies, writes are implicitly denied for `anon` and `authenticated` roles. This is actually safe by default in Supabase (no policy = deny). However, it is best practice to add an explicit comment or a deny-all policy to make the intent clear and prevent accidental policy additions later.

**Recommendation**: No immediate fix required. The current state is safe. For defense in depth, consider adding a comment to the migration noting that writes are intentionally restricted to `service_role`.

---

### Finding 5: `claim_founding_leader_slot()` SECURITY DEFINER function callable by any role

**Severity**: CRITICAL

**File**: `supabase/migrations/008_tiered_pricing.sql` (lines 61-87)

**Description**: The `claim_founding_leader_slot()` function is declared with `SECURITY DEFINER`, meaning it runs with the permissions of the function creator (typically `postgres`). By default in Supabase, functions are executable by `public` (which includes `anon` and `authenticated`). This means:
- Any unauthenticated user can call `SELECT claim_founding_leader_slot()` via the Supabase REST API
- Each call increments the Founding Leader counter by 1
- An attacker could exhaust all 100 slots with 100 unauthenticated requests
- There is no user validation -- the function does not check who is claiming the slot

**Fix SQL** (new migration):
```sql
-- Restrict execution to authenticated users only
REVOKE EXECUTE ON FUNCTION claim_founding_leader_slot() FROM anon;
REVOKE EXECUTE ON FUNCTION claim_founding_leader_slot() FROM public;
GRANT EXECUTE ON FUNCTION claim_founding_leader_slot() TO authenticated;

-- Optionally, if this should only be called from server-side code:
-- REVOKE EXECUTE ON FUNCTION claim_founding_leader_slot() FROM authenticated;
-- GRANT EXECUTE ON FUNCTION claim_founding_leader_slot() TO service_role;
```

---

### Finding 6: `reset_report_count_if_needed()` SECURITY DEFINER function callable by any role

**Severity**: CRITICAL

**File**: `supabase/migrations/008_tiered_pricing.sql` (lines 90-102)

**Description**: The `reset_report_count_if_needed(user_uuid UUID)` function is `SECURITY DEFINER` and accepts an arbitrary `user_uuid` parameter. By default it is callable by `anon` and `authenticated`. This means:
- Any authenticated user can call this function with ANY user's UUID
- It resets the target user's `reports_used_this_cycle` to 0
- An attacker could reset their own report count to get unlimited reports
- An attacker could also reset other users' counters (less harmful but still unauthorized)

**Fix SQL** (new migration):
```sql
-- Restrict to service_role only (should only be called from server-side API routes)
REVOKE EXECUTE ON FUNCTION reset_report_count_if_needed(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION reset_report_count_if_needed(UUID) FROM public;
REVOKE EXECUTE ON FUNCTION reset_report_count_if_needed(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION reset_report_count_if_needed(UUID) TO service_role;
```

---

### Finding 7: `handle_new_user()` SECURITY DEFINER trigger function -- acceptable but should be audited

**Severity**: MEDIUM

**File**: `supabase/migrations/005_user_profile_trigger.sql` (lines 4-11)

**Description**: The `handle_new_user()` function is `SECURITY DEFINER` which is required for trigger functions that insert into tables with RLS. This is a standard Supabase pattern. The function is triggered by `AFTER INSERT ON auth.users`, which cannot be invoked directly by end users (only the auth system creates rows in `auth.users`). The risk is low.

However, the function does not validate the email or perform any sanitization. Since it only copies `NEW.id` and `NEW.email` from the auth system, and the auth system already validates these, this is acceptable.

**Recommendation**: No fix required. This is a standard and safe pattern.

---

### Finding 8: `match_workflows()` function exposes `source_book` via `full_prompt` column

**Severity**: HIGH

**File**: `supabase/migrations/007_fix_match_workflows_return.sql`

**Description**: The `match_workflows()` function returns `full_prompt` and `task_summary` columns in its result set. While the function itself is not `SECURITY DEFINER` (it runs with caller's permissions), combined with Finding 1 (`USING (true)` on workflows), the `anon` role can call this function via the Supabase RPC endpoint and retrieve full prompt text for any workflow. The `source_book` column is not directly returned by the function, but the `full_prompt` column likely contains proprietary methodology details.

**Fix**: Resolving Finding 1 (restricting workflows to authenticated) mitigates this. Additionally, consider whether `full_prompt` should be returned at all from a client-callable function, or if this should be restricted to `service_role`.

---

### Finding 9: No dangerous extensions found

**Severity**: N/A (informational)

**Description**: The only extension created is `vector` (pgvector) in migration 001. No `http_get`, `http_post`, `pg_net`, or `vault` extensions are created. This is safe.

---

### Finding 10: `users` table `stripe_customer_id` and `stripe_subscription_id` readable by the user

**Severity**: LOW (informational)

**File**: `supabase/migrations/003_rls_policies.sql` (lines 10-12)

**Description**: The users SELECT policy allows users to read their own row, which includes `stripe_customer_id` and `stripe_subscription_id`. While these are the user's own Stripe IDs and not directly exploitable, exposing Stripe IDs to the client is generally unnecessary. If the frontend does not need these fields, consider either not selecting them in queries or adding a view that excludes them.

**Recommendation**: No RLS change needed. Handle at the application query level by only selecting necessary columns.

---

## Summary Table

| # | Finding | Severity | Table/Function | Issue | Fix Available |
|---|---------|----------|----------------|-------|---------------|
| 1 | `workflows` USING (true) | **CRITICAL** | workflows | Anon can read source_book + full_prompt | Yes |
| 2 | `payment_stats` USING (true) | **HIGH** | payment_stats | Anon can read payment aggregates | Yes |
| 3 | `app_config` USING (TRUE) | **HIGH** | app_config | Anon can read app configuration | Yes |
| 4 | `app_config` no write policies | **MEDIUM** | app_config | Implicit deny is safe but not explicit | Informational |
| 5 | `claim_founding_leader_slot()` callable by anon | **CRITICAL** | function | Anon can exhaust all 100 founding slots | Yes |
| 6 | `reset_report_count_if_needed()` callable by any role | **CRITICAL** | function | Any user can reset any user's report count | Yes |
| 7 | `handle_new_user()` SECURITY DEFINER | **MEDIUM** | function | Standard pattern, acceptable risk | None needed |
| 8 | `match_workflows()` exposes full_prompt | **HIGH** | function | Proprietary prompts accessible via RPC | Fix Finding 1 |
| 9 | No dangerous extensions | N/A | -- | Clean | -- |
| 10 | Stripe IDs readable by user | LOW | users | Minor info exposure | Application-level |

---

## Recommended Fix Migration

The following single migration would address all CRITICAL and HIGH findings:

```sql
-- Migration: 009_security_hardening.sql
-- Fixes CRITICAL and HIGH RLS/permission issues found in security audit

-- ============================================================
-- FIX 1: Restrict workflows to authenticated users only
-- (Reverts 006_fix_workflows_rls.sql USING(true) policy)
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read workflows" ON workflows;

CREATE POLICY "Authenticated users can read workflows"
  ON workflows FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- FIX 2: Restrict payment_stats to authenticated users only
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read payment stats" ON payment_stats;

CREATE POLICY "Authenticated users can read payment stats"
  ON payment_stats FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- FIX 3: Restrict app_config to authenticated users only
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read app_config" ON app_config;

CREATE POLICY "Authenticated users can read app_config"
  ON app_config FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- FIX 4: Restrict claim_founding_leader_slot() to authenticated
-- ============================================================
REVOKE EXECUTE ON FUNCTION claim_founding_leader_slot() FROM anon;
REVOKE EXECUTE ON FUNCTION claim_founding_leader_slot() FROM public;
GRANT EXECUTE ON FUNCTION claim_founding_leader_slot() TO authenticated;
GRANT EXECUTE ON FUNCTION claim_founding_leader_slot() TO service_role;

-- ============================================================
-- FIX 5: Restrict reset_report_count_if_needed() to service_role
-- ============================================================
REVOKE EXECUTE ON FUNCTION reset_report_count_if_needed(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION reset_report_count_if_needed(UUID) FROM public;
REVOKE EXECUTE ON FUNCTION reset_report_count_if_needed(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION reset_report_count_if_needed(UUID) TO service_role;
```

---

## Notes

- All fixes are additive migrations that do not modify existing migration files.
- The `service_role` key should be used in server-side API routes that need to call restricted functions or read restricted tables without user auth context.
- After applying the fix migration, verify that the `/api/chat/route.ts` and `/api/workflows/search/route.ts` API routes use the `service_role` Supabase client when querying workflows, since the `anon` client will no longer have access.
