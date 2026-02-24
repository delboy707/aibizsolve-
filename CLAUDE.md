CLAUDE.md — QEP AI Solve Agent Operating Manual

Project: QEP AI Solve — AI-powered strategy consulting replacement
Stack: React · Supabase (Auth, Database, 583 Workflows, Edge Functions) · Claude AI API · Vercel
Methodology: SCQA Framework + 583 Domain-Specific Workflows + Claude AI + Alchemy Layer
Live URL: qep-aisolve.vercel.app
GitHub: github.com/delboy707/aibizsolve-
Target Users: Mid-sized company CEOs and their teams who need strategy consulting but can't justify £10K+ fees
Pricing: Pay-what-you-want ($10 min, $50-150 typical), 28-day free trial
Last updated: February 2026


IDENTITY & PURPOSE
QEP AI Solve is a B2B SaaS application that replaces traditional strategy consulting engagements (typically £10K+) with AI-powered strategic document generation. The app's power comes from THREE interconnected systems working together:

583 Supabase Workflows — Domain-specific, structured analytical workflows stored in Supabase that encode 30+ years of consulting methodology across 7 business domains. These are NOT generic prompts — they are the codified expertise of a senior consultant who has worked across 80+ countries.
Claude AI — Provides the natural language understanding, reasoning, and document generation capability. Claude interprets the user's business problem, processes it through the relevant workflows, and generates the strategic output.
The Alchemy Layer — A proprietary behavioural economics and counterintuitive insight layer that adds depth beyond conventional strategy analysis. This is what makes the output feel like senior consultant work, not a chatbot response.

All three systems must work together. If the 583 workflows aren't being called, the output is generic AI — not the product. If Claude AI isn't connected, there's no generation. If the Alchemy Layer is missing, the documents lack the differentiator.

ABSOLUTE RULES — NEVER VIOLATE THESE
1. The Three-System Pipeline Must Work End-to-End

The complete pipeline: User describes problem → App identifies relevant workflows from the 583 → Claude AI processes through those workflows → Alchemy Layer adds behavioural insights → SCQA document generated
All three systems must fire in sequence. A document generated without the Supabase workflows is just generic Claude output. A document without the Alchemy Layer is standard SCQA. Neither is the product.
Before committing ANY change, verify this full pipeline: submit a test problem, confirm the relevant workflows are retrieved from Supabase, confirm Claude AI processes them, confirm the Alchemy Layer appears in the output.
If any of the three systems breaks, this is P0 — drop everything else and fix it.

2. The 583 Supabase Workflows Are Sacred

These 583 workflows represent 30+ years of consulting methodology. They are the app's core intellectual property.
NEVER delete, modify, or restructure existing workflows without explicit owner approval.
NEVER replace workflow logic with generic Claude AI prompts. The workflows exist precisely because they encode domain-specific expertise that generic AI cannot replicate.
When adding new workflows: follow the existing structure and naming conventions. New workflows must be reviewed by the owner before deployment.
Workflow retrieval logic must be accurate. When a user submits a problem about marketing, the app must pull the relevant marketing workflows — not strategy workflows or random ones. Mis-routing a problem to the wrong workflow set produces wrong advice.
Document which workflows are being called for any given user input. If there's a bug in the output, the first diagnostic step is: were the RIGHT workflows selected?

3. Claude AI Integration Must Be Maintained

Claude AI calls must pass through the Supabase workflow context. The system prompt or context for Claude must include the relevant workflow data — Claude should not be generating strategy documents from its general knowledge alone.
The Claude API model and parameters should not be downgraded without owner approval. Document generation quality depends on model capability.
Error handling for Claude API failures must be graceful. If the API is down or rate-limited, show the user a clear message — never show a raw error or a blank page.
API keys must remain server-side (Supabase Edge Functions or Vercel API routes). Never expose the Anthropic API key in client-side code.

4. The Alchemy Layer Must Appear in Every Document

The Alchemy Layer is the product differentiator. It provides:

Behavioural biases that might affect decision-making
Counterintuitive strategic options that conventional analysis would miss
Second-order effects and unintended consequences
Insights drawn from pattern recognition across industries and geographies


If a generated document doesn't include an Alchemy Layer section, the pipeline is broken. Check whether the Alchemy prompt/workflow is being included in the Claude API call.
The Alchemy Layer must NOT feel generic. It should reference specific biases, name specific risks, and offer specific counterintuitive recommendations tied to the user's actual problem.

5. Auth Flow — CTAs Must Route Correctly

