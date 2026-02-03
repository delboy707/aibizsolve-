/**
 * Cross-Domain Synergy Detection
 *
 * Detects when business problems span multiple domains and identifies
 * relevant secondary domains based on synergy patterns and trigger keywords.
 */

export type Domain = 'strategy' | 'marketing' | 'sales' | 'operations' | 'innovation' | 'hr' | 'finance';

// Synergy Matrix: Which domains naturally connect
const SYNERGY_MATRIX: Record<Domain, Domain[]> = {
  strategy: ['marketing', 'finance', 'innovation'],
  marketing: ['sales', 'strategy', 'operations'],
  sales: ['marketing', 'operations', 'finance'],
  operations: ['finance', 'hr', 'sales'],
  innovation: ['strategy', 'marketing', 'operations'],
  hr: ['operations', 'finance', 'strategy'],
  finance: ['operations', 'strategy', 'sales'],
};

// Keyword triggers for detecting cross-domain patterns
const SYNERGY_TRIGGERS: { keywords: string[]; domains: Domain[] }[] = [
  { keywords: ['customers', 'leads', 'conversion', 'funnel', 'pipeline'], domains: ['marketing', 'sales'] },
  { keywords: ['competitors', 'market share', 'positioning', 'differentiation'], domains: ['strategy', 'marketing'] },
  { keywords: ['costs', 'efficiency', 'delivery', 'process', 'bottleneck'], domains: ['operations', 'finance'] },
  { keywords: ['hiring', 'team', 'capacity', 'turnover', 'talent'], domains: ['hr', 'operations'] },
  { keywords: ['new product', 'innovation', 'r&d', 'launch', 'prototype'], domains: ['innovation', 'strategy'] },
  { keywords: ['pricing', 'revenue', 'margins', 'profit', 'discount'], domains: ['sales', 'finance'] },
  { keywords: ['growth', 'scale', 'expand', 'acquisition'], domains: ['strategy', 'marketing', 'sales', 'hr'] },
  { keywords: ['brand', 'awareness', 'reputation', 'perception'], domains: ['marketing', 'strategy'] },
  { keywords: ['retention', 'churn', 'loyalty', 'lifetime value'], domains: ['marketing', 'sales', 'operations'] },
  { keywords: ['budget', 'investment', 'roi', 'cash flow'], domains: ['finance', 'strategy'] },
];

// Multi-domain problem patterns with recommended workflow sequences
export const PROBLEM_PATTERNS: {
  name: string;
  signal: string;
  domains: Domain[];
  workflowSequence: { domain: Domain; focus: string }[];
}[] = [
  {
    name: 'Growth Problem',
    signal: 'We need to grow faster',
    domains: ['strategy', 'marketing', 'sales', 'hr'],
    workflowSequence: [
      { domain: 'strategy', focus: 'Growth lever identification' },
      { domain: 'marketing', focus: 'Demand generation assessment' },
      { domain: 'sales', focus: 'Capacity and conversion analysis' },
      { domain: 'hr', focus: 'Scaling plan if capacity constrained' },
    ],
  },
  {
    name: 'Competitive Threat',
    signal: 'Competitor is taking share',
    domains: ['strategy', 'marketing', 'sales'],
    workflowSequence: [
      { domain: 'strategy', focus: 'Competitive response framework' },
      { domain: 'marketing', focus: 'Differentiation and positioning' },
      { domain: 'sales', focus: 'Win/loss analysis and counter-tactics' },
    ],
  },
  {
    name: 'Efficiency Problem',
    signal: 'Costs are too high or delivery delays',
    domains: ['operations', 'finance', 'hr'],
    workflowSequence: [
      { domain: 'operations', focus: 'Process optimization' },
      { domain: 'finance', focus: 'Cost structure analysis' },
      { domain: 'hr', focus: 'Capacity and skills assessment' },
    ],
  },
  {
    name: 'Innovation Challenge',
    signal: 'Need new products or market changing',
    domains: ['innovation', 'strategy', 'marketing'],
    workflowSequence: [
      { domain: 'innovation', focus: 'Opportunity assessment' },
      { domain: 'strategy', focus: 'Portfolio fit analysis' },
      { domain: 'marketing', focus: 'Go-to-market planning' },
    ],
  },
];

