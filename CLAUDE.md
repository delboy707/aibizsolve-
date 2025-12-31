# QEP AISolve — Implementation Guide v3

> **Purpose**: This document provides Claude Code with complete context to build QEP AISolve from scratch. Read this entire file before starting any implementation work.

---

## Project Overview

**QEP AISolve** is an AI-powered strategic consulting platform that helps solopreneurs and mid-market companies solve business problems across Strategy, Marketing, Sales, Innovation, Operations, HR, and Finance domains.

**Core Value Proposition**: "Move fast without getting exposed."

**One-liner**: "Like having a top business consultant on speed dial — without the invoice."

**How It Works**:
1. User describes a business problem (we call this a "Decision")
2. AI classifies using 4-layer taxonomy (Symptom → Challenge → Domain → Intent)
3. AI matches to relevant strategic frameworks (invisibly)
4. AI asks 2-4 clarifying questions (rational + behavioral)
5. **CALL 1**: AI generates McKinsey-style SCQA strategic document with 90-day roadmap
6. **CALL 2**: AI generates Alchemy Layer (counterintuitive options) — runs in parallel

**Critical Principles**:
- Users NEVER see framework names, book titles, or methodology sources ("invisible workflow architecture")
- The Alchemy Layer differentiates us — counterintuitive options competitors won't consider
- PWYW pricing demonstrates our philosophy: "We're so confident in unconventional thinking, we practice it ourselves"

---

## Technical Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 14+ (App Router) | React framework with Server Components |
| Styling | Tailwind CSS | Utility-first CSS with custom design tokens |
| Database | Supabase (PostgreSQL) | Auth, database, row-level security |
| Vector Search | pgvector | Semantic search for workflow matching |
| AI Engine | Claude API (Anthropic) | Haiku for classification, Sonnet for synthesis |
| Embeddings | OpenAI text-embedding-3-small | 1536-dim vectors for workflow matching |
| Payments | Stripe | PWYW with minimum + segment anchors |
| Deployment | Vercel | Hosting with automatic deployments |

---

## The Alchemy Layer Architecture

### Why It Exists

CEOs and senior managers have heard all the standard consulting advice. The rational answer is table stakes. The counterintuitive option is what makes them forward the document to their board.

Rory Sutherland's insight: "The opposite of a good idea can also be a good idea." Most business problems are solved with the wrong tools because we default to rational frameworks when human behavior is driven by psychology, perception, and emotion.

### Architecture: Option C (Separate Parallel Call)

```
User Problem
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  CLASSIFICATION (Haiku)                                      │
│  4-layer taxonomy + cross-domain synergy detection           │
└─────────────────────────────┬───────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│  CALL 1: Core Workflow  │     │  CALL 2: Alchemy Layer  │
│  (Sonnet)               │     │  (Sonnet) - PARALLEL    │
│                         │     │                         │
│  Input: Problem +       │     │  Input: Problem +       │
│         Workflows       │     │         Classification  │
│                         │     │                         │
│  Output: SCQA Document  │     │  Output: Alchemy Section│
│  (7 sections)           │     │  (4 lenses)             │
└───────────┬─────────────┘     └───────────┬─────────────┘
            │                               │
            └───────────────┬───────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │  MERGED FINAL DOCUMENT      │
              │  SCQA + Alchemy Section     │
              │  (8 sections total)         │
              └─────────────────────────────┘
```

### Why Parallel Calls

| Benefit | Impact |
|---------|--------|
| **Modularity** | Toggle Alchemy on/off per tier |
| **Freemium lever** | Alchemy = premium feature |
| **Iteration speed** | Improve alchemy prompts without touching 1,500 workflows |
| **Failure isolation** | If alchemy fails, rational output stays intact |
| **UX possibilities** | Show rational fast, then "Generating counterintuitive options..." |
| **A/B testing** | Test alchemy variations independently |

### Cost Impact

