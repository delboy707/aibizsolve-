# QEP AISolve — Revised Implementation Prompt

> **Purpose**: This is a Claude Code implementation guide. Read this ENTIRE file before making any changes. This document describes MODIFICATIONS to an existing Next.js + Supabase application deployed on Vercel. Do NOT rebuild from scratch — modify the existing codebase.

---

## CONTEXT: What Already Exists

QEP AISolve is a live Next.js 14 application with:
- **Supabase backend** with pgvector, 583 workflows with domain tags (strategy, marketing, sales, innovation, operations, hr, finance)
- **Claude API** for problem classification (4-layer taxonomy) and SCQA document generation
- **OpenAI embeddings** for vector similarity search matching problems to workflows
- **Supabase Auth** for user authentication
- **Alchemy Layer** (parallel AI call generating counterintuitive behavioural options)
- **Vercel deployment** at qep-aisolve.vercel.app
- **Modern SaaS design** with Tailwind CSS (Deep Blue #3B5BDB primary, Teal #14B8A6 accent, Plus Jakarta Sans font)

### Current Database Tables
- `users` — extends Supabase Auth with subscription and usage fields
- `decisions` — user problem sessions with classification data
- `messages` — chat messages per decision
- `documents` — generated SCQA documents
- `workflows` — 583 AI workflows with embeddings, domain tags, prompts

### Current File Structure (Key Paths)
```
/app/page.tsx                    — Landing page
/app/auth/page.tsx               — Auth page
/app/chat/page.tsx               — Chat interface
/app/document/[id]/page.tsx      — Document view
/app/dashboard/page.tsx          — Dashboard
/app/api/chat/route.ts           — Streaming chat endpoint
/app/api/document/route.ts       — Document generation
/app/api/workflows/search/route.ts — Vector search
/lib/ai/anthropic.ts             — Claude client
/lib/ai/alchemy.ts               — Alchemy generation
/lib/ai/classify.ts              — Domain classification
/lib/ai/synthesize.ts            — Document synthesis
/lib/supabase/client.ts          — Browser client
/lib/supabase/server.ts          — Server client
/lib/stripe/client.ts            — Stripe client (exists but not integrated)
/components/chat/                — Chat UI components
/components/document/            — Document view components
/components/dashboard/           — Dashboard components
/components/layout/              — Header, Footer, Navigation
```

---

## WHAT'S CHANGING: The Revised Strategy

We are making six interconnected changes:

1. **THREE-TIER PRICING** replacing the previous model
2. **STRIPE INTEGRATION** for subscription payments
3. **FREE REPORT TRIAL** replacing the 30-day free trial
4. **BEHAVIOURAL ALCHEMY AS HEADLINE DIFFERENTIATOR** — moved from hidden feature to spotlight
5. **GUIDED ONBOARDING** — force activation with first strategic question
6. **NEW LANDING PAGE & MESSAGING** — complete copy and positioning overhaul

---

## 1. DATABASE CHANGES

### 1.1 Migration: Update Users Table

Create a new migration file. Do NOT drop existing columns — add new ones and update existing ones.

```sql
-- Migration: 005_tiered_pricing.sql

-- Add new subscription tier column (replaces old payment_tier)
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier TEXT 
  DEFAULT 'free' 
  CHECK (subscription_tier IN ('free', 'starter', 'professional', 'founding_leader'));

-- Report counting per billing cycle
ALTER TABLE users ADD COLUMN IF NOT EXISTS reports_used_this_cycle INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_cycle_start TIMESTAMPTZ DEFAULT NOW();

-- Activation tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_report_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;

-- Free report tracking (for non-subscribers)
ALTER TABLE users ADD COLUMN IF NOT EXISTS free_report_used BOOLEAN DEFAULT FALSE;

-- Stripe subscription fields (may already exist, add IF NOT EXISTS)
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Founding Leader tracking
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert founding leader counter
INSERT INTO app_config (key, value) 
VALUES ('founding_leader', '{"count": 0, "cap": 100}')
ON CONFLICT (key) DO NOTHING;

-- Function to check and increment founding leader count
CREATE OR REPLACE FUNCTION claim_founding_leader_slot()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count INTEGER;
  cap INTEGER;
BEGIN
  SELECT (value->>'count')::INTEGER, (value->>'cap')::INTEGER
  INTO current_count, cap
  FROM app_config WHERE key = 'founding_leader'
  FOR UPDATE;
  
  IF current_count >= cap THEN
    RETURN FALSE;
  END IF;
  
  UPDATE app_config 
  SET value = jsonb_set(value, '{count}', to_jsonb(current_count + 1)),
      updated_at = NOW()
  WHERE key = 'founding_leader';
  
  RETURN TRUE;
END;
$$;

-- Function to reset report count on billing cycle
CREATE OR REPLACE FUNCTION reset_report_count_if_needed(user_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users 
  SET reports_used_this_cycle = 0,
      billing_cycle_start = NOW()
  WHERE id = user_uuid 
    AND billing_cycle_start < NOW() - INTERVAL '30 days';
END;
$$;

-- RLS policies for app_config (read-only for authenticated users)
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read app_config" ON app_config
  FOR SELECT USING (TRUE);
```

### 1.2 Update Documents Table

Add a field to track whether Alchemy content was included:

```sql
ALTER TABLE documents ADD COLUMN IF NOT EXISTS includes_alchemy BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS alchemy_content TEXT;
```

---

## 2. TIER DEFINITIONS & ACCESS CONTROL

### 2.1 Tier Configuration

Create `/lib/tiers.ts`:

```typescript
export const TIERS = {
  free: {
    name: 'Free',
    price: 0,
    reports_per_month: 1, // One free report ever (not per month)
    allowed_domains: ['strategy', 'marketing', 'sales', 'innovation', 'operations', 'hr', 'finance'],
    alchemy_access: 'teased', // Show headings, blur/lock content
    payment_link: null,
    description: 'One free strategic report',
  },
  starter: {
    name: 'Starter',
    price: 29,
    payment_link: process.env.NEXT_PUBLIC_STRIPE_LINK_STARTER!,
    reports_per_month: 3,
    allowed_domains: ['strategy'], // Strategy module only
    alchemy_access: 'none',
    description: '3 reports/month • Strategy module',
  },
  professional: {
    name: 'Professional',
    price: 79,
    payment_link: process.env.NEXT_PUBLIC_STRIPE_LINK_PROFESSIONAL!,
    reports_per_month: Infinity, // Unlimited
    allowed_domains: ['strategy', 'marketing', 'sales'],
    alchemy_access: 'full',
    description: 'Unlimited reports • Strategy + Marketing + Sales • Behavioural Alchemy',
  },
  founding_leader: {
    name: 'Founding Leader',
    price: 149,
    payment_link: process.env.NEXT_PUBLIC_STRIPE_LINK_FOUNDING_LEADER!,
    reports_per_month: Infinity,
    allowed_domains: ['strategy', 'marketing', 'sales', 'innovation', 'operations', 'hr', 'finance'],
    alchemy_access: 'full',
    description: 'Everything + future modules free forever • Limited to 100 founders',
  },
} as const;

export type TierKey = keyof typeof TIERS;

export function canGenerateReport(tier: TierKey, reportsUsed: number, freeReportUsed: boolean): boolean {
  if (tier === 'free') return !freeReportUsed;
  const config = TIERS[tier];
  return reportsUsed < config.reports_per_month;
}

export function canAccessDomain(tier: TierKey, domain: string): boolean {
  return TIERS[tier].allowed_domains.includes(domain);
}

export function getAlchemyAccess(tier: TierKey): 'none' | 'teased' | 'full' {
  return TIERS[tier].alchemy_access;
}
```

### 2.2 Middleware: Tier Enforcement

Create `/lib/tier-guard.ts`:

```typescript
import { createClient } from '@/lib/supabase/server';
import { TIERS, canGenerateReport, canAccessDomain, getAlchemyAccess } from '@/lib/tiers';
import type { TierKey } from '@/lib/tiers';

export async function getTierContext() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('users')
    .select('subscription_tier, reports_used_this_cycle, billing_cycle_start, free_report_used')
    .eq('id', user.id)
    .single();
  
  if (!profile) return null;
  
  // Reset report count if billing cycle has elapsed
  await supabase.rpc('reset_report_count_if_needed', { user_uuid: user.id });
  
  const tier = (profile.subscription_tier || 'free') as TierKey;
  
  return {
    userId: user.id,
    tier,
    tierConfig: TIERS[tier],
    reportsUsed: profile.reports_used_this_cycle || 0,
    freeReportUsed: profile.free_report_used || false,
    canGenerate: canGenerateReport(tier, profile.reports_used_this_cycle || 0, profile.free_report_used || false),
    alchemyAccess: getAlchemyAccess(tier),
    canAccessDomain: (domain: string) => canAccessDomain(tier, domain),
  };
}
```

---

## 3. STRIPE INTEGRATION

### 3.1 Environment Variables

Add to `.env.local` (via Claude Code) and Vercel environment variables (via Vercel Dashboard → Settings → Environment Variables):

To add these via Claude Code, run:
```bash
echo 'STRIPE_SECRET_KEY=sk_live_...' >> .env.local
echo 'STRIPE_WEBHOOK_SECRET=whsec_...' >> .env.local
echo 'NEXT_PUBLIC_STRIPE_LINK_STARTER=https://buy.stripe.com/5kQbJ2a7S4QvadaccTenS03' >> .env.local
echo 'NEXT_PUBLIC_STRIPE_LINK_PROFESSIONAL=https://buy.stripe.com/8x25kEdk44QvgBy7WDenS04' >> .env.local
echo 'NEXT_PUBLIC_STRIPE_LINK_FOUNDING_LEADER=https://buy.stripe.com/dRm14ocg06YD1GEa4LenS05' >> .env.local
```

Then add the same variables in Vercel Dashboard → Settings → Environment Variables.

**NOTE**: We are using Stripe Payment Links (hosted checkout URLs), NOT the Stripe Checkout API. This simplifies the integration — pricing page buttons redirect directly to these URLs with a `client_reference_id` appended to identify the user. The webhook handler still processes subscription events to update the database.

### 3.2 Payment Link Redirect (Client-Side)

We do NOT need a server-side checkout route. Instead, the pricing page buttons redirect directly to Stripe Payment Links with the user's ID appended as `client_reference_id`. This lets the webhook identify which user paid.

Create a utility function in `/lib/stripe/redirect.ts`:

```typescript
import { TIERS, TierKey } from '@/lib/tiers';

export function getCheckoutUrl(tier: TierKey, userId: string): string | null {
  const config = TIERS[tier];
  if (!config.payment_link) return null;
  
  // Append client_reference_id so the webhook knows which user paid
  const url = new URL(config.payment_link);
  url.searchParams.set('client_reference_id', userId);
  return url.toString();
}
```

Usage on the pricing page:
```typescript
// In the pricing page component
const handleUpgrade = (tier: TierKey) => {
  const url = getCheckoutUrl(tier, userId);
  if (url) window.location.href = url;
};
```

### 3.3 Stripe Webhook Handler

Create or update `/app/api/webhooks/stripe/route.ts`:

**IMPORTANT**: With Payment Links, the `client_reference_id` field on the checkout session contains the Supabase user ID. We also need to determine the tier from the subscription price. Create a reverse lookup from Stripe price amounts to tier names.

```typescript
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Use service role client for webhook (no user auth context)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Map subscription price (in cents) to tier
// This is the fallback method — we also check client_reference_id
const PRICE_TO_TIER: Record<number, string> = {
  2900: 'starter',        // $29
  7900: 'professional',   // $79
  14900: 'founding_leader', // $149
};

function getTierFromAmount(amountInCents: number): string {
  return PRICE_TO_TIER[amountInCents] || 'starter';
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }
  
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // client_reference_id contains the Supabase user ID (set by our redirect URL)
      const userId = session.client_reference_id;
      if (!userId) {
        console.error('No client_reference_id on checkout session');
        break;
      }
      
      // Retrieve the subscription to get the price/amount
      const subscriptionId = session.subscription as string;
      let tier = 'starter';
      
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const amount = subscription.items.data[0]?.price?.unit_amount || 0;
        tier = getTierFromAmount(amount);
      }
      
      // For founding_leader, claim a slot (atomic operation)
      if (tier === 'founding_leader') {
        const { data: slotClaimed } = await supabase.rpc('claim_founding_leader_slot');
        if (!slotClaimed) {
          // Slot not available — downgrade to professional and refund difference
          // (Edge case: handle manually or auto-downgrade)
          tier = 'professional';
          console.warn('Founding Leader slot unavailable, downgraded to professional');
        }
      }
      
      await supabase.from('users').update({
        subscription_tier: tier,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscriptionId,
        reports_used_this_cycle: 0,
        billing_cycle_start: new Date().toISOString(),
      }).eq('id', userId);
      
      break;
    }
    
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      // Find user by stripe_customer_id
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();
      
      if (user) {
        const status = subscription.status;
        if (status === 'active') {
          // Subscription renewed — reset report count
          const amount = subscription.items.data[0]?.price?.unit_amount || 0;
          const tier = getTierFromAmount(amount);
          
          await supabase.from('users').update({
            subscription_tier: tier,
            reports_used_this_cycle: 0,
            billing_cycle_start: new Date().toISOString(),
          }).eq('id', user.id);
        }
      }
      break;
    }
    
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();
      
      if (user) {
        await supabase.from('users').update({
          subscription_tier: 'free',
          stripe_subscription_id: null,
        }).eq('id', user.id);
      }
      break;
    }
  }
  
  return NextResponse.json({ received: true });
}
```

### 3.4 Stripe Customer Portal (Manage Subscription)

Create `/app/api/stripe/portal/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { data: profile } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
  }
  
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });
  
  return NextResponse.json({ url: session.url });
}
```

---

## 4. PRICING PAGE

Create `/app/pricing/page.tsx`:

This is a critical conversion page. Build it with these specifications:

### Layout
- Clean three-column card layout (stacks on mobile)
- Professional tier visually highlighted as "Most Popular" with a badge and border accent
- Founding Leader tier shows remaining slots counter ("X of 100 remaining")

### Content Per Tier Card

**Free (no card — inline CTA at top of page)**:
> "Try it free. One strategic report on your real business challenge. No credit card required."
> [Button: "Get Your Free Report"]

**Starter — $29/month**:
- 3 strategic reports per month
- Strategy module
- SCQA structured documents
- 90-day implementation roadmaps
- [Button: "Start with Starter"]

**Professional — $79/month** ⭐ MOST POPULAR:
- Unlimited strategic reports
- Strategy + Marketing + Sales modules
- **Behavioural Alchemy** — counterintuitive strategic options in every report
- SCQA structured documents
- 90-day implementation roadmaps
- [Button: "Go Professional"]

**Founding Leader — $149/month** (Limited to 100):
- Everything in Professional
- Innovation, Operations, HR, Finance modules included free when launched
- Founding Leader pricing locked for life
- "X of 100 slots remaining" — real-time counter from `app_config` table
- [Button: "Claim Your Founding Spot"]

### Messaging Below Pricing Cards

**Headline**: "Strategic clarity in minutes, not months."

**Subhead**: "QEP AISolve gives you consultancy-grade analysis on Strategy, Marketing, and Sales — plus the unconventional options consultants rarely suggest."

**Three proof points (horizontal row of icons + text)**:
1. 🏗️ **Structured, not scattered** — "Built on proven strategic frameworks, not generic AI guesswork"
2. ⚡ **Fast, not slow** — "Get structured strategic options in the time it takes to drink your coffee"
3. 🎯 **Strategy + Surprise** — "Every report shows conventional wisdom AND the behavioural curveball your competitors won't see"

**Objection handling section** (accordion or FAQ-style):
- "How is this different from ChatGPT?" → "You'll get a wall of text with no structure and no strategic lens. Try both — you'll feel the difference."
- "How is this different from a consultant?" → "A consultant gives you one answer after weeks. We give you structured options in minutes — including the unconventional ones they'd never propose."
- "Is it worth $79/month?" → "One good strategic insight pays for years of subscription. The question isn't cost — it's whether you'll use it."

### Checkout Flow
Each tier button calls the `getCheckoutUrl()` utility from `/lib/stripe/redirect.ts`, which appends the user's Supabase ID as `client_reference_id` to the Stripe Payment Link URL. The browser redirects directly to Stripe's hosted checkout. On successful payment, Stripe sends a webhook to `/api/webhooks/stripe` which updates the user's tier in the database. Configure each Payment Link in the Stripe Dashboard to redirect to `https://qep-aisolve.vercel.app/dashboard?upgraded=true` on success.

---

## 5. LANDING PAGE OVERHAUL

Rewrite `/app/page.tsx` with the new positioning. This is the most important page for conversion.

### Hero Section

**Headline**: "The Strategic Thinking Partner for Leaders Who Don't Have Time to Think"

**Subhead**: "Get structured strategic options in minutes — including the unconventional moves your competitors won't consider."

**CTA Button (primary, large)**: "Get Your Free Strategic Report" → links to `/auth` (sign up) then redirects to onboarding

**Secondary CTA (text link)**: "See pricing →" → links to `/pricing`

### Social Proof Section (if available)
Placeholder for testimonials. For launch, use the narrative:
> "Built by a consultant with 30+ years of experience across 80+ countries. 583 strategic frameworks from the world's best business thinking."

### How It Works — Three Steps
1. **Describe your challenge** — "Tell us the strategic question keeping you up at night"
2. **Get structured analysis** — "Receive a consultancy-grade SCQA document with 3 strategic options and a 90-day roadmap"
3. **See the curveball** — "Behavioural Alchemy reveals the counterintuitive move your competitors won't consider"

### The "Dual Lens" Feature Section

**Headline**: "Strategy + Surprise"

**Subhead**: "Every report shows you what the business textbooks recommend — and then what a behavioural strategist might suggest instead. Because the obvious move isn't always the right move."

**Visual**: Split-screen or two-column showing:
- Left: "📊 The Playbook" — Conventional strategic analysis
- Right: "🎯 The Curveball" — Behavioural Alchemy insight

### Domains Section
Show the available domains with icons:
- Strategy ✅ (all tiers)
- Marketing ✅ (Professional+)
- Sales ✅ (Professional+)
- Innovation 🔜 (Founding Leader — coming soon)
- Operations 🔜 (Founding Leader — coming soon)
- HR 🔜 (Founding Leader — coming soon)
- Finance 🔜 (Founding Leader — coming soon)

### Bottom CTA
Repeat the primary CTA:
> "What's the single biggest strategic question keeping you up at night?"
> [Large input field or button: "Get Your Free Report →"]

---

## 6. GUIDED ONBOARDING FLOW

### 6.1 Post-Authentication Redirect

After a new user signs up (or an existing free user who hasn't used their free report), redirect to `/onboarding`.

Create `/app/onboarding/page.tsx`:

### Onboarding Flow (Single Page, Multi-Step)

**Step 1 — The Question** (full-screen, centered, minimal UI):
> "What's the single biggest strategic question keeping you up at night?"
> [Large text input area]
> [Button: "Generate My Strategic Report"]

**Step 2 — Processing** (animated, reassuring):
> Show a progress indicator with stages:
> - "Analysing your challenge..." 
> - "Matching strategic frameworks..."
> - "Generating conventional analysis..."
> - "Applying Behavioural Alchemy lens..."
> (Each stage appears progressively over ~15-30 seconds as the AI works)

**Step 3 — Report Delivered**:
> Redirect to `/document/[id]` showing the full SCQA report.
> For FREE users: The conventional analysis sections are fully visible. The Behavioural Alchemy section shows:
> - The section heading "🎯 Behavioural Alchemy — The Curveball"
> - 2-3 insight headings are visible (e.g., "Reframe the Loss as a Gain", "Use Strategic Friction")
> - The actual content is blurred/locked with an overlay:
>   > "Unlock Behavioural Alchemy insights with Professional or Founding Leader"
>   > [Button: "Upgrade to see the unconventional moves →"]

**Step 4 — Conversion Prompt** (below the report):
> "This is what QEP AISolve does. Want to explore further?"
> - [Primary CTA: "Upgrade to Professional — $79/month"]
> - [Secondary: "Start with Starter — $29/month"]
> - [Tertiary link: "See all plans"]

### 6.2 Track Activation

When the first report is generated, update the user record:

```typescript
await supabase.from('users').update({
  first_report_at: new Date().toISOString(),
  activated_at: new Date().toISOString(),
  free_report_used: true,
}).eq('id', userId);
```

---

## 7. REPORT GENERATION CHANGES

### 7.1 Tier-Aware Report Generation

Modify the document generation API (`/app/api/document/route.ts`) to:

1. **Check report limits** before generating:
   - Free: Has `free_report_used` already? → Block with upgrade prompt
   - Starter: `reports_used_this_cycle >= 3`? → Block with upgrade prompt
   - Professional/Founding Leader: No limit

2. **Check domain access**:
   - If the classified domain is not in the user's `allowed_domains`, show a message:
     > "This question falls within [Domain]. Upgrade to [tier] to access [Domain] analysis."

3. **Alchemy content handling**:
   - `tier === 'free'`: Generate Alchemy content BUT store it in `alchemy_content` column separately. Pass `alchemy_teased: true` flag to the document view component.
   - `tier === 'starter'`: Do NOT generate Alchemy content. Show an upgrade teaser instead.
   - `tier === 'professional'` or `tier === 'founding_leader'`: Generate and include Alchemy content fully.

4. **Increment report counter** after successful generation:
   ```typescript
   await supabase.from('users').update({
     reports_used_this_cycle: profile.reports_used_this_cycle + 1,
   }).eq('id', userId);
   ```

### 7.2 Document View — Alchemy Teaser

Modify the document view component (`/components/document/DocumentView.tsx`) to handle three alchemy states:

```typescript
interface DocumentViewProps {
  document: Document;
  alchemyAccess: 'none' | 'teased' | 'full';
  alchemyContent?: string; // Only populated when teased
}
```

**When `alchemyAccess === 'teased'`**:
- Render the Alchemy section header with amber/gold styling
- Show 2-3 insight headings extracted from `alchemyContent`
- Apply a CSS blur filter (e.g., `blur(8px)`) over the body text
- Overlay a semi-transparent card with upgrade CTA:
  ```
  ┌─────────────────────────────────────────┐
  │  🔒 Behavioural Alchemy                 │
  │                                         │
  │  Reframe the Loss as a Gain             │
  │  ████████████████████████████████████    │
  │  ████████████████████████████████████    │
  │                                         │
  │  Use Strategic Friction                 │
  │  ████████████████████████████████████    │
  │  ████████████████████████████████████    │
  │                                         │
  │  ┌─────────────────────────────────┐    │
  │  │ Unlock with Professional ($79)  │    │
  │  └─────────────────────────────────┘    │
  └─────────────────────────────────────────┘
  ```

**When `alchemyAccess === 'none'`** (Starter tier):
- Show a compact teaser banner at the bottom of the report:
  > "Want to see what a behavioural strategist would suggest? Upgrade to Professional for Behavioural Alchemy insights."

**When `alchemyAccess === 'full'`**:
- Render Alchemy section normally with full content, amber/gold accent styling

---

## 8. DASHBOARD CHANGES

Update `/app/dashboard/page.tsx` to show:

### Usage Bar (top of dashboard)
- Current tier name and badge
- Reports used this cycle: "2 of 3 reports used" (Starter) or "Unlimited" (Pro/Founding)
- [Upgrade CTA if not on highest tier]
- [Manage Subscription link → Stripe Customer Portal]

### Report History
- List of generated documents with dates
- Each entry shows whether Alchemy was included (icon/badge)

### Upgrade Banner (for free/starter users)
Contextual messaging based on tier:
- Free (used their report): "You've used your free report. Upgrade to keep solving strategic challenges."
- Starter (running low): "1 report remaining this month. Upgrade to Professional for unlimited reports + Behavioural Alchemy."

---

## 9. NAVIGATION UPDATES

Update the header/navigation component to include:
- **Logo + brand name**: "QEP AISolve"
- **Nav links**: Dashboard, New Report, Pricing (for free/upsell)
- **User menu** (dropdown): Account, Manage Subscription, Sign Out
- **Tier badge**: Small badge next to user name showing current tier (e.g., "PRO", "FOUNDER")

---

## 10. NEW PAGES NEEDED

| Route | Purpose |
|-------|---------|
| `/pricing` | Three-tier pricing page with Stripe checkout |
| `/onboarding` | Guided first-question experience |
| `/upgrade` | Upgrade prompt page (redirect target when hitting limits) |

---

## 11. ENVIRONMENT VARIABLES

Ensure ALL of these are set in both `.env.local` (in the repo, via Claude Code) and Vercel (via Dashboard → Settings → Environment Variables):

```
# Existing
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# New — Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_LINK_STARTER=https://buy.stripe.com/5kQbJ2a7S4QvadaccTenS03
NEXT_PUBLIC_STRIPE_LINK_PROFESSIONAL=https://buy.stripe.com/8x25kEdk44QvgBy7WDenS04
NEXT_PUBLIC_STRIPE_LINK_FOUNDING_LEADER=https://buy.stripe.com/dRm14ocg06YD1GEa4LenS05

# App
NEXT_PUBLIC_APP_URL=https://qep-aisolve.vercel.app
```

---

## 12. NPM PACKAGES TO INSTALL

```bash
npm install stripe
```

(Stripe is the only new dependency. Everything else should already be installed.)

---

## 13. IMPLEMENTATION ORDER

Do these in sequence. Complete each step fully before moving to the next.

### Phase 1: Database & Tier Logic
1. Run the SQL migration (Section 1)
2. Create `/lib/tiers.ts` (Section 2.1)
3. Create `/lib/tier-guard.ts` (Section 2.2)
4. Test: Verify tier functions work correctly

### Phase 2: Stripe Integration
5. Install `stripe` package
6. Create `/lib/stripe/redirect.ts` — Payment Link URL builder with client_reference_id (Section 3.2)
7. Create `/app/api/webhooks/stripe/route.ts` — webhook handler (Section 3.3)
8. Create `/app/api/stripe/portal/route.ts` — customer portal for managing subscriptions (Section 3.4)
9. Test: Verify Payment Link redirect appends user ID correctly

### Phase 3: Pricing Page
10. Create `/app/pricing/page.tsx` (Section 4)
11. Include Founding Leader counter (reads from `app_config`)
12. Wire up checkout buttons to Stripe
13. Test: Full checkout flow for each tier

### Phase 4: Landing Page
14. Rewrite `/app/page.tsx` (Section 5)
15. New hero, how-it-works, dual-lens section, domain grid, bottom CTA
16. Test: Visual review, CTA links work

### Phase 5: Onboarding Flow
17. Create `/app/onboarding/page.tsx` (Section 6)
18. Wire up post-auth redirect for new users
19. Connect to existing chat/document generation APIs
20. Test: Full flow from signup → question → report

### Phase 6: Report Generation Updates
21. Modify `/app/api/document/route.ts` for tier-aware limits (Section 7.1)
22. Modify document view for Alchemy teaser/blur (Section 7.2)
23. Add report counting and free report tracking
24. Test: Generate reports as each tier, verify limits and Alchemy display

### Phase 7: Dashboard & Navigation
25. Update dashboard with usage bar, tier badge, upgrade CTAs (Section 8)
26. Update navigation with tier badge, pricing link (Section 9)
27. Create `/app/upgrade/page.tsx` redirect page
28. Test: Full user journey for each tier

### Phase 8: Polish & Deploy
29. Test all Stripe webhook events (subscription created, updated, deleted)
30. Test Founding Leader cap enforcement
31. Test report limit reset on billing cycle
32. Review all upgrade CTAs and conversion copy
33. Deploy to Vercel with new env vars

---

## 14. COPY & MESSAGING REFERENCE

### Brand Voice
- Confident but not arrogant
- Strategic, not techy
- Avoid "AI-powered" language (invites commodity comparison)
- Lead with outcomes, not features
- Use "Behavioural Alchemy" as the premium feature name
- Use "The Curveball" informally in marketing copy

### Key Phrases to Use
- "Strategic Intelligence Platform"
- "Consultancy-depth thinking at SaaS speed"
- "Strategy + Surprise"
- "The Playbook and The Curveball"
- "Structured strategic options in minutes"
- "The unconventional moves your competitors won't consider"

### Key Phrases to AVOID
- "AI-powered" (commodity signal)
- "AI tool" (triggers ChatGPT comparison)
- "Budget consulting" (signals inferior)
- "Automated" (removes trust)

---

## 15. CRITICAL REMINDERS

- **Do NOT rebuild the app from scratch.** Modify the existing codebase.
- **Do NOT touch the workflows table or embeddings.** The 583 workflows are already loaded and working.
- **Do NOT change the core AI pipeline** (classification → vector search → SCQA synthesis). Only add tier-awareness around it.
- **The Alchemy Layer generation logic already exists** in `/lib/ai/alchemy.ts`. Modify how its output is DISPLAYED, not how it's generated.
- **Stripe Payment Links are already configured.** The three URLs are in the env vars. Do NOT create a server-side checkout session API — use the Payment Link redirect approach in `/lib/stripe/redirect.ts`.
- **Derek must configure the Stripe webhook** in the Stripe Dashboard pointing to `https://qep-aisolve.vercel.app/api/webhooks/stripe` and copy the webhook secret to `STRIPE_WEBHOOK_SECRET` env var.
- **Derek must configure Payment Link success URLs** in Stripe Dashboard to redirect to `https://qep-aisolve.vercel.app/dashboard?upgraded=true`.
- **Test with Stripe test mode** during development. Switch to live mode at deploy time.
- **The Founding Leader slot counter is critical** — it must use a database-level atomic operation (the `claim_founding_leader_slot` function) to prevent race conditions.
