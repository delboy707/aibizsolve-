import { TIERS, TierKey } from '@/lib/tiers';

/**
 * Returns a Stripe Payment Link URL with the user's Supabase ID appended as
 * client_reference_id so the webhook can identify which user paid.
 *
 * Returns null for the free tier (no payment link).
 */
export function getCheckoutUrl(
  tier: TierKey,
  userId: string,
  interval: 'monthly' | 'annual' = 'monthly',
): string | null {
  const config = TIERS[tier];
  const link =
    interval === 'annual' ? config.annual_payment_link : config.payment_link;
  if (!link) return null;

  const url = new URL(link);
  url.searchParams.set('client_reference_id', userId);
  return url.toString();
}
