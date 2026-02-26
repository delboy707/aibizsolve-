import { TIERS, TierKey } from '@/lib/tiers';

/**
 * Returns a Stripe Payment Link URL with the user's Supabase ID appended as
 * client_reference_id so the webhook can identify which user paid.
 *
 * Returns null for the free tier (no payment link).
 */
export function getCheckoutUrl(tier: TierKey, userId: string): string | null {
  const config = TIERS[tier];
  if (!config.payment_link) return null;

  const url = new URL(config.payment_link);
  url.searchParams.set('client_reference_id', userId);
  return url.toString();
}
