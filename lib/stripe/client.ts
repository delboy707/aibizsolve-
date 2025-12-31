import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Helper to get or create Stripe customer
export async function getOrCreateStripeCustomer(userId: string, email: string) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  // Check if user already has a Stripe customer ID
  const { data: userData } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (userData?.stripe_customer_id) {
    return userData.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      supabase_user_id: userId,
    },
  });

  // Save customer ID to database
  await supabase
    .from('users')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  return customer.id;
}

// Calculate payment tier based on amount vs average
export function calculatePaymentTier(
  paymentAmount: number,
  segmentAverage: number
): 'trial' | 'below_average' | 'average' | 'above_average' {
  if (paymentAmount < segmentAverage * 0.9) {
    return 'below_average';
  } else if (paymentAmount >= segmentAverage * 0.9 && paymentAmount < segmentAverage * 1.1) {
    return 'average';
  } else {
    return 'above_average';
  }
}

// Determine user segment based on heuristics
export function determineUserSegment(email: string): 'solopreneur' | 'small_business' | 'manager' | 'ceo' {
  // Simple heuristic - can be improved with user input
  // For now, default to solopreneur
  // In production, you'd ask the user during onboarding
  return 'solopreneur';
}
