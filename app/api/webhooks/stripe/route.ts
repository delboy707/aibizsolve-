import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';

// Map Stripe price amount (in cents) to subscription tier.
// Keep in sync with the Payment Link prices configured in Stripe Dashboard.
const PRICE_TO_TIER: Record<number, string> = {
  2900: 'starter',          // $29/month
  7900: 'professional',     // $79/month
  14900: 'founding_leader', // $149/month
};

function getTierFromAmount(amountInCents: number): string {
  return PRICE_TO_TIER[amountInCents] ?? 'starter';
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createClient();

  try {
    switch (event.type) {
      // ── New subscription via Payment Link ──────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // client_reference_id is the Supabase user ID appended by getCheckoutUrl()
        const userId = session.client_reference_id;
        if (!userId) {
          console.error('checkout.session.completed: no client_reference_id');
          break;
        }

        const subscriptionId = session.subscription as string;
        let tier = 'starter';

        if (subscriptionId) {
          const subscription = await stripe().subscriptions.retrieve(subscriptionId);
          const amount = subscription.items.data[0]?.price?.unit_amount ?? 0;
          tier = getTierFromAmount(amount);
        }

        // For Founding Leader, atomically claim a slot
        if (tier === 'founding_leader') {
          const { data: slotClaimed } = await supabase.rpc('claim_founding_leader_slot');
          if (!slotClaimed) {
            // Cap reached — downgrade to Professional
            tier = 'professional';
            console.warn(
              `Founding Leader cap reached for user ${userId} — downgraded to professional`,
            );
          }
        }

        await supabase
          .from('users')
          .update({
            subscription_tier: tier,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId ?? null,
            reports_used_this_cycle: 0,
            billing_cycle_start: new Date().toISOString(),
          })
          .eq('id', userId);

        console.log(`checkout.session.completed: user ${userId} → tier ${tier}`);
        break;
      }

      // ── Subscription renewed or plan changed ───────────────────────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!user) {
          console.error(`customer.subscription.updated: no user for customer ${customerId}`);
          break;
        }

        if (subscription.status === 'active') {
          const amount = subscription.items.data[0]?.price?.unit_amount ?? 0;
          const tier = getTierFromAmount(amount);

          await supabase
            .from('users')
            .update({
              subscription_tier: tier,
              stripe_subscription_id: subscription.id,
              reports_used_this_cycle: 0,
              billing_cycle_start: new Date().toISOString(),
            })
            .eq('id', user.id);

          console.log(`customer.subscription.updated: user ${user.id} → tier ${tier}`);
        }
        break;
      }

      // ── Subscription cancelled ─────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (user) {
          await supabase
            .from('users')
            .update({
              subscription_tier: 'free',
              stripe_subscription_id: null,
            })
            .eq('id', user.id);

          console.log(`customer.subscription.deleted: user ${user.id} → free`);
        }
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
