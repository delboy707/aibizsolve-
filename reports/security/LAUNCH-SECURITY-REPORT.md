# QEP AISolve — Launch Security Report

**Date**: 2026-03-02
**Team**: security-audit (rls-auditor, key-scanner, header-reviewer)
**Classification**: Pre-launch security gate

---

## Verdict: NOT READY FOR LAUNCH

There are **5 CRITICAL** and **5 HIGH** severity findings that must be resolved before production launch. Estimated fix time: **2-4 hours** for all critical + high items.

---

## Prioritized Action List

### CRITICAL — Must fix before launch (Block deployment)

| Priority | Finding | Source | Risk | Fix Time |
|----------|---------|--------|------|----------|
| **P0** | `claim_founding_leader_slot()` callable by anon — any unauthenticated user can exhaust all 100 founding slots | RLS Audit #5 | Business-critical abuse | 5 min |
| **P0** | `reset_report_count_if_needed()` callable by any role — any user can reset anyone's report count to 0 | RLS Audit #6 | Billing bypass | 5 min |
| **P1** | `workflows` table USING(true) — anon can read all proprietary prompts and source_book (violates invisible workflow architecture) | RLS Audit #1 | IP theft | 5 min |
| **P2** | No Content-Security-Policy header — zero XSS protection, combined with dangerouslySetInnerHTML usage | Headers Audit #1 | XSS attacks | 15 min |
| **P3** | Hardcoded Supabase URL in `lib/supabase/admin.ts` — production project ID committed to git | Key Scan #1 | Info disclosure | 5 min |

### HIGH — Should fix before launch

| Priority | Finding | Source | Risk | Fix Time |
|----------|---------|--------|------|----------|
| **P4** | Debug endpoint `/api/debug/workflows` has zero authentication — exposes env var status and allows arbitrary vector search | Key Scan #2 | Info disclosure | 10 min |
| **P5** | `payment_stats` table USING(true) — anon can read segment payment averages | RLS Audit #2 | Data exposure | 5 min |
| **P6** | `app_config` table USING(TRUE) — anon can read founding leader slot counts and future config | RLS Audit #3 | Data exposure | 5 min |
| **P7** | No HSTS header — browsers don't enforce HTTPS | Headers Audit #2 | Downgrade attacks | 5 min |
| **P8** | No Permissions-Policy — browser features (camera, mic, geo) unrestricted | Headers Audit #3 | Feature abuse | 5 min |

### MEDIUM — Fix within first week post-launch

| Priority | Finding | Source | Risk | Fix Time |
|----------|---------|--------|------|----------|
| **P9** | npm HIGH vulnerability in Next.js (DoS vectors) | Headers Audit #4 | Denial of service | 10 min |
| **P10** | Admin seed endpoint uses GET with secret in URL parameter — logged everywhere | Key Scan #7 | Secret exposure | 15 min |
| **P11** | `dangerouslySetInnerHTML` in 2 components without sanitization | Headers Audit #7 | XSS vector | 20 min |
| **P12** | Real Supabase URL in .env.local.template | Key Scan #4 | Minor info leak | 2 min |
| **P13** | `next.config.ts` has no security headers for static assets | Headers Audit #6 | Partial coverage | 10 min |

---

## Fix Instructions: All Criticals in One Migration

Create a new file `supabase/migrations/009_security_hardening.sql`:

