/**
 * Tier definitions and access-control helpers for QEP AISolve.
 *
 * Single source of truth for what each subscription tier can do.
 * Import these helpers from API routes and server components — never
 * enforce access rules on the client side.
 */

export const TIERS = {
  free: {
    name: 'Free',
    price: 0,
    /** Free users get exactly ONE report ever, not per month. */
    reports_per_month: 1,
    allowed_domains: [
      'strategy',
      'marketing',
      'sales',
      'innovation',
      'operations',
      'hr',
      'finance',
    ],
    /**
     * 'teased'  → show headings, blur body, prompt upgrade
     * 'none'    → compact upgrade banner only
     * 'full'    → full Alchemy content rendered
     */
    alchemy_access: 'teased' as const,
    payment_link: null,
    description: 'One free strategic report',
  },

  starter: {
    name: 'Starter',
    price: 29,
    payment_link: process.env.NEXT_PUBLIC_STRIPE_LINK_STARTER!,
    reports_per_month: 3,
    allowed_domains: ['strategy'],
    alchemy_access: 'none' as const,
    description: '3 reports/month · Strategy module',
  },

  professional: {
    name: 'Professional',
    price: 79,
    payment_link: process.env.NEXT_PUBLIC_STRIPE_LINK_PROFESSIONAL!,
    reports_per_month: Infinity,
    allowed_domains: ['strategy', 'marketing', 'sales'],
    alchemy_access: 'full' as const,
    description: 'Unlimited reports · Strategy + Marketing + Sales · Behavioural Alchemy',
  },

  founding_leader: {
    name: 'Founding Leader',
    price: 149,
    payment_link: process.env.NEXT_PUBLIC_STRIPE_LINK_FOUNDING_LEADER!,
    reports_per_month: Infinity,
    allowed_domains: [
      'strategy',
      'marketing',
      'sales',
      'innovation',
      'operations',
      'hr',
      'finance',
    ],
    alchemy_access: 'full' as const,
    description: 'Everything + future modules free forever · Limited to 100 founders',
  },
} as const;

export type TierKey = keyof typeof TIERS;

/** Labels shown in UI badges, sorted cheapest → most expensive. */
export const TIER_ORDER: TierKey[] = [
  'free',
  'starter',
  'professional',
  'founding_leader',
];

/**
 * Returns true if the user is permitted to generate a new report.
 *
 * Free users may only generate one report ever (tracked via free_report_used).
 * Paid users are limited to reports_per_month per billing cycle.
 */
export function canGenerateReport(
  tier: TierKey,
  reportsUsed: number,
  freeReportUsed: boolean,
): boolean {
  if (tier === 'free') return !freeReportUsed;
  const limit = TIERS[tier].reports_per_month;
  return reportsUsed < limit;
}

/**
 * Returns true if the user's tier grants access to the given domain.
 * Domain strings must match the values stored in the workflows table.
 */
export function canAccessDomain(tier: TierKey, domain: string): boolean {
  return (TIERS[tier].allowed_domains as readonly string[]).includes(domain);
}

/** Returns the alchemy display mode for a given tier. */
export function getAlchemyAccess(tier: TierKey): 'none' | 'teased' | 'full' {
  return TIERS[tier].alchemy_access;
}

/**
 * Returns a human-readable message explaining why a domain is locked,
 * and which tier unlocks it.
 */
export function getDomainUpgradeMessage(
  tier: TierKey,
  domain: string,
): string | null {
  if (canAccessDomain(tier, domain)) return null;

  const domainLabel = domain.charAt(0).toUpperCase() + domain.slice(1);

  if (['innovation', 'operations', 'hr', 'finance'].includes(domain)) {
    return `${domainLabel} analysis is included in the Founding Leader plan — launching soon.`;
  }

  if (['marketing', 'sales'].includes(domain)) {
    return `${domainLabel} analysis is available on the Professional plan ($79/month).`;
  }

  return `${domainLabel} analysis requires an upgrade. See pricing for details.`;
}