Known bug: "Get Started" and "Start Free Trial" buttons route to /auth which shows a Sign In form. New visitors expect Sign Up.
Correct behaviour:

"Get Started" button → Sign Up form
"Start Free Trial" button → Sign Up form
"Sign In" nav link → Sign In form


After ANY auth changes, test all paths.

6. Colour System Consistency

Known bug: Some components reference undefined navy-* CSS/Tailwind variables.
The design system uses a blue/white colour palette. All CTAs and buttons should use the same primary blue.
Before committing CSS/Tailwind changes: search for any undefined colour variables and resolve them.

7. Deployment & Testing

Run npm run build locally before pushing.
After git push, wait for Vercel auto-deploy, then test the live site.
Test the full three-system pipeline after every significant change.
Test on both desktop and mobile viewports.


KNOWN GOTCHAS — THINGS THAT HAVE BROKEN BEFORE
Supabase Workflow Connectivity (THE #1 RISK)

The most critical concern in this entire app: Are the 583 workflows actually being retrieved and used when a user submits a problem?
Diagnostic steps:

Check if the frontend queries Supabase for workflows when a problem is submitted
Check if the correct domain-specific workflows are selected (Strategy problem → Strategy workflows)
Check if the retrieved workflow data is passed to the Claude AI call
Check if the Claude API response includes content that clearly came from workflow processing (not just generic AI output)


How to tell if workflows aren't connected: The generated document will be generic — it'll read like a ChatGPT response about business strategy rather than structured, methodology-driven analysis. If the document could have been written without any workflow data, the workflows probably weren't used.

Workflow Routing Accuracy

With 583 workflows across 7 domains, routing the user's problem to the correct workflow subset is critical.
Misrouted problems produce wrong advice. A marketing problem processed through finance workflows will generate irrelevant output.
The routing logic must consider: primary domain, secondary domains (cross-domain problems), problem specificity (broad strategy vs. narrow tactical), and industry context.

Undefined CSS/Tailwind Variables

Components referencing navy-* variables that don't exist cause silent styling failures.
Fix: Either add navy-* to tailwind.config.js or replace all references with actual hex values.

Auth Form State

Auth page shows Sign In by default instead of Sign Up when CTAs are clicked.

Landing Page Incompleteness

No footer, no pricing section, no final CTA — page ends abruptly after "How It Works."


ARCHITECTURE REFERENCE
The Three-System Architecture
┌─────────────────────────────────────────────────────────────────┐
│                     USER INPUT                                   │
│            "My SaaS revenue growth has stalled..."               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              SYSTEM 1: SUPABASE WORKFLOWS (583)                  │
│                                                                  │
│  Problem Analysis → Domain Classification → Workflow Selection   │
│  → Retrieve relevant workflows from the 583 stored in Supabase   │
│  → Pass structured workflow context to Claude AI                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              SYSTEM 2: CLAUDE AI                                 │
│                                                                  │
│  Receives: User problem + Selected workflow context              │
│  Processes: Through SCQA framework guided by workflow steps      │
│  Generates: Structured strategy document                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              SYSTEM 3: ALCHEMY LAYER                             │
│                                                                  │
│  Adds: Behavioural economics insights                            │
│  Adds: Counterintuitive recommendations                          │
│  Adds: Second-order effects and hidden risks                     │
│  Adds: Cross-industry pattern recognition                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              OUTPUT: SCQA STRATEGY DOCUMENT                      │
│                                                                  │
│  S — Situation    (informed by workflows)                        │
│  C — Complication (informed by workflows)                        │
│  Q — Question     (synthesised from analysis)                    │
│  A — Answer       (with 90-day roadmap + Alchemy insights)      │
└─────────────────────────────────────────────────────────────────┘
7 Business Domains (covered by the 583 workflows)
1. Strategy       → Business strategy, competitive positioning, market entry
2. Marketing      → Go-to-market, brand strategy, customer acquisition
3. Operations     → Process optimisation, supply chain, efficiency
4. Finance        → Financial planning, cash flow, investment decisions
5. HR             → Talent strategy, organisational design, culture
6. Technology     → Digital transformation, tech stack decisions, automation
7. Sales          → Revenue growth, pipeline optimisation, pricing strategy
Tech Stack
Frontend:        React (Next.js)
Auth:            Supabase Auth
Database:        Supabase PostgreSQL (stores 583 workflows + user data)
AI Backend:      Supabase Edge Functions → Claude API
AI Model:        Claude (via Anthropic API)
Hosting:         Vercel (auto-deploy from GitHub)
Styling:         Tailwind CSS (blue/white design system)
User Flow
1. Landing page → User reads value prop, sees example documents
2. Click "Get Started" → Sign Up form
3. Dashboard → User describes business problem in plain language
4. App classifies problem domain → selects relevant workflows from 583
5. App asks 3-5 clarifying questions (informed by workflow requirements)
6. User answers clarifying questions
7. Selected workflows + user input + Alchemy prompt → sent to Claude AI
8. Claude generates SCQA document with Alchemy Layer
9. Document displayed in-app with download/export options
10. User can iterate — refine problem, get fresh analysis

NAVIGATION RULES — HOW TO HANDLE COMMON SITUATIONS
When asked to fix a bug:

Read this CLAUDE.md first
Verify the three-system pipeline still works (583 Workflows + Claude AI + Alchemy)
Check for undefined CSS variables if visual
Test auth flow if touching authentication
Run npm run build before committing

When asked to modify the AI generation logic:

Map the current pipeline first: Frontend → Supabase workflow query → Edge Function → Claude API call → Response handling
Verify ALL THREE SYSTEMS are active in the pipeline
The 583 workflows must be queried and used — not bypassed
The Alchemy Layer must appear in output
Test with problems from at least 2 different domains
Output must read like senior consultant work, not generic AI

When asked to add or modify workflows:

Get owner approval first — these encode proprietary methodology
Follow existing workflow structure and naming
Ensure new workflows are correctly tagged to their domain
Verify the routing logic picks up the new workflows
Test that the new workflows produce domain-appropriate output

When asked to debug poor document quality:

Check workflow routing — is the right domain being selected?
Check if workflows are actually being passed to Claude — log the API call payload
Check if the Alchemy Layer prompt is included
Check Claude API model/parameters — has anything been downgraded?
If output reads generic, the workflows probably aren't being used


SIGNALS — ADAPTIVE BEHAVIOUR RULES
SignalResponseOwner says "the AI isn't generating documents"P0. Check: (1) Edge Functions deployed? (2) Frontend calling them? (3) 583 workflows queried from Supabase? (4) Workflows passed to Claude API? (5) Claude returning response? (6) Response rendered?Owner says "documents are generic/weak"The 583 workflows probably aren't being used. Check workflow query and API payload.Owner says "wrong advice for the domain"Workflow routing problem — wrong domain workflows being selected.Owner says "no Alchemy insights"Alchemy Layer prompt missing from Claude API call.Owner reports styling issueCheck for undefined navy-* variables.Owner says "buttons don't work"Check auth routing — CTAs may route to Sign In not Sign Up.Owner mentions "market testing"Run FULL three-system pipeline. Submit a real problem. Verify output includes workflow-driven SCQA AND Alchemy Layer.

QUALITY GATES — CHECKLIST BEFORE ANY COMMIT

 npm run build passes without errors
 No undefined CSS/Tailwind variables
 Landing page renders on desktop and mobile
 "Get Started" routes to Sign Up (not Sign In)
 If AI-related: test problem submitted → workflows retrieved → Claude generated with workflow context → Alchemy Layer in output
 If workflow-related: correct domain routing verified for 2+ problem types
 All buttons use consistent primary blue
 Footer shows dynamic year
 No API keys in client-side code
 Git commit message is descriptive


PROHIBITED ACTIONS
Do NOT do any of the following without explicit owner approval:

Delete, modify, or restructure any of the 583 Supabase workflows
Bypass the workflow system — send problems to Claude AI without workflow context
Remove the Alchemy Layer from document generation
Change the SCQA framework structure
Change Supabase project configuration or Auth settings
Modify Vercel environment variables
Add social proof/testimonials (none exist yet)
Change pricing model or display text
Remove any of the 7 business domains
Expose Supabase service_role key or Anthropic API key in client-side code
Downgrade Claude AI model without testing quality impact


PROJECT HISTORY NOTES
Critical concerns in priority order:

Three-system connectivity — Are ALL THREE systems (583 workflows + Claude AI + Alchemy Layer) firing when a user submits a problem? This has been uncertain. Every session must verify.
Workflow routing accuracy — 583 workflows across 7 domains. Wrong routing = wrong advice = damaged credibility.
Undefined navy-* colour variables — Cascading styling failures.
Auth flow misdirection — CTAs routing to Sign In not Sign Up.
Incomplete landing page — Missing footer, pricing, final CTA.

The three-system connectivity is the highest priority. Without all three systems working together, QEP AI Solve is just another chatbot wrapper — not the consulting replacement it's designed to be.