- Call 1 (SCQA): ~$0.18/query
- Call 2 (Alchemy): ~$0.07-0.10/query
- **Total**: ~$0.25-0.28/query
- Still profitable with PWYW minimum of $10/month

---

## The Four Alchemy Lenses

### Lens Definitions

| Lens | Question It Asks | Example Output |
|------|------------------|----------------|
| **The Opposite Lens** | "What if we did the exact reverse of the obvious solution?" | "Instead of discounting to attract customers, raise prices and add exclusivity signals" |
| **The Perception Lens** | "How could we change how this FEELS rather than what it IS?" | "Uber didn't make cars faster, just showed the map — what's our equivalent?" |
| **The Signal Lens** | "What would make this feel more valuable without changing substance?" | "Expensive packaging signals importance through visible waste" |
| **The Small Bet Lens** | "What micro-intervention under $10K might have outsized impact?" | "4 words added to a telemarketing script doubled conversions" |

### Alchemy Layer Prompt

```typescript
export const ALCHEMY_PROMPT = `You are a behavioral strategist trained in Rory Sutherland's "Alchemy" methodology. You've just reviewed a rational strategic recommendation.

Your job: Generate counterintuitive options the client hasn't considered.

INPUT:
- Original Problem: {problem}
- Domain(s): {domains}
- Classified Intent: {intent}
- Key Challenges: {challenges}

Apply these four lenses:

1. THE OPPOSITE LENS
   "What if we did the exact reverse of the obvious solution?"
   Look for cases where the opposite approach might work better.
   
2. THE PERCEPTION LENS  
   "How could we change how this FEELS rather than what it IS?"
   Reference: Uber didn't make cars faster, just showed the map.
   What perception shift could solve this without changing substance?

3. THE SIGNAL LENS
   "What would make this feel more valuable/trustworthy without changing the substance?"
   Reference: Expensive wedding invitations signal importance through visible "waste."
   What signals could be added or changed?

4. THE SMALL BET LENS
   "What micro-intervention under $10K might have outsized impact?"
   Reference: Adding 4 words to a script doubled conversions.
   What tiny contextual tweak might have outsized results?

OUTPUT FORMAT (use exactly this structure):

## Counterintuitive Options
[2-3 specific alternatives that challenge conventional thinking. Each should be concrete and actionable, not vague.]

## The Perception Play  
[One specific way to reframe or change perception without changing substance. Be specific about what to do.]

## Small Bet, Big Signal
[One low-cost (<$10K), high-impact intervention. Include estimated cost and expected impact.]

## The Hidden Driver
[What this problem is REALLY about psychologically — the unspoken motivation or fear beneath the stated problem. 2-3 sentences max.]

