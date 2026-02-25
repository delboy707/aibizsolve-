import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PricingClient from './PricingClient';

export default async function PricingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth?redirect=/pricing');
  }

  // Fetch the Founding Leader slot counter
  const { data: configRow } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'founding_leader')
    .single();

  const foundingLeaderCount: number = configRow?.value?.count ?? 0;
  const foundingLeaderCap: number = configRow?.value?.cap ?? 100;
  const foundingLeaderRemaining = Math.max(0, foundingLeaderCap - foundingLeaderCount);

  // Fetch user's current tier so we can highlight it
  const { data: profile } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  const currentTier = profile?.subscription_tier ?? 'free';

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PricingClient
        userId={user.id}
        currentTier={currentTier}
        foundingLeaderRemaining={foundingLeaderRemaining}
      />
    </Suspense>
  );
}
