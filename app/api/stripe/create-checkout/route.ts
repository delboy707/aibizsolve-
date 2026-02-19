import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, getOrCreateStripeCustomer } from '@/lib/stripe/client';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, segment } = await req.json();

    const VALID_SEGMENTS = ['solopreneur', 'small_business', 'manager', 'ceo'];
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount < 10 || parsedAmount > 10000) {
      return NextResponse.json(
        { error: 'Amount must be between $10 and $10,000' },
        { status: 400 }
      );
    }

    if (segment && !VALID_SEGMENTS.includes(segment)) {
      return NextResponse.json(
        { error: 'Invalid segment' },
        { status: 400 }
      );
    }

    const validatedAmount = Math.round(parsedAmount);

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(user.id, user.email || '');

    // Create Stripe Checkout Session
    const session = await stripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'QEP AISolve Subscription',
              description: 'Unlimited strategic consultations with AI-powered insights',
            },
            recurring: {
              interval: 'month',
            },
            unit_amount: validatedAmount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        segment: segment || 'solopreneur',
        amount: validatedAmount.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
