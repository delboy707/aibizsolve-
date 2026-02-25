import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export const stripe = (): Stripe => {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }
  return stripeClient;
};

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
  const customer = await stripe().customers.create({
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

