# Secret Key Scan Report

**Date**: 2026-03-02
**Auditor**: key-scanner
**Scope**: All source files, .env files, and .gitignore configuration

---

## Executive Summary

The codebase has **1 critical** finding (hardcoded Supabase URL in the admin client), **1 high** finding (unauthenticated debug endpoint exposing env var status), and **2 medium** findings. No actual API keys are hardcoded in source files, and .env files are properly gitignored.

---

## Detailed Findings

### Finding 1: Hardcoded Supabase URL in `lib/supabase/admin.ts`

**Severity**: CRITICAL

**File**: `lib/supabase/admin.ts` (line 4)

**Description**: The Supabase project URL is hardcoded as a string literal:
```typescript
const url = 'https://fivmliegmqukdshfduld.supabase.co';
```

This is problematic because:
- It leaks the production Supabase project ID in source code committed to git
- It bypasses the environment variable pattern used everywhere else
- It prevents using different Supabase instances for dev/staging/production
- Anyone with the project ID can attempt to interact with the Supabase REST API

**Fix**:
```typescript
// lib/supabase/admin.ts
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
```

---

### Finding 2: Debug endpoint `/api/debug/workflows` has no authentication

**Severity**: HIGH

**File**: `app/api/debug/workflows/route.ts`

**Description**: The GET handler exposes diagnostic information including:
- Which environment variables are SET vs MISSING (line 26-31)
- Workflow counts, domain breakdowns, and RPC function status
- The POST handler allows arbitrary vector search queries

This endpoint has **zero authentication**. Anyone who discovers the URL can probe the production environment for configuration status. While it doesn't expose actual key values (only SET/MISSING), this is still an information disclosure vulnerability that helps attackers understand the system.

**Fix** (add auth check at the top of both GET and POST handlers):
```typescript
export async function GET() {
  // Require admin secret for debug endpoint
  // Or: Remove this endpoint entirely before production launch
  const adminSecret = process.env.ADMIN_SEED_SECRET;
  if (!adminSecret) {
    return NextResponse.json({ error: 'Debug endpoint disabled' }, { status: 403 });
  }
  // ... rest of handler
}
```

**Best practice**: Delete this debug route entirely before launch, or gate it behind `NODE_ENV === 'development'`.

---

### Finding 3: `service_role` usage is server-side only (PASS)

**Severity**: N/A (informational)

**Files checked**:
- `lib/supabase/admin.ts` — server-only module, creates admin client
- `app/api/debug/workflows/route.ts` — API route (server-side)
- `app/api/admin/auto-seed/route.ts` — API route (server-side)

**Result**: All `SUPABASE_SERVICE_ROLE_KEY` references are in API routes or server-side library files. None are in client components or files prefixed with `use client`. The admin client in `lib/supabase/admin.ts` is only imported by server-side code. This is correct.

---

### Finding 4: `.env` files properly configured (PASS with note)

**Severity**: MEDIUM

**Files checked**: `.env.example`, `.env.local.template`

**Result**: No secrets are prefixed with `NEXT_PUBLIC_`. The properly public variables are:
- `NEXT_PUBLIC_SUPABASE_URL` — public by design
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public by design
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — public by design
- `NEXT_PUBLIC_APP_URL` — public by design

Server-only secrets are correctly unprefixed:
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

**Note**: The `.env.local.template` contains the actual Supabase project URL (`https://fivmliegmqukdshfduld.supabase.co`). While this is a public value (also in the committed admin.ts), committing templates with real project URLs is not ideal. Consider using placeholder values in templates.

**Fix**: In `.env.local.template`, change line 5 to:
```
NEXT_PUBLIC_SUPABASE_URL=<paste from Vercel>
```

---

### Finding 5: No hardcoded API keys in source (PASS)

**Severity**: N/A (informational)

**Scan results**: Searched all `.ts`, `.tsx`, `.js`, `.jsx` files for patterns matching:
- `sk-ant-` (Anthropic keys)
- `sk_live_` / `sk_test_` (Stripe keys)
- `whsec_` (Stripe webhook secrets)

**Result**: No hardcoded API keys found in any source files. All keys are accessed via `process.env`.

---

### Finding 6: `.gitignore` properly configured (PASS)

**Severity**: N/A (informational)

**File**: `.gitignore`

**Verified exclusions**:
- `.env*.local` — covers .env.local
- `.env` — covers base .env
- `.env.production` — covers production env
- `/node_modules` — excludes dependencies
- `/.next/` — excludes build output

**Note**: `.env.local.template` is listed in `.gitignore` but this is a template file that arguably should be committed (it contains no real secrets, just placeholders). Current setup is acceptable.

---

### Finding 7: Admin seed endpoint uses GET with key in URL parameter

**Severity**: MEDIUM

**File**: `app/api/admin/auto-seed/route.ts` (line 23)

**Description**: The auto-seed endpoint accepts the admin secret as a URL query parameter:
```
GET /api/admin/auto-seed?key=YOUR_SECRET
```

Secrets in URL parameters are logged in:
- Server access logs
- Browser history
- Vercel function logs
- Any reverse proxy logs

**Fix**: Change to POST with the secret in the request body or Authorization header:
```typescript
export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization');
  const adminSecret = process.env.ADMIN_SEED_SECRET;
  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... rest of handler
}
```

---

## Summary Table

| # | Finding | Severity | File | Issue | Fix Available |
|---|---------|----------|------|-------|---------------|
| 1 | Hardcoded Supabase URL | **CRITICAL** | lib/supabase/admin.ts | Production URL in source | Yes |
| 2 | Debug endpoint unauthenticated | **HIGH** | app/api/debug/workflows/route.ts | Info disclosure, no auth | Yes |
| 3 | service_role server-side only | PASS | multiple | Correct usage | N/A |
| 4 | .env prefixes correct | **MEDIUM** | .env.local.template | Real URL in template | Yes |
| 5 | No hardcoded API keys | PASS | all source files | Clean | N/A |
| 6 | .gitignore correct | PASS | .gitignore | Properly configured | N/A |
| 7 | Admin secret in URL param | **MEDIUM** | app/api/admin/auto-seed/route.ts | Secret in query string | Yes |