RULES:
- Be specific and actionable, not generic
- Each option should feel surprising but logical once explained
- Never use consulting jargon
- Write as if advising a smart CEO who's heard all the standard advice`;
```

---

## Enhanced Problem Intake

### Dual-Track Questions

Add behavioral questions alongside rational ones during clarification:

| Rational Questions (Current) | Behavioral Questions (Add) |
|------------------------------|---------------------------|
| "What business challenge are you facing?" | "What do your customers/employees *say* they want vs what they *actually do*?" |
| "What have you tried so far?" | "What's the *opposite* of what you've tried?" |
| "What outcome are you looking for?" | "What *feeling* are you trying to create in customers/employees/stakeholders?" |
| "What constraints do you have?" | "What would you do if you had to solve this with zero budget?" |

### Implementation

The clarifying questions prompt should include both tracks:

```typescript
export const CLARIFYING_PROMPT = `Based on the user's problem, ask 2-4 clarifying questions.

Include a MIX of:
- Rational questions (metrics, constraints, timeline, resources)
- Behavioral questions (perceptions, feelings, opposites, what people say vs do)

The behavioral questions help surface the psychological reality beneath the stated problem.

Example behavioral questions:
- "What do your customers SAY they want vs what they ACTUALLY do?"
- "What's the opposite of what you've tried?"
- "What feeling are you trying to create?"
- "If you had to solve this with zero budget, what would you try?"

Ask questions naturally in conversation, not as a numbered list.`;
```

---

## Document Output Structure (8 Sections)

### Full Document Structure

```
STRATEGIC DOCUMENT
│
├── 1. EXECUTIVE SUMMARY (SCQA)
│   ├── Situation: Current state facts
│   ├── Complication: What changed/threatens
│   ├── Question: Strategic question to answer
│   └── Answer: Recommendation in one sentence
│
├── 2. SITUATION ANALYSIS
│   ├── Market context
│   ├── Competitive landscape
│   └── Internal assessment
│
├── 3. PROBLEM DIAGNOSIS
│   ├── Root cause analysis
│   ├── Assumption validation
│   └── Impact quantification
│
├── 4. STRATEGIC OPTIONS (3 alternatives)
│   ├── Option A: Description, pros, cons, resources
│   ├── Option B: Description, pros, cons, resources
│   ├── Option C: Description, pros, cons, resources
│   └── Comparison table with recommendation
│
├── 5. RECOMMENDATION
│   ├── Clear direction
│   ├── Rationale
│   └── Expected outcomes with metrics
│
├── 6. IMPLEMENTATION ROADMAP (30-60-90 Day)
│   ├── Days 1-30: Foundation + Quick wins
│   ├── Days 31-60: Build momentum
│   └── Days 61-90: Scale & optimize
│
├── 7. RISK MITIGATION
│   ├── Top 3-5 risks with probability/impact
│   ├── Mitigation strategies
│   └── Early warning signals
│
└── 8. ALCHEMY SECTION (Premium) ← NEW
    ├── Counterintuitive Options (2-3)
    ├── The Perception Play
    ├── Small Bet, Big Signal
    └── The Hidden Driver
```

### Section 8: Alchemy Section Specification

This section is generated by Call 2 (parallel) and appended to the document.

**Display Logic**:
- Free tier: Show teaser "Unlock counterintuitive options with Pro"
- Paid tier (above-average PWYW): Full Alchemy Section

**Styling**:
- Visual separator before section
- Different background color (subtle highlight)
- Icon or badge indicating "Behavioral Insights"

---

## Design System

### Colors
```javascript
const colors = {
  // Primary
  navy: {
    primary: '#1A365D',    // Main brand color
    light: '#2C5282',      // Secondary actions
    dark: '#1A202C',       // Text on light backgrounds
  },
  // Neutrals
  slate: {
    50: '#F7FAFC',         // Backgrounds
    100: '#EDF2F7',        // Cards
    200: '#E2E8F0',        // Borders
    600: '#718096',        // Secondary text
    800: '#2D3748',        // Primary text
  },
  // Semantic
  success: '#2F855A',
  warning: '#D69E2E',
  error: '#C53030',
  // Alchemy Section
  alchemy: {
    bg: '#FDF6E3',         // Warm highlight background
    border: '#D69E2E',     // Amber accent
  },
}
```

### Typography
```javascript
// Font: Inter (Google Fonts)
const typography = {
  h1: 'text-4xl font-bold',      // 36px
  h2: 'text-2xl font-semibold',  // 24px
  h3: 'text-xl font-semibold',   // 20px
  body: 'text-base',              // 16px
  small: 'text-sm',               // 14px
}
```

### Brand Voice: "The Confident Expert"

**Personality Sliders** (NN/g framework):

| Dimension | Setting | Description |
|-----------|---------|-------------|
| Humor | Low-medium | Dry, occasional, never meme-y |
| Formality | Medium | Plain business English, not corporate jargon |
| Respectfulness | High | Challenges decisions, not user's competence |
| Enthusiasm | Medium | Calm confidence, not hype |

**Voice Rules**:
- Prefer short, direct sentences
- Use specific verbs: "cut", "test", "ship", "hire", "drop"
- Avoid: "leverage synergies", "unlock value", "holistic solution"
- Call out contradictions directly but respectfully
- Translate fluffy goals into measurable ones

**Copy Package**:
- **Headline**: "Move fast without getting exposed."
- **Subhead**: "From messy business question to board-ready strategic plan — with the rationale, risks, and unconventional options already mapped out. In 20 minutes."
- **One-liner**: "Like having a top business consultant on speed dial — without the invoice."
- **Offer**: "28 days free. Then pay what it's worth — $10 minimum, most pay $50-150/month."

---

## PWYW Pricing Model

### Replacing Fixed Tiers

Instead of Free/Pro ($29) tiers, implement Pay What You Want:

| Phase | Duration | Access |
|-------|----------|--------|
| **Free Trial** | 28 days | Full access (SCQA + Alchemy) |
| **PWYW** | Ongoing | $10 minimum, no maximum |

### Segment Anchors

Display at payment moment:
```
"What do others like you pay?"

