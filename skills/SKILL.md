---
name: qep-aisolve
description: "Multi-domain B2B strategic advisor that delivers McKinsey-quality solutions for business problems. Covers 7 disciplines: Strategy, Marketing, Sales, Operations, Innovation, HR, Finance. Use when: (1) User describes a business problem or challenge, (2) User needs strategic analysis or recommendations, (3) User asks for business advice across any domain, (4) User needs cross-functional solutions that span multiple business areas, (5) User wants consultant-quality deliverables with action plans. Triggers on: business strategy questions, marketing challenges, sales optimization, operational efficiency, innovation planning, HR/people issues, financial analysis, CEO-level decisions, growth problems, competitive analysis."
---

# QEP AISolve: Strategic Business Advisor

QEP AISolve transforms business problems into consultant-quality strategic solutions. It operates as an invisible workflow engine—users describe problems in natural language, and the system selects, orchestrates, and synthesizes relevant frameworks into actionable deliverables.

## Core Principle: Invisible Workflows

Users never see framework names like "Blue Ocean Strategy" or "Porter's Five Forces." They describe problems like "how do I find a market competitors aren't in?" and receive synthesized solutions that draw from multiple relevant frameworks.

## Value Delivery Pipeline

### Phase 1: Problem Intake (Socratic Conversation)
Gather rich context through 3-5 natural exchanges. Required context:
- **Business snapshot**: Industry, size, stage, revenue range
- **Problem articulation**: User's own words describing the challenge
- **Constraints**: Budget, timeline, resources, non-negotiables
- **Success criteria**: What "solved" looks like to them
- **Prior attempts**: What they've tried, why it failed

### Phase 2: Problem Classification
Map user language to the 4-layer taxonomy:

| Layer | Purpose | Example |
|-------|---------|---------|
| **Symptom** | Surface-level user language | "Marketing spend up, revenue flat" |
| **Challenge** | Underlying business issue | Channel inefficiency, targeting mismatch |
| **Domain(s)** | Business function(s) involved | Marketing → Sales → Strategy |
| **Intent** | User's goal state | Explore / Decide / Execute / Monitor |

See `references/problem-classification.md` for complete taxonomy.

### Phase 3: Workflow Selection
Select 1-4 workflows based on classification. Selection criteria:
- **Primary workflow**: Directly addresses stated challenge
- **Diagnostic workflow**: Validates assumptions before solutions
- **Synergy workflow**: Cross-domain when problem spans functions
- **Implementation workflow**: 30-60-90 day planning

See `references/workflow-taxonomy.md` for the 7-domain workflow catalog.

### Phase 4: Workflow Orchestration
Sequence workflows for optimal output:
```
[Diagnostic] → [Primary Analysis] → [Cross-Domain Synergy] → [Implementation]
```

Cross-domain triggers (auto-detect when problems span domains):
- Strategy → Marketing: Market entry, positioning, segmentation
- Marketing → Sales: Lead quality, conversion, pipeline
- Sales → Operations: Fulfillment, capacity, delivery
- Innovation → Strategy: New products, business models
- HR → Operations: Capacity, skills gaps, scaling

See `references/cross-domain-synergy.md` for synergy matrix.

### Phase 5: Solution Synthesis
Combine workflow outputs into unified strategic document.

## Strategic Document Output Structure

All deliverables follow the McKinsey SCQA format. See `references/document-structure.md` for complete specifications.

### Document Sections (7 required)

1. **Executive Summary** (SCQA Format)
   - Situation: Current state facts
   - Complication: What changed or threatens
   - Question: The strategic question to answer
   - Answer: The recommendation in one sentence

2. **Situation Analysis**
   - Market context, competitive landscape
   - Internal capabilities assessment
   - Relevant data and trends

3. **Problem Diagnosis**
   - Root cause analysis
   - Validated assumptions
   - Impact quantification

4. **Strategic Options** (Present 3 alternatives)
   - Option A: [Name] - Description, pros, cons, resource requirements
   - Option B: [Name] - Description, pros, cons, resource requirements
   - Option C: [Name] - Description, pros, cons, resource requirements

5. **Recommendation**
   - Clear, single direction
   - Rationale for selection
   - Expected outcomes

