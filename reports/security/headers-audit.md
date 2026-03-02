# Security Headers & Infrastructure Audit Report

**Date**: 2026-03-02
**Auditor**: header-reviewer
**Scope**: next.config.ts, middleware.ts, vercel.json, npm dependencies, CORS, XSS vectors

---

## Executive Summary

The application is missing critical security headers including HSTS, Content-Security-Policy, and Permissions-Policy. The middleware sets only 3 of 7 recommended headers. There is **1 critical** (missing CSP), **3 high** (missing HSTS, Permissions-Policy, npm vulnerabilities), and **3 medium** findings.

---

## Detailed Findings

### Finding 1: No Content-Security-Policy (CSP) header

**Severity**: CRITICAL

**File**: `middleware.ts` — CSP not configured; `next.config.ts` — no headers() function

**Description**: No Content-Security-Policy header is set anywhere in the application. CSP is the single most effective defense against XSS attacks. Without it, any injected script can:
- Steal user session tokens
- Exfiltrate data to external servers
- Modify page content

This is especially critical because the app uses `dangerouslySetInnerHTML` (see Finding 7).

**Fix** — Add CSP to `middleware.ts`:
```typescript
// Add after line 67 in middleware.ts
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

**Note**: The above CSP includes `'unsafe-inline'` for scripts and styles as a starting point. Ideally, migrate to nonce-based CSP for scripts to eliminate `'unsafe-inline'`.

---

### Finding 2: No Strict-Transport-Security (HSTS) header

**Severity**: HIGH

**Files**: `middleware.ts`, `next.config.ts`, `vercel.json` — none set HSTS

**Description**: HSTS tells browsers to always use HTTPS, preventing protocol downgrade attacks and cookie hijacking. While Vercel automatically redirects HTTP to HTTPS, the HSTS header provides additional protection by:
- Preventing SSL stripping attacks
- Ensuring subdomains also use HTTPS
- Enabling HSTS preload list inclusion

**Fix** — Add to `middleware.ts`:
```typescript
supabaseResponse.headers.set(
  'Strict-Transport-Security',
  'max-age=31536000; includeSubDomains; preload'
);
```

---

### Finding 3: No Permissions-Policy header

**Severity**: HIGH

**Files**: `middleware.ts`, `next.config.ts` — not configured

**Description**: The Permissions-Policy header restricts which browser features the page can use. Without it, if an attacker injects code, they could access the camera, microphone, or geolocation.

**Fix** — Add to `middleware.ts`:
```typescript
supabaseResponse.headers.set(
  'Permissions-Policy',
  'camera=(), microphone=(), geolocation=(), interest-cohort=()'
);
```

---

### Finding 4: npm audit shows 1 HIGH vulnerability in Next.js

**Severity**: HIGH

**Source**: `npm audit` output

**Vulnerabilities found**:
| Package | Severity | Issue |
|---------|----------|-------|
| `next` 15.6.0-canary.0 – 16.1.4 | **HIGH** | DoS via Image Optimizer, HTTP request deserialization DoS, Unbounded Memory via PPR |
| `diff` 4.0.0 – 4.0.3 | Low | DoS in parsePatch/applyPatch |
| `qs` 6.7.0 – 6.14.1 | Low | arrayLimit bypass DoS |

**Fix**:
```bash
npm audit fix
```

If that doesn't resolve the Next.js vulnerability, check for an updated Next.js version:
```bash
npm install next@latest
```

---

### Finding 5: Existing security headers are incomplete but correctly set

**Severity**: MEDIUM (partial coverage)

**File**: `middleware.ts` (lines 65-67)

**Currently set**:
| Header | Value | Status |
|--------|-------|--------|
| `X-Frame-Options` | `DENY` | Correct |
| `X-Content-Type-Options` | `nosniff` | Correct |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Correct |

**Missing**:
| Header | Recommended Value | Impact |
|--------|-------------------|--------|
| `Content-Security-Policy` | See Finding 1 | **CRITICAL** — XSS defense |
| `Strict-Transport-Security` | See Finding 2 | **HIGH** — HTTPS enforcement |
| `Permissions-Policy` | See Finding 3 | **HIGH** — Feature restriction |
| `X-XSS-Protection` | `0` | **MEDIUM** — Deprecated but harmless |

**Fix** — Complete the header block in `middleware.ts`. Replace lines 64-68 with:
```typescript
// Security headers
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

---

### Finding 6: `next.config.ts` has no security headers configuration

**Severity**: MEDIUM

**File**: `next.config.ts`

**Description**: The Next.js config only sets environment variable forwarding. It does not use the `headers()` async function to set security headers. While middleware handles headers for matched routes, `next.config.ts` headers would cover static assets and other paths not matched by middleware.

**Fix** — Add headers to `next.config.ts`:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

### Finding 7: `dangerouslySetInnerHTML` usage without CSP protection

**Severity**: MEDIUM

**Files**:
- `components/document/AlchemySection.tsx` (line 44)
- `app/document/[decisionId]/DocumentClient.tsx` (line 202)

**Description**: Both files use `dangerouslySetInnerHTML` to render content via a `renderLines()` function. If the content comes from AI-generated output that isn't sanitized, this is an XSS vector. While AI output is generally trusted, if any user input is reflected back through the AI response, it could contain malicious HTML/JavaScript.

**Fix** (defense in depth):
1. Implement CSP (Finding 1) — this is the primary mitigation
2. Sanitize the HTML before rendering:
```bash
npm install dompurify
npm install -D @types/dompurify
```
```typescript
import DOMPurify from 'dompurify';

// In the component:
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderLines(section.content)) }} />
```

---

### Finding 8: No explicit CORS configuration (PASS)

**Severity**: N/A (informational)

**Description**: No `Access-Control-Allow-Origin` headers or CORS middleware found in API routes. Next.js API routes default to same-origin only, which is the most secure default. The app uses Supabase client-side SDK which communicates directly with Supabase (not through Next.js API routes), so CORS is handled by Supabase's own configuration.

**Result**: No CORS issues found.

---

### Finding 9: `vercel.json` has no security configuration

**Severity**: N/A (informational)

**File**: `vercel.json`

**Content**: Only contains `buildCommand` and `framework` settings. No headers, rewrites, or redirects configured. This is fine since headers are handled by middleware. Noted for completeness.

---

### Finding 10: No `eval()` usage found (PASS)

**Severity**: N/A (informational)

**Result**: No direct `eval()` calls found in application source code.

---

## Summary Table

| # | Finding | Severity | Location | Issue | Fix Available |
|---|---------|----------|----------|-------|---------------|
| 1 | No CSP header | **CRITICAL** | middleware.ts | No XSS protection | Yes |
| 2 | No HSTS header | **HIGH** | middleware.ts | No HTTPS enforcement | Yes |
| 3 | No Permissions-Policy | **HIGH** | middleware.ts | Browser features unrestricted | Yes |
| 4 | npm HIGH vulnerability | **HIGH** | next (package) | DoS vulnerabilities | Yes |
| 5 | Incomplete security headers | **MEDIUM** | middleware.ts | Only 3 of 7 headers set | Yes |
| 6 | next.config.ts no headers | **MEDIUM** | next.config.ts | Static assets unprotected | Yes |
| 7 | dangerouslySetInnerHTML | **MEDIUM** | 2 components | XSS vector without CSP | Yes |
| 8 | No CORS issues | PASS | API routes | Same-origin default | N/A |
| 9 | vercel.json minimal | INFO | vercel.json | No security config | N/A |
| 10 | No eval() usage | PASS | all source | Clean | N/A |