• Solopreneurs: $15-45/month
• Small business owners: $50-150/month  
• Senior managers: $100-250/month
• CEOs/Founders: $200-500/month

What feels right for the value you received? [$___]
```

### "Beat the Average" Unlock

```
┌─────────────────────────────────────────────────────────────┐
│  YOUR PAYMENT: $35/month                                     │
│  CURRENT AVERAGE: $47/month                                  │
│                                                              │
│  ⚡ Pay $12 more to unlock:                                  │
│     • Counterintuitive Options section                       │
│     • "What would Rory do?" behavioral alternatives          │
│     • Small Bets, Big Signals recommendations                │
│                                                              │
│  [Keep at $35]  [Upgrade to $47]  [I'll pay more: $___]     │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema for PWYW

```sql
-- Users table updated for PWYW
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  -- PWYW fields
  monthly_payment DECIMAL(10,2) DEFAULT 0,
  payment_tier TEXT DEFAULT 'trial' CHECK (payment_tier IN ('trial', 'below_average', 'average', 'above_average')),
  trial_ends_at TIMESTAMPTZ,
  -- Usage tracking
  monthly_queries_used INTEGER DEFAULT 0,
  queries_reset_at TIMESTAMPTZ DEFAULT NOW(),
  -- Stripe
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track average payment for anchoring
CREATE TABLE payment_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment TEXT NOT NULL, -- 'solopreneur', 'small_business', 'manager', 'ceo'
  average_payment DECIMAL(10,2) NOT NULL,
  payment_count INTEGER NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Alchemy Access Logic

```typescript
function hasAlchemyAccess(user: User): boolean {
  // Trial users get full access
  if (user.payment_tier === 'trial' && new Date() < user.trial_ends_at) {
    return true;
  }
  
  // Post-trial: only average and above get Alchemy
  return ['average', 'above_average'].includes(user.payment_tier);
}
```

---

## Problem Classification System

### 4-Layer Taxonomy

| Layer | Purpose | Example |
|-------|---------|---------|
| **Symptom** | Surface-level user language | "Marketing spend up, revenue flat" |
| **Challenge** | Underlying business issue | Channel inefficiency, targeting mismatch |
| **Domain(s)** | Business function(s) involved | Marketing → Sales → Strategy |
| **Intent** | User's goal state | Explore / Decide / Execute / Monitor |

### Classification Prompt

```typescript
export const CLASSIFICATION_PROMPT = `You are a business problem classifier. Analyze the user's problem and classify it using this 4-layer taxonomy.

LAYER 1 - SYMPTOMS (surface-level user language):
- Growth: revenue flat, not growing, lost market share
- Efficiency: costs high, taking too long, can't keep up
- People: can't hire, high turnover, team underperforming
- Market: competitors winning, customers leaving, not differentiated
- Financial: not profitable, cash flow issues, margins shrinking

LAYER 2 - CHALLENGES (root causes):
- Channel inefficiency, targeting mismatch, value prop unclear
- Employer brand weak, compensation misaligned
- Differentiation gap, speed disadvantage
- Process inefficiency, scale disadvantages
- Culture misalignment, management gaps

LAYER 3 - DOMAINS:
- Strategy, Marketing, Sales, Operations, Innovation, HR, Finance

LAYER 4 - INTENT:
- Explore: understand options (analysis-heavy output)
- Decide: choose between alternatives (recommendation-focused)
- Execute: implement a path (action-heavy, detailed roadmap)
- Monitor: track progress (metrics-focused)

Respond in JSON:
{
  "symptoms": ["symptom1", "symptom2"],
  "challenges": ["challenge1", "challenge2"],
  "primary_domain": "domain",
  "secondary_domains": ["domain1", "domain2"],
  "intent": "decide",
  "confidence": 0.85,
  "clarifying_question": null
}`;
```

---

## Cross-Domain Synergy Detection

### Synergy Matrix

| Primary | Secondary 1 | Secondary 2 | Secondary 3 |
|---------|------------|-------------|-------------|
| Strategy | Marketing | Finance | Innovation |
| Marketing | Sales | Strategy | Operations |
| Sales | Marketing | Operations | Finance |
| Operations | Finance | HR | Sales |
| Innovation | Strategy | Marketing | Operations |
| HR | Operations | Finance | Strategy |
| Finance | Operations | Strategy | Sales |

### Multi-Domain Patterns

**Growth Problem** (Strategy + Marketing + Sales + HR):
```
Signal: "We need to grow faster"
1. Strategy: Growth lever identification
2. Marketing: Demand generation assessment
3. Sales: Capacity and conversion analysis
4. HR: Scaling plan if capacity constrained
```

---

## File Structure

```
qep-aisolve/
├── app/
│   ├── page.tsx                    # Landing page (new copy)
│   ├── layout.tsx                  # Root layout with providers
│   ├── globals.css                 # Tailwind + custom styles
│   ├── auth/
│   │   └── page.tsx                # Sign up / Sign in
│   ├── chat/
│   │   ├── page.tsx                # New decision session
│   │   └── [decisionId]/
│   │       └── page.tsx            # Existing decision
│   ├── document/
│   │   └── [decisionId]/
│   │       └── page.tsx            # View generated document
│   ├── dashboard/
│   │   └── page.tsx                # Decision history
│   ├── pricing/
│   │   └── page.tsx                # PWYW payment page
│   └── api/
│       ├── chat/
│       │   └── route.ts            # Streaming chat endpoint
│       ├── classify/
│       │   └── route.ts            # 4-layer classification
│       ├── alchemy/
│       │   └── route.ts            # Alchemy Layer generation
│       ├── decision/
│       │   └── route.ts            # Create/get decisions
│       ├── document/
│       │   └── route.ts            # Generate SCQA document
│       ├── workflows/
│       │   └── search/
│       │       └── route.ts        # Vector search
│       └── webhooks/
│           └── stripe/
│               └── route.ts        # PWYW subscription events
├── components/
│   ├── ui/                         # Reusable UI components
│   ├── chat/
│   │   ├── ChatInterface.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   ├── ExamplePrompts.tsx
│   │   └── ProgressIndicator.tsx
│   ├── document/
│   │   ├── DocumentView.tsx
│   │   ├── SCQASection.tsx
│   │   ├── RoadmapTable.tsx
│   │   └── AlchemySection.tsx      # NEW: Alchemy display
│   ├── pricing/
│   │   ├── PWYWSlider.tsx          # NEW: Payment slider
│   │   ├── SegmentAnchors.tsx      # NEW: "What others pay"
│   │   └── BeatTheAverage.tsx      # NEW: Upgrade prompt
│   ├── dashboard/
│   │   ├── DecisionList.tsx
│   │   └── DecisionCard.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Navigation.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── ai/
│   │   ├── anthropic.ts
│   │   ├── openai.ts
│   │   ├── classify.ts
│   │   ├── synergy.ts
│   │   ├── synthesize.ts
│   │   ├── alchemy.ts              # NEW: Alchemy generation
│   │   └── prompts.ts
│   ├── stripe/
│   │   └── client.ts
│   └── utils/
│       └── helpers.ts
├── types/
│   └── index.ts
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_workflows_table.sql
│       ├── 003_rls_policies.sql
│       └── 004_pwyw_schema.sql     # NEW: PWYW tables
├── scripts/
│   ├── parse-workflows.ts
│   ├── generate-embeddings.ts
│   └── seed-workflows.ts
├── skills/
│   ├── SKILL.md
│   └── references/
│       ├── problem-classification.md
│       ├── workflow-taxonomy.md
│       ├── cross-domain-synergy.md
│       └── document-structure.md
└── public/
```

---

## Database Schema

### 001_initial_schema.sql

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table with PWYW support
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  -- PWYW pricing
  monthly_payment DECIMAL(10,2) DEFAULT 0,
  payment_tier TEXT DEFAULT 'trial' CHECK (payment_tier IN ('trial', 'below_average', 'average', 'above_average')),
  user_segment TEXT CHECK (user_segment IN ('solopreneur', 'small_business', 'manager', 'ceo')),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '28 days'),
  -- Usage
  monthly_queries_used INTEGER DEFAULT 0,
  queries_reset_at TIMESTAMPTZ DEFAULT NOW(),
  -- Stripe
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Decisions table
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  mode TEXT DEFAULT 'one_shot' CHECK (mode IN ('one_shot', 'companion')),
  problem_statement TEXT,
  -- 4-layer classification
  classified_symptoms JSONB DEFAULT '[]',
  classified_challenges JSONB DEFAULT '[]',
  classified_domains JSONB DEFAULT '[]',
  classified_intent TEXT CHECK (classified_intent IN ('explore', 'decide', 'execute', 'monitor')),
  classification_confidence FLOAT,
  -- Workflow matching
  matched_workflows JSONB DEFAULT '[]',
  -- Alchemy
  alchemy_generated BOOLEAN DEFAULT FALSE,
  -- Status
  status TEXT DEFAULT 'intake' CHECK (status IN ('intake', 'clarifying', 'processing', 'complete', 'active', 'review_due', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  step_label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table with Alchemy section
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  format TEXT DEFAULT 'markdown' CHECK (format IN ('markdown', 'pdf', 'docx')),
  -- SCQA sections
  scqa_situation TEXT,
  scqa_complication TEXT,
  scqa_question TEXT,
  scqa_answer TEXT,
  -- Roadmap
  roadmap_30 JSONB,
  roadmap_60 JSONB,
  roadmap_90 JSONB,
  -- Alchemy section (separate for access control)
  alchemy_content JSONB,  -- {counterintuitive, perception_play, small_bet, hidden_driver}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment stats for PWYW anchoring
CREATE TABLE payment_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment TEXT NOT NULL UNIQUE,
  average_payment DECIMAL(10,2) NOT NULL,
  median_payment DECIMAL(10,2),
  payment_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial payment stats
INSERT INTO payment_stats (segment, average_payment, median_payment, payment_count) VALUES
  ('solopreneur', 29.00, 25.00, 0),
  ('small_business', 79.00, 75.00, 0),
  ('manager', 149.00, 125.00, 0),
  ('ceo', 299.00, 250.00, 0);

-- Indexes
CREATE INDEX idx_decisions_user_id ON decisions(user_id);
CREATE INDEX idx_decisions_status ON decisions(status);
CREATE INDEX idx_messages_decision_id ON messages(decision_id);
CREATE INDEX idx_documents_decision_id ON documents(decision_id);
CREATE INDEX idx_users_payment_tier ON users(payment_tier);
```

### 002_workflows_table.sql

```sql
-- Workflows table
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL CHECK (domain IN ('strategy', 'marketing', 'sales', 'innovation', 'operations', 'hr', 'finance')),
  sub_domain TEXT,
  source_book TEXT NOT NULL,         -- INTERNAL ONLY
  name TEXT NOT NULL,
  task_summary TEXT NOT NULL,
  full_prompt TEXT NOT NULL,
  key_questions JSONB DEFAULT '[]',
  problem_patterns JSONB DEFAULT '[]',
  synergy_triggers JSONB DEFAULT '[]',
  complexity TEXT DEFAULT 'medium' CHECK (complexity IN ('low', 'medium', 'high')),
  estimated_duration_min INTEGER,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector index
CREATE INDEX idx_workflows_embedding ON workflows 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_workflows_domain ON workflows(domain);

-- Vector search function
CREATE OR REPLACE FUNCTION match_workflows(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.75,
  match_count INT DEFAULT 4,
  filter_domains TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  domain TEXT,
  sub_domain TEXT,
  full_prompt TEXT,
  key_questions JSONB,
  problem_patterns JSONB,
  synergy_triggers JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id,
    w.name,
    w.domain,
    w.sub_domain,
    w.full_prompt,
    w.key_questions,
    w.problem_patterns,
    w.synergy_triggers,
    1 - (w.embedding <=> query_embedding) AS similarity
  FROM workflows w
  WHERE (filter_domains IS NULL OR w.domain = ANY(filter_domains))
    AND 1 - (w.embedding <=> query_embedding) > match_threshold
  ORDER BY w.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## Implementation Order

### Sprint 1: Foundation (Week 1-2)

**Tasks**:
1. Initialize Next.js project with TypeScript
2. Configure Tailwind with design tokens
3. Set up Supabase project with PWYW schema
4. Run database migrations
5. Implement Supabase Auth
6. Create basic page layouts with new copy
7. Copy skill files to `/skills` directory

### Sprint 2: Chat Interface (Week 3-4)

**Tasks**:
1. Build chat UI components
2. Implement message streaming
3. Create example prompts (by problem theme)
4. Add progress indicators
5. Implement "Decision" naming and status
6. Add behavioral questions to intake

### Sprint 3: Workflow Engine (Week 5)

**Tasks**:
1. Parse .docx workflow files
2. Extract 4-layer classification metadata
3. Generate embeddings
4. Load workflows into Supabase
5. Implement vector search with domain filtering

### Sprint 4: AI Pipeline + Alchemy (Week 6)

**Tasks**:
1. Implement 4-layer classification (Haiku)
2. Build cross-domain synergy detection
3. Create workflow matching
4. Implement SCQA synthesis (Sonnet) — Call 1
5. **Implement Alchemy Layer (Sonnet) — Call 2**
6. Merge outputs into 8-section document

### Sprint 5: Document & Dashboard (Week 7)

**Tasks**:
1. Build document view with all 8 sections
2. **Implement AlchemySection component** with premium styling
3. Add copy functionality
4. Create dashboard with decision history
5. **Add Alchemy teaser for free tier**

### Sprint 6: PWYW Payments & Polish (Week 8)

**Tasks**:
1. **Build PWYWSlider component**
2. **Implement SegmentAnchors display**
3. **Create BeatTheAverage prompt**
4. Integrate Stripe for variable pricing
5. Implement payment tier logic
6. **Gate Alchemy by payment tier**
7. Final testing

---

## API Routes

### /api/alchemy/route.ts (NEW)

```typescript
import { anthropic } from '@/lib/ai/anthropic';
import { createClient } from '@/lib/supabase/server';
import { ALCHEMY_PROMPT } from '@/lib/ai/prompts';

export async function POST(req: Request) {
  const { decisionId, problem, domains, challenges, intent } = await req.json();
  const supabase = createClient();
  
  // Check user has Alchemy access
  const { data: { user } } = await supabase.auth.getUser();
  const { data: userData } = await supabase
    .from('users')
    .select('payment_tier, trial_ends_at')
    .eq('id', user.id)
    .single();
  
  const hasAccess = 
    (userData.payment_tier === 'trial' && new Date() < new Date(userData.trial_ends_at)) ||
    ['average', 'above_average'].includes(userData.payment_tier);
  
  if (!hasAccess) {
    return Response.json({ error: 'Upgrade required for Alchemy insights' }, { status: 403 });
  }
  
  // Generate Alchemy content
  const prompt = ALCHEMY_PROMPT
    .replace('{problem}', problem)
    .replace('{domains}', domains.join(', '))
    .replace('{challenges}', challenges.join(', '))
    .replace('{intent}', intent);
  
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });
  
  const alchemyContent = response.content[0].text;
  
  // Store in document
  await supabase
    .from('documents')
    .update({ alchemy_content: parseAlchemyContent(alchemyContent) })
    .eq('decision_id', decisionId);
  
  await supabase
    .from('decisions')
    .update({ alchemy_generated: true })
    .eq('id', decisionId);
  
  return Response.json({ content: alchemyContent });
}