```sql
-- ============================================================
-- 009_security_hardening.sql
-- Fixes all CRITICAL and HIGH RLS/permission issues
-- Date: 2026-03-02
-- ============================================================

-- P0: Lock down claim_founding_leader_slot() — prevent anon slot exhaustion
REVOKE EXECUTE ON FUNCTION claim_founding_leader_slot() FROM anon;
REVOKE EXECUTE ON FUNCTION claim_founding_leader_slot() FROM public;
GRANT EXECUTE ON FUNCTION claim_founding_leader_slot() TO authenticated;
GRANT EXECUTE ON FUNCTION claim_founding_leader_slot() TO service_role;

-- P0: Lock down reset_report_count_if_needed() — prevent billing bypass
REVOKE EXECUTE ON FUNCTION reset_report_count_if_needed(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION reset_report_count_if_needed(UUID) FROM public;
REVOKE EXECUTE ON FUNCTION reset_report_count_if_needed(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION reset_report_count_if_needed(UUID) TO service_role;

-- P1: Restrict workflows to authenticated only (reverts 006 USING(true))
DROP POLICY IF EXISTS "Anyone can read workflows" ON workflows;
CREATE POLICY "Authenticated users can read workflows"
  ON workflows FOR SELECT
  USING (auth.role() = 'authenticated');

-- P5: Restrict payment_stats to authenticated only
DROP POLICY IF EXISTS "Anyone can read payment stats" ON payment_stats;
CREATE POLICY "Authenticated users can read payment stats"
  ON payment_stats FOR SELECT
  USING (auth.role() = 'authenticated');

-- P6: Restrict app_config to authenticated only
DROP POLICY IF EXISTS "Anyone can read app_config" ON app_config;
CREATE POLICY "Authenticated users can read app_config"
  ON app_config FOR SELECT
  USING (auth.role() = 'authenticated');
```

## Fix Instructions: Security Headers

Replace the security headers block in `middleware.ts` (lines 64-68) with:

```typescript
// Security headers — complete set
supabaseResponse.headers.set('X-Frame-Options', 'DENY');
supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');
supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
supabaseResponse.headers.set(
  'Strict-Transport-Security',
  'max-age=31536000; includeSubDomains; preload'
);
supabaseResponse.headers.set(
  'Permissions-Policy',
  'camera=(), microphone=(), geolocation=(), interest-cohort=()'
);
supabaseResponse.headers.set('X-XSS-Protection', '0');
supabaseResponse.headers.set(
  'Content-Security-Policy',
  [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://api.openai.com https://api.stripe.com",
    "frame-src https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
);
```

## Fix Instructions: Hardcoded URL

In `lib/supabase/admin.ts`, replace line 4:
```typescript
// BEFORE (hardcoded):
const url = 'https://fivmliegmqukdshfduld.supabase.co';

// AFTER (from env):
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url || !key) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}
```

## Fix Instructions: Debug Endpoint

Either delete `app/api/debug/workflows/route.ts` before launch, or add auth gating:
```typescript
// Add at top of GET and POST handlers:
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
}
```

## Fix Instructions: npm Vulnerabilities

```bash
npm audit fix
# If Next.js vulnerability persists:
npm install next@latest
```

---

## Passing Checks (No Action Required)

| Area | Status | Details |
|------|--------|---------|
| RLS enabled on all tables | PASS | All 8 public tables have RLS ON |
| No dangerous extensions | PASS | Only pgvector installed |
| No hardcoded API keys | PASS | All keys via process.env |
| .gitignore covers .env files | PASS | All .env patterns excluded |
| service_role server-side only | PASS | Only in API routes and lib/supabase/admin.ts |
| CORS configuration | PASS | Same-origin default, no wildcard origins |
| No eval() usage | PASS | Clean codebase |
| No dangerous extensions | PASS | No http_get/http_post/vault |

---

## Post-Fix Verification

After applying all fixes, verify:

1. **RLS hardening**:
   ```bash
   # From an unauthenticated Supabase client, these should all fail:
   # SELECT * FROM workflows → denied
   # SELECT * FROM payment_stats → denied
   # SELECT claim_founding_leader_slot() → denied
   ```

2. **Security headers**: Visit the deployed site and check headers at https://securityheaders.com

3. **Debug endpoint**: Verify `/api/debug/workflows` returns 404 in production

4. **npm audit**: Run `npm audit` and confirm 0 high/critical vulnerabilities

---

## Individual Report References

- [RLS Audit](./rls-audit.md) — 3 CRITICAL, 3 HIGH, 2 MEDIUM
- [Key Scan](./key-scan.md) — 1 CRITICAL, 1 HIGH, 2 MEDIUM
- [Headers Audit](./headers-audit.md) — 1 CRITICAL, 3 HIGH, 3 MEDIUM
