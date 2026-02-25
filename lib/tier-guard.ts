/**
 * Server-side tier context helper for QEP AISolve.
 *
 * Call getTierContext() at the top of any Server Component or API route
 * that needs to enforce subscription access rules.
 *
 * Returns null when the user is not authenticated.
 */

import { createClient } from '@/lib/supabase/server';
import {
  TIERS,
  canGenerateReport,
  canAccessDomain,
  getAlchemyAccess,
  getDomainUpgradeMessage,
} from '@/lib/tiers';
import type { TierKey } from '@/lib/tiers';

export interface TierContext {
  userId: string;
  tier: TierKey;
  tierConfig: (typeof TIERS)[TierKey];
  reportsUsed: number;
  freeReportUsed: boolean;
  /** True if the user may generate another report right now. */
  canGenerate: boolean;
  /** Alchemy display mode for this tier. */
  alchemyAccess: 'none' | 'teased' | 'full';
  /** Returns true if the user's tier grants access to the given domain. */
  canAccessDomain: (domain: string) => boolean;
  /**
   * Returns a user-facing upgrade message if the domain is locked,
   * or null if the domain is accessible.
   */
  getDomainUpgradeMessage: (domain: string) => string | null;
}

/**
 * Fetches the current user's subscription tier and derived access flags.
 *
 * Also resets the monthly report counter if the billing cycle has elapsed
 * (delegates to the reset_report_count_if_needed database function).
 *
 * @returns TierContext, or null if the user is unauthenticated.
 */
export async function getTierContext(): Promise<TierContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select(
      'subscription_tier, reports_used_this_cycle, billing_cycle_start, free_report_used',
    )
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  // Reset report count if the billing cycle has elapsed (no-op if < 30 days)
  await supabase.rpc('reset_report_count_if_needed', { user_uuid: user.id });

  const tier = ((profile.subscription_tier as string) || 'free') as TierKey;
  const reportsUsed = (profile.reports_used_this_cycle as number) || 0;
  const freeReportUsed = (profile.free_report_used as boolean) || false;

  return {
    userId: user.id,
    tier,
    tierConfig: TIERS[tier],
    reportsUsed,
    freeReportUsed,
    canGenerate: canGenerateReport(tier, reportsUsed, freeReportUsed),
    alchemyAccess: getAlchemyAccess(tier),
    canAccessDomain: (domain: string) => canAccessDomain(tier, domain),
    getDomainUpgradeMessage: (domain: string) =>
      getDomainUpgradeMessage(tier, domain),
  };
}
