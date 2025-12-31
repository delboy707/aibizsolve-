# QEP AISolve — Quick Start Reference v3

> Use this alongside CLAUDE.md for rapid implementation

---

## Stack Summary

```
Frontend:  Next.js 14 + Tailwind
Database:  Supabase + pgvector
AI:        Claude (Haiku/Sonnet) + OpenAI Embeddings
Payments:  Stripe (PWYW model)
Deploy:    Vercel
```

---

## What's New in v3

| Feature | Description |
|---------|-------------|
| **Alchemy Layer** | Parallel AI call for counterintuitive options |
| **Four Lenses** | Opposite, Perception, Signal, Small Bet |
| **8-Section Doc** | SCQA (7) + Alchemy Section |
| **PWYW Pricing** | $10 min, segment anchors, beat-the-average |
| **New Copy** | "Move fast without getting exposed" |

---

## Copy Package

```
Headline:  Move fast without getting exposed.
Subhead:   From messy business question to board-ready strategic 
           plan — with the rationale, risks, and unconventional 
           options already mapped out. In 20 minutes.
One-liner: Like having a top business consultant on speed dial — 
           without the invoice.
Offer:     28 days free. Then pay what it's worth — $10 minimum, 
           most pay $50-150/month.
```

---

## AI Pipeline Flow (2 Parallel Calls)

```
User Problem
     │
     ▼
Classification (Haiku)
     │
     ├──────────────────────────┐
     │                          │
     ▼                          ▼
CALL 1: SCQA             CALL 2: Alchemy
(Sonnet)                 (Sonnet) - PARALLEL
     │                          │
     └──────────┬───────────────┘
                │
                ▼
        8-Section Document
```

---

## The Four Alchemy Lenses

| Lens | Question |
|------|----------|
| **Opposite** | "What if we did the exact reverse?" |
| **Perception** | "How change how this FEELS not what it IS?" |
| **Signal** | "What makes this feel more valuable?" |
| **Small Bet** | "What <$10K intervention has outsized impact?" |

---

## Document Output (8 Sections)

```
1. Executive Summary (SCQA)
2. Situation Analysis
3. Problem Diagnosis
4. Strategic Options (3)
5. Recommendation
6. Implementation Roadmap (30-60-90)
7. Risk Mitigation
8. ALCHEMY SECTION (Premium) ← NEW
   ├── Counterintuitive Options
   ├── The Perception Play
   ├── Small Bet, Big Signal
   └── The Hidden Driver
```

---

## PWYW Pricing Model

| Phase | Duration | Access |
|-------|----------|--------|
| Trial | 28 days | Full (SCQA + Alchemy) |
| PWYW | Ongoing | $10 minimum |

**Segment Anchors:**
- Solopreneurs: $15-45/month
- Small business: $50-150/month
- Managers: $100-250/month
- CEOs: $200-500/month

**Alchemy Access:**
- Trial: ✅ Full access
- Below average payment: ❌ Teaser only
- Average+ payment: ✅ Full access

---

## Core Tables

```sql
users       -- id, email, monthly_payment, payment_tier, trial_ends_at
decisions   -- id, user_id, classified_*, alchemy_generated, status
messages    -- id, decision_id, role, content
documents   -- id, decision_id, scqa_*, alchemy_content
workflows   -- id, domain, task_summary, full_prompt, embedding
payment_stats -- segment, average_payment, payment_count
```

---

## Key New Files

```
lib/ai/alchemy.ts              -- Alchemy generation
app/api/alchemy/route.ts       -- Alchemy API endpoint
components/document/AlchemySection.tsx
components/pricing/PWYWSlider.tsx
components/pricing/SegmentAnchors.tsx
components/pricing/BeatTheAverage.tsx
```

---

## Sprint Order

| Sprint | Focus | Key Addition |
|--------|-------|--------------|
| 1 | Foundation | PWYW schema |
| 2 | Chat | Behavioral questions |
| 3 | Workflows | Standard |
| 4 | AI Pipeline | **+ Alchemy Layer** |
| 5 | Documents | **+ AlchemySection** |
| 6 | Payments | **PWYW + gating** |

---

## Dual-Track Intake Questions

| Rational | Behavioral |
|----------|------------|
| "What challenge?" | "What do customers *say* vs *do*?" |
| "What have you tried?" | "What's the *opposite*?" |
| "What outcome?" | "What *feeling* to create?" |

---

## Payment Tier Logic

```typescript
function hasAlchemyAccess(user): boolean {
  if (user.payment_tier === 'trial' && 
      new Date() < user.trial_ends_at) {
    return true;
  }
  return ['average', 'above_average']
    .includes(user.payment_tier);
}
```

---

## Model Selection

| Task | Model |
|------|-------|
| Classification | Haiku |
| Clarifying Qs | Haiku |
| SCQA Synthesis | Sonnet |
| **Alchemy Layer** | **Sonnet** |

---

## Cost Per Query

| Component | Cost |
|-----------|------|
| Classification | ~$0.01 |
| SCQA (Call 1) | ~$0.18 |
| Alchemy (Call 2) | ~$0.08 |
| **Total** | **~$0.27** |

Still profitable at $10/month minimum.

---

## Critical Rules

1. **NEVER expose framework names**
2. **Alchemy runs PARALLEL** to SCQA
3. **Gate Alchemy by payment tier**
4. **Show segment anchors** at payment
5. **Track average payment** for anchoring

---

## Testing Checklist (New Items)

- [ ] Trial users see full Alchemy
- [ ] Below-average see teaser
- [ ] Average+ see full Alchemy
- [ ] Four lenses all populate
- [ ] PWYW slider works ($10 min)
- [ ] Beat-the-average prompt shows
- [ ] Payment tier updates correctly

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```
