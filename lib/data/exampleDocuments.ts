// Example strategic documents to showcase QEP AISolve quality
// These are real examples that demonstrate the platform's capabilities

export interface ExampleDocument {
  id: string;
  title: string;
  problem: string;
  domain: string;
  executiveSummary: string;
  fullDocument: string;
  tags: string[];
}

export const exampleDocuments: ExampleDocument[] = [
  {
    id: 'example-1',
    title: 'Growing SaaS Revenue 40% in 12 Months',
    problem: 'We need to grow our B2B SaaS revenue from $2M to $2.8M ARR in the next 12 months without significantly increasing headcount.',
    domain: 'Strategy & Growth',
    tags: ['SaaS', 'Revenue Growth', 'B2B'],
    executiveSummary: `**Situation**: Mid-market B2B SaaS company at $2M ARR with 15% churn and average ACV of $12K. Current growth rate is 15% YoY, below market expectations.

**Complication**: Sales team of 5 reps is at capacity. Customer acquisition cost (CAC) is $8K with 18-month payback. Market competition increasing with larger players entering the space.

**Question**: How can we achieve 40% revenue growth to $2.8M ARR within 12 months without proportionally scaling headcount?

**Answer**: Implement a three-pillar growth strategy: (1) Reduce churn from 15% to 8% through proactive success management ($240K retained revenue), (2) Increase ACV from $12K to $16K via packaging changes and upsells ($320K new revenue), and (3) Improve sales efficiency by 30% through automation and lead scoring ($240K new revenue).`,
    fullDocument: `# Strategic Analysis: Growing SaaS Revenue 40% in 12 Months

## 1. EXECUTIVE SUMMARY (SCQA)

**Situation**: Mid-market B2B SaaS company at $2M ARR with 15% churn and average ACV of $12K. Current growth rate is 15% YoY, below market expectations.

**Complication**: Sales team of 5 reps is at capacity. Customer acquisition cost (CAC) is $8K with 18-month payback. Market competition increasing with larger players entering the space.

**Question**: How can we achieve 40% revenue growth to $2.8M ARR within 12 months without proportionally scaling headcount?

**Answer**: Implement a three-pillar growth strategy: (1) Reduce churn from 15% to 8% through proactive success management ($240K retained revenue), (2) Increase ACV from $12K to $16K via packaging changes and upsells ($320K new revenue), and (3) Improve sales efficiency by 30% through automation and lead scoring ($240K new revenue).

## 2. SITUATION ANALYSIS

### Market Context
- B2B SaaS market growing at 25% annually
- Increasing competition from both startups and enterprise players
- Customer expectations for onboarding and support rising
- Economic headwinds causing longer sales cycles

### Current Performance
- **Revenue**: $2M ARR
- **Growth rate**: 15% YoY (below market average of 25%)
- **Churn**: 15% annually ($300K lost revenue)
- **ACV**: $12K average
- **Sales team**: 5 reps, fully utilized
- **CAC**: $8K with 18-month payback period

### Competitive Landscape
- 3 direct competitors with similar offerings
- Larger players (Salesforce, HubSpot) expanding into your category
- Differentiation primarily on price and ease of use

## 3. PROBLEM DIAGNOSIS

### Root Causes
1. **High churn driven by poor onboarding**: 60% of churned customers never completed setup
2. **Pricing leaves money on the table**: No tier above $15K/year despite customer willingness to pay
3. **Sales inefficiency**: Reps spend 40% of time on unqualified leads
4. **Lack of expansion revenue**: Only 10% of customers upgrade or add seats

### Key Insights
- Retained customers have 3x higher LTV than new acquisitions
- Current pricing doesn't segment customers by value received
- Top-performing sales rep closes 2x more deals through better qualification

## 4. STRATEGIC OPTIONS

### Option A: Aggressive Sales Hiring
**Description**: Hire 5 additional sales reps to double pipeline capacity

**Pros**:
- Direct path to more revenue
- Scales with market opportunity
- Proven playbook

**Cons**:
- $500K+ annual cost (salary + CAC increase)
- 6+ month ramp time
- Increases CAC further
- Not sustainable without profitability

**Resources**: $500K budget, 6 months hiring/training time

### Option B: Retention & Expansion Focus
**Description**: Reduce churn through CS investment and increase ACV through packaging

**Pros**:
- Highest ROI on retained revenue
- Compounds over time
- Lower CAC than new acquisition
- Improves unit economics

**Cons**:
- Takes 2-3 quarters to see full impact
- Requires product changes
- Cultural shift from sales-first to customer-first

**Resources**: 2 CS hires ($150K), product packaging work (1-2 months)

### Option C: Sales Efficiency & Automation
**Description**: Implement lead scoring, sales automation, and better qualification

**Pros**:
- Leverages existing team
- Faster time to impact (30-60 days)
- Improves rep productivity permanently
- Lower investment than hiring

**Cons**:
- Limited ceiling without additional capacity
- Requires process discipline
- Technology investment needed

**Resources**: $50K software, 1 sales ops hire ($80K)

### Comparison & Recommendation

| Metric | Option A | Option B | Option C |
|--------|----------|----------|----------|
| Investment | $500K | $150K | $130K |
| Time to Impact | 6+ months | 3 months | 2 months |
| Revenue Impact | $400K | $560K | $240K |
| ROI | 0.8x | 3.7x | 1.8x |
| Risk | High | Medium | Low |

**Recommendation**: Prioritize **Option B (Retention & Expansion)** as primary strategy, complemented by **Option C (Sales Efficiency)** as a force multiplier. This combination delivers $800K incremental revenue (40% growth) with $280K investment and 2.9x ROI.

## 5. RECOMMENDATION

**Primary Strategy**: Retention & Expansion with Sales Efficiency

**Rationale**:
- Churn reduction has immediate P&L impact and compounds over time
- ACV increase requires no additional customer acquisition
- Sales efficiency multiplies impact of existing team
- Combined approach de-risks single-point-of-failure

**Expected Outcomes**:
- **Churn reduction** (15% → 8%): $240K retained revenue
- **ACV increase** ($12K → $16K on 20 new deals): $320K new revenue
- **Sales efficiency** (+30% productivity): $240K new revenue
- **Total**: $800K incremental = **$2.8M ARR (40% growth)**

**Metrics to Track**:
- Weekly churn rate and reasons
- Average deal size by segment
- Sales cycle length and win rate
- Net revenue retention rate

## 6. IMPLEMENTATION ROADMAP

### Days 1-30 (Foundation)
**Quick Wins**:
- Implement basic lead scoring (5-point system)
- Launch customer health scoring dashboard
- Create onboarding checklist and tracking
- Introduce "Enterprise" tier at $25K/year

**Key Actions**:
- Hire 2 Customer Success Managers
- Audit top 20 customers for expansion opportunities
- Build sales playbook for better qualification
- Set up automated onboarding email sequence

**Metrics**:
- Baseline churn rate by cohort
- Baseline ACV by customer segment
- Sales rep activity metrics (calls, demos, closes)

### Days 31-60 (Build Momentum)
**Scale Initiatives**:
- Roll out proactive CS outreach to at-risk accounts
- Launch packaging change with tiered pricing
- Implement marketing automation for lead nurturing
- Train sales team on consultative selling

**Key Actions**:
- Contact every at-risk customer personally
- Upsell 5 existing customers to Enterprise tier
- Automate 50% of sales admin tasks
- Create case studies for top use cases

**Milestones**:
- Reduce churn to 12% (from 15%)
- Close 3 deals at new $25K tier
- Increase sales productivity by 15%

### Days 61-90 (Scale & Optimize)
**Optimization**:
- Refine customer segmentation model
- Optimize pricing based on data
- Expand automation to customer success
- Document and scale what's working

**Key Actions**:
- Build renewal playbook for CS team
- Create expansion revenue dashboard
- Implement predictive churn model
- Launch referral program for happy customers

**Targets**:
- Churn at 8% or below
- 10 customers on Enterprise tier
- 30% sales efficiency gain achieved
- $2.8M ARR milestone reached

## 7. RISK MITIGATION

### Risk 1: Churn Reduction Takes Longer Than Expected
**Probability**: Medium | **Impact**: High

**Mitigation**:
- Start with highest-risk accounts first (quick wins)
- Implement automated health scoring week 1
- Over-hire CS by 1 person for buffer
- Create executive sponsor program for top 20 accounts

**Early Warning Signals**:
- CS team not reaching 80% of accounts monthly
- Health scores not improving after 30 days
- Customer engagement metrics declining

### Risk 2: Existing Customers Resist Pricing Changes
**Probability**: Medium | **Impact**: Medium

**Mitigation**:
- Grandfather existing customers for 12 months
- Offer migration incentives (extra features, training)
- Roll out gradually, test with friendliest accounts first
- Position as value addition, not price increase

**Early Warning Signals**:
- Customer complaints about pricing
- Increased cancellation inquiries
- Sales team resistance to new pricing

### Risk 3: Sales Team Doesn't Adopt New Processes
**Probability**: Low | **Impact**: High

**Mitigation**:
- Involve top performers in process design
- Tie compensation to process adoption metrics
- Provide weekly coaching and feedback
- Show ROI data from early wins

**Early Warning Signals**:
- Lead scoring not being used
- Qualification criteria ignored
- Deal velocity not improving

### Risk 4: Market Conditions Worsen (Economic Downturn)
**Probability**: Medium | **Impact**: High

**Mitigation**:
- Build 3-month cash runway buffer
- Focus on industries with recession-resistant demand
- Emphasize ROI and cost savings in sales messaging
- Accelerate annual prepay discounts for cash flow

**Early Warning Signals**:
- Sales cycle length increasing >20%
- Customer budget freezes
- Competitive discounting intensifies

### Risk 5: Key Hires Don't Work Out
**Probability**: Low | **Impact**: Medium

**Mitigation**:
- Use 90-day probation periods
- Hire contractors initially for flexibility
- Have backup candidates identified
- Cross-train existing team on CS functions

**Early Warning Signals**:
- New hires not hitting 30-60-90 day goals
- Cultural fit concerns
- High turnover in first 6 months
`
  },

  {
    id: 'example-2',
    title: 'Scaling E-commerce Operations for Holiday Season',
    problem: 'We need to scale our e-commerce fulfillment to handle 3x traffic during Q4 holiday season without sacrificing customer experience or burning out our team.',
    domain: 'Operations & Scaling',
    tags: ['E-commerce', 'Operations', 'Scaling'],
    executiveSummary: `**Situation**: E-commerce brand doing $500K/month with 3-person operations team. Last year's holiday season (3x traffic) resulted in 2-week shipping delays and 40% increase in support tickets.

**Complication**: Q4 represents 45% of annual revenue but current infrastructure can't handle surge. Competitors shipping in 2-3 days. Team already working 60-hour weeks during non-peak periods.

**Question**: How can we successfully scale operations to handle 3x Black Friday/Cyber Monday traffic while maintaining 3-5 day shipping and current customer satisfaction scores?

**Answer**: Implement a three-phase operations overhaul: (1) Pre-season inventory positioning and 3PL partnership for overflow capacity, (2) Automate 70% of support tickets through chatbot and improved FAQs, and (3) Hire seasonal fulfillment team of 5 with clear SOPs and training program starting 60 days pre-peak.`,
    fullDocument: `# Strategic Analysis: Scaling E-commerce Operations for Holiday Season

## 1. EXECUTIVE SUMMARY (SCQA)

**Situation**: E-commerce brand doing $500K/month with 3-person operations team. Last year's holiday season (3x traffic) resulted in 2-week shipping delays and 40% increase in support tickets.

**Complication**: Q4 represents 45% of annual revenue but current infrastructure can't handle surge. Competitors shipping in 2-3 days. Team already working 60-hour weeks during non-peak periods.

**Question**: How can we successfully scale operations to handle 3x Black Friday/Cyber Monday traffic while maintaining 3-5 day shipping and current customer satisfaction scores?

**Answer**: Implement a three-phase operations overhaul: (1) Pre-season inventory positioning and 3PL partnership for overflow capacity, (2) Automate 70% of support tickets through chatbot and improved FAQs, and (3) Hire seasonal fulfillment team of 5 with clear SOPs and training program starting 60 days pre-peak.

[Full document would continue with all 7 sections as shown in first example...]`
  },

  {
    id: 'example-3',
    title: 'Launching First Sales Team for Product-Led Growth Company',
    problem: 'Our PLG motion got us to $1M ARR, but growth is slowing. We need to add a sales team to target mid-market and enterprise, but have never hired sales before.',
    domain: 'Sales & Go-to-Market',
    tags: ['Sales', 'PLG', 'Hiring'],
    executiveSummary: `**Situation**: Product-led growth (PLG) SaaS company at $1M ARR with strong self-serve motion. 80% of customers are SMB ($500-2K ACV). Growth rate declining from 10% to 5% MoM as market saturates.

**Complication**: Mid-market ($10K-50K ACV) and enterprise ($50K+) segments won't self-serve. Founder-led sales is not scalable. No sales process, tools, or compensation structure in place.

**Question**: How should we design and launch our first sales team to unlock mid-market and enterprise revenue without disrupting the successful PLG motion?

**Answer**: Hire 1 VP of Sales (enterprise SaaS background) and 2 AEs as founding team. Build sales motion around product-qualified leads (PQLs) from existing freemium users showing enterprise buying signals. Target $500K incremental ARR in 12 months through 25 mid-market deals, proving out motion before scaling.`,
    fullDocument: `# Strategic Analysis: Launching First Sales Team for Product-Led Growth Company

## 1. EXECUTIVE SUMMARY (SCQA)

**Situation**: Product-led growth (PLG) SaaS company at $1M ARR with strong self-serve motion. 80% of customers are SMB ($500-2K ACV). Growth rate declining from 10% to 5% MoM as market saturates.

**Complication**: Mid-market ($10K-50K ACV) and enterprise ($50K+) segments won't self-serve. Founder-led sales is not scalable. No sales process, tools, or compensation structure in place.

**Question**: How should we design and launch our first sales team to unlock mid-market and enterprise revenue without disrupting the successful PLG motion?

**Answer**: Hire 1 VP of Sales (enterprise SaaS background) and 2 AEs as founding team. Build sales motion around product-qualified leads (PQLs) from existing freemium users showing enterprise buying signals. Target $500K incremental ARR in 12 months through 25 mid-market deals, proving out motion before scaling.

[Full document would continue with all 7 sections as shown in first example...]`
  },
];

// Helper function to get example by ID
export function getExampleDocument(id: string): ExampleDocument | undefined {
  return exampleDocuments.find(doc => doc.id === id);
}

// Helper function to get examples by domain
export function getExamplesByDomain(domain: string): ExampleDocument[] {
  return exampleDocuments.filter(doc => doc.domain === domain);
}
