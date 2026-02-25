/**
 * Stripe Payment Link redirect utility for QEP AISolve.
 *
 * We use Stripe Payment Links (not the Checkout Session API).
 * The user's Supabase ID is appended as `client_reference_id` so the
 * webhook can identify which user completed the purchase.
 */

import { TIERS, TierKey } from '@/lib/tiers';

/**
 * Returns a fully-qualified Stripe Payment Link URL with `client_reference_id`
 * appended as a query parameter, or null if the tier has no payment link
 * (i.e. the free tier).
 *
 * Usage on the pricing page:
 *   const url = getCheckoutUrl('professional', userId);
 *   if (url) window.location.href = url;
 */
export function getCheckoutUrl(tier: TierKey, userId: string): string | null {
  const config = TIERS[tier];
  if (!config.payment_link) return null;

  const url = new URL(config.payment_link);
  url.searchParams.set('client_reference_id', userId);
  return url.toString();
}