/**
 * Detect synergy domains based on primary domain
 */
export function getSynergyDomains(primaryDomain: Domain): Domain[] {
  return SYNERGY_MATRIX[primaryDomain] || [];
}

/**
 * Detect additional domains based on keyword triggers in the problem text
 */
export function detectTriggeredDomains(problemText: string): Domain[] {
  const lowerText = problemText.toLowerCase();
  const triggeredDomains = new Set<Domain>();

  for (const trigger of SYNERGY_TRIGGERS) {
    const hasKeyword = trigger.keywords.some(keyword => lowerText.includes(keyword));
    if (hasKeyword) {
      trigger.domains.forEach(domain => triggeredDomains.add(domain));
    }
  }

  return Array.from(triggeredDomains);
}

/**
 * Match a problem pattern based on signals in the text
 */
export function matchProblemPattern(problemText: string): typeof PROBLEM_PATTERNS[0] | null {
  const lowerText = problemText.toLowerCase();

  // Check for growth signals
  if (lowerText.includes('grow') || lowerText.includes('scale') || lowerText.includes('expand')) {
    return PROBLEM_PATTERNS.find(p => p.name === 'Growth Problem') || null;
  }

  // Check for competitive signals
  if (lowerText.includes('competitor') || lowerText.includes('market share') || lowerText.includes('losing to')) {
    return PROBLEM_PATTERNS.find(p => p.name === 'Competitive Threat') || null;
  }

  // Check for efficiency signals
  if (lowerText.includes('cost') || lowerText.includes('efficiency') || lowerText.includes('too slow') || lowerText.includes('delivery')) {
    return PROBLEM_PATTERNS.find(p => p.name === 'Efficiency Problem') || null;
  }

  // Check for innovation signals
  if (lowerText.includes('new product') || lowerText.includes('innovation') || lowerText.includes('market changing')) {
    return PROBLEM_PATTERNS.find(p => p.name === 'Innovation Challenge') || null;
  }

  return null;
}

/**
 * Get comprehensive domain recommendations for a problem
 * Returns primary domain, synergy domains, and triggered domains
 */
export function analyzeCrossDomainSynergy(
  primaryDomain: Domain,
  problemText: string
): {
  primaryDomain: Domain;
  synergyDomains: Domain[];
  triggeredDomains: Domain[];
  allDomains: Domain[];
  matchedPattern: typeof PROBLEM_PATTERNS[0] | null;
  recommendation: string;
} {
  const synergyDomains = getSynergyDomains(primaryDomain);
  const triggeredDomains = detectTriggeredDomains(problemText);
  const matchedPattern = matchProblemPattern(problemText);

  // Combine all domains, prioritizing: primary > pattern > triggered > synergy
  const allDomainsSet = new Set<Domain>([primaryDomain]);

  if (matchedPattern) {
    matchedPattern.domains.forEach(d => allDomainsSet.add(d));
  }
  triggeredDomains.forEach(d => allDomainsSet.add(d));
  synergyDomains.forEach(d => allDomainsSet.add(d));

  const allDomains = Array.from(allDomainsSet);

  // Generate recommendation text
  let recommendation = `Primary focus: ${primaryDomain}`;

  if (matchedPattern) {
    recommendation += `\n\nDetected pattern: ${matchedPattern.name}`;
    recommendation += `\nRecommended workflow sequence:`;
    matchedPattern.workflowSequence.forEach((step, i) => {
      recommendation += `\n  ${i + 1}. ${step.domain}: ${step.focus}`;
    });
  } else if (allDomains.length > 1) {
    recommendation += `\n\nThis problem spans multiple domains: ${allDomains.join(', ')}`;
    recommendation += `\nConsider pulling workflows from each for comprehensive analysis.`;
  }

  return {
    primaryDomain,
    synergyDomains,
    triggeredDomains,
    allDomains,
    matchedPattern,
    recommendation,
  };
}

export default {
  getSynergyDomains,
  detectTriggeredDomains,
  matchProblemPattern,
  analyzeCrossDomainSynergy,
  SYNERGY_MATRIX,
  SYNERGY_TRIGGERS,
  PROBLEM_PATTERNS,
};