function parseAlchemyContent(content: string) {
  // Parse markdown sections into JSON
  // Returns: { counterintuitive, perception_play, small_bet, hidden_driver }
  // Implementation details...
}
```

---

## Testing Checklist

Before deploying, verify:

**Core Flow**:
- [ ] User can sign up and gets 28-day trial
- [ ] New decision shows example prompts
- [ ] Problem intake includes behavioral questions
- [ ] 4-layer classification works
- [ ] Cross-domain synergy detects correctly
- [ ] SCQA document generates (7 sections)
- [ ] **Alchemy section generates (parallel call)**
- [ ] **8-section document displays correctly**

**Alchemy Layer**:
- [ ] **Trial users see full Alchemy section**
- [ ] **Below-average payers see teaser/upgrade prompt**
- [ ] **Average+ payers see full Alchemy section**
- [ ] **Four lenses all populate with specific content**

**PWYW**:
- [ ] **Segment anchors display correctly**
- [ ] **Slider works with $10 minimum**
- [ ] **"Beat the Average" prompt shows at right threshold**
- [ ] **Stripe creates variable-amount subscription**
- [ ] **Payment tier updates correctly**

**Polish**:
- [ ] Landing page has new copy
- [ ] Dashboard shows decision history
- [ ] Copy buttons work
- [ ] Mobile responsive

---

## Environment Variables

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI (Embeddings only)
OPENAI_API_KEY=sk-...

# Stripe (PWYW)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# App
NEXT_PUBLIC_APP_URL=https://qep-aisolve.app
```

---

## Skill Files Reference

The `/skills` directory contains authoritative specifications:

| File | Purpose |
|------|---------|
| `SKILL.md` | Master skill description, value pipeline |
| `references/problem-classification.md` | Complete 4-layer taxonomy |
| `references/workflow-taxonomy.md` | All 7 domains with sub-domains |
| `references/cross-domain-synergy.md` | Synergy matrix and triggers |
| `references/document-structure.md` | Full SCQA format specifications |

---

## Summary: What's New in v3

| Feature | Description |
|---------|-------------|
| **Alchemy Layer** | Parallel AI call generating counterintuitive options |
| **Four Lenses** | Opposite, Perception, Signal, Small Bet |
| **8-Section Document** | SCQA (7) + Alchemy Section |
| **Behavioral Intake** | Dual-track questions (rational + behavioral) |
| **PWYW Pricing** | $10 min, segment anchors, beat-the-average |
| **New Copy** | "Move fast without getting exposed" |
| **Premium Gating** | Alchemy unlocks for average+ payers |

---

## Support

For implementation questions during Claude Code sessions, refer to this document and the skill files in `/skills`. All architectural decisions are documented here.

This is your single source of truth for the QEP AISolve build.