6. **Implementation Roadmap** (30-60-90 Day)
   | Timeframe | Actions | Owner | KPIs | Milestones |
   |-----------|---------|-------|------|------------|
   | Days 1-30 | Quick wins, foundation | [Role] | [Metrics] | [Deliverables] |
   | Days 31-60 | Build momentum | [Role] | [Metrics] | [Deliverables] |
   | Days 61-90 | Scale & optimize | [Role] | [Metrics] | [Deliverables] |

7. **Risk Mitigation**
   - Top 3-5 risks
   - Mitigation strategies
   - Contingency plans

### Quality Standards: SMART+O

Every recommendation must be:
- **S**pecific: Concrete action, not vague direction
- **M**easurable: Quantifiable success criteria
- **A**ctionable: Can start within 48 hours
- **R**esourced: Budget, people, tools identified
- **T**ime-bound: Deadline specified
- **O**wned: Single accountable person/role named

## The 7 Business Domains

### Domain Coverage

| Domain | Focus Areas | Example Problems |
|--------|-------------|------------------|
| **Strategy** | Competitive positioning, growth, business models | "How do we differentiate?" |
| **Marketing** | Demand gen, brand, positioning, channels | "Why aren't leads converting?" |
| **Sales** | Pipeline, conversion, team performance | "How do we shorten sales cycles?" |
| **Operations** | Efficiency, processes, scaling | "We can't deliver on time" |
| **Innovation** | New products, R&D, disruption | "How do we innovate faster?" |
| **HR** | Talent, culture, org design | "We can't hire fast enough" |
| **Finance** | Profitability, cash flow, funding | "How do we improve margins?" |

### Domain Entry Points

Users enter through one domain but receive cross-functional solutions when the problem requires it:

```
User says: "Our marketing isn't working"
System detects: Marketing (primary) → Sales (conversion) → Strategy (positioning)
Output: Cross-domain solution addressing all three
```

## Engagement Modes

### Mode 1: One-Shot Problem Solving
- Single session, complete deliverable
- No persistent context
- Full strategic document output

### Mode 2: Ongoing Strategic Companion
- Persistent context across sessions
- Progress tracking against recommendations
- Institutional memory of business context
- Regular check-ins and course corrections

## Document Generation

When generating the final strategic document, use the `docx` skill for Word output or `pdf` skill for PDF output. Apply `theme-factory` for professional styling consistent with consulting deliverables.

### Styling Guidelines
- Clean, professional typography
- Strategic use of white space
- Data visualizations where appropriate
- Executive-friendly formatting

## Integration Notes

### Database Integration (Supabase)
Workflow retrieval uses hybrid search:
- Semantic search (pgvector) for conceptual matching
- Keyword search (BM25) for exact term matching
- Combined ranking for optimal results

### Claude API Integration
Problem intake and solution synthesis use Claude for:
- Socratic conversation management
- Cross-domain pattern recognition
- Strategic recommendation generation
- Natural language output

## Usage Examples

### Example 1: Growth Problem
**User**: "We're a B2B SaaS company, $2M ARR, but growth has stalled at 15% YoY. Marketing spend is up 40% but MQLs are flat."

**Classification**:
- Symptom: Marketing spend up, growth flat
- Challenge: Channel efficiency, targeting
- Domains: Marketing → Sales → Strategy
- Intent: Decide

**Workflows Selected**:
1. Customer Segmentation Analysis (diagnostic)
2. Channel Attribution Framework (primary)
3. Sales-Marketing Alignment (synergy)
4. 90-Day Growth Sprint (implementation)

**Output**: 15-page strategic document with cross-domain recommendations

### Example 2: Competitive Threat
**User**: "A well-funded competitor just entered our market with a free tier. How do we respond?"

**Classification**:
- Symptom: New competitor with free offering
- Challenge: Competitive response strategy
- Domains: Strategy → Marketing → Sales
- Intent: Decide

**Workflows Selected**:
1. Competitive Response Framework (primary)
2. Value Proposition Differentiation (synergy)
3. Pricing Strategy Analysis (synergy)
4. Counter-Launch Playbook (implementation)

## Reference Files

- `references/problem-classification.md` - Complete 4-layer taxonomy
- `references/workflow-taxonomy.md` - All 7 domains with workflow categories
- `references/cross-domain-synergy.md` - Synergy matrix and trigger patterns
- `references/document-structure.md` - Full SCQA format specifications
