import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';

// Map subscription price (in cents) to the new subscription_tier values.
// These match the three fixed tiers from the revised pricing model.
const PRICE_TO_TIER: Record<number, string> = {
  // Monthly
  2900: 'starter',           // $29/month
  7900: 'professional',      // $79/month
  14900: 'founding_leader',  // $149/month
  // Annual
  26100: 'starter',          // $261/year
  71100: 'professional',     // $711/year
  134100: 'founding_leader', // $1,341/year
};

function getTierFromAmount(amountInCents: number): string {
  return PRICE_TO_TIER[amountInCents] || 'starter';
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
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // client_reference_id contains the Supabase user ID
        // (set by our Payment Link redirect URL or Checkout Session)
        const userId = session.client_reference_id || session.metadata?.user_id;
        if (!userId) {
          console.error('No client_reference_id or user_id on checkout session');
          break;
        }

        // Retrieve the subscription to get the price/amount
        const subscriptionId = session.subscription as string;
        let tier = 'starter';

        if (subscriptionId) {
          const subscription = await stripe().subscriptions.retrieve(subscriptionId);
          const amount = subscription.items.data[0]?.price?.unit_amount || 0;
          tier = getTierFromAmount(amount);
        }

        // For founding_leader, atomically claim a slot
        if (tier === 'founding_leader') {
          const { data: slotClaimed } = await supabase.rpc('claim_founding_leader_slot');
          if (!slotClaimed) {
            tier = 'professional';
            console.warn(`Founding Leader slot unavailable for user ${userId}, downgraded to professional`);
          }
        }

        await supabase.from('users').update({
          subscription_tier: tier,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscriptionId,
          reports_used_this_cycle: 0,
          billing_cycle_start: new Date().toISOString(),
        }).eq('id', userId);

        console.log(`checkout.session.completed for user ${userId}: tier=${tier}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!user) {
          console.error('User not found for customer:', customerId);
          break;
        }

        if (subscription.status === 'active') {
          const amount = subscription.items.data[0]?.price?.unit_amount || 0;
          const tier = getTierFromAmount(amount);

          await supabase.from('users').update({
            subscription_tier: tier,
            reports_used_this_cycle: 0,
            billing_cycle_start: new Date().toISOString(),
          }).eq('id', user.id);

          console.log(`subscription.updated for user ${user.id}: tier=${tier}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (user) {
          await supabase.from('users').update({
            subscription_tier: 'free',
            stripe_subscription_id: null,
          }).eq('id', user.id);

          console.log(`subscription.deleted for user ${user.id}: downgraded to free`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Payment succeeded for invoice ${invoice.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.error(`Payment failed for invoice ${invoice.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
