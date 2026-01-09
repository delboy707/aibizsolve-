import { NextRequest, NextResponse } from 'next/server';
import { stripe, calculatePaymentTier } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createClient();

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get user from customer ID
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('stripe_customer_id', customerId)
          .single();

        if (!user) {
          console.error('User not found for customer:', customerId);
          break;
        }

        // Get payment amount from subscription
        const amount = subscription.items.data[0]?.price?.unit_amount || 0;
        const monthlyPayment = amount / 100; // Convert cents to dollars

        // Get segment from metadata
        const segment = subscription.metadata.segment || 'solopreneur';

        // Get segment average
        const { data: segmentData } = await supabase
          .from('payment_stats')
          .select('average_payment')
          .eq('segment', segment)
          .single();

        const averagePayment = segmentData?.average_payment || 50;

        // Calculate payment tier
        const paymentTier = calculatePaymentTier(monthlyPayment, averagePayment);

        // Update user
        await supabase
          .from('users')
          .update({
            monthly_payment: monthlyPayment,
            payment_tier: paymentTier,
            user_segment: segment,
            stripe_subscription_id: subscription.id,
          })
          .eq('id', user.id);

        // Update payment stats
        await updatePaymentStats(supabase, segment, monthlyPayment);

        console.log(`Subscription ${event.type} for user ${user.id}: $${monthlyPayment}/month, tier: ${paymentTier}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get user from customer ID
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (user) {
          // Reset to trial (or handle cancellation differently)
          await supabase
            .from('users')
            .update({
              monthly_payment: 0,
              payment_tier: 'trial',
              stripe_subscription_id: null,
            })
            .eq('id', user.id);

          console.log(`Subscription cancelled for user ${user.id}`);
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
        // Could send an email notification here
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

// Helper function to update payment stats
async function updatePaymentStats(
  supabase: any,
  segment: string,
  newPayment: number
) {
  // Get current stats
  const { data: currentStats } = await supabase
    .from('payment_stats')
    .select('*')
    .eq('segment', segment)
    .single();

  if (!currentStats) return;

  const currentCount = currentStats.payment_count || 0;
  const currentAverage = currentStats.average_payment || 0;

  // Calculate new average
  const newCount = currentCount + 1;
  const newAverage = ((currentAverage * currentCount) + newPayment) / newCount;

  // Update stats
  await supabase
    .from('payment_stats')
    .update({
      average_payment: newAverage,
      payment_count: newCount,
      updated_at: new Date().toISOString(),
    })
    .eq('segment', segment);
}
