import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PricingClient from './PricingClient';
import type { TierKey } from '@/lib/tiers';

export default async function PricingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Fetch user data
  const { data: userData } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  // Fetch Founding Leader remaining slots
  const { data: flConfig } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'founding_leader')
    .single();

  const flCount = (flConfig?.value as { count: number; cap: number })?.count ?? 0;
  const flCap = (flConfig?.value as { count: number; cap: number })?.cap ?? 100;
  const foundingLeaderRemaining = Math.max(0, flCap - flCount);

  const currentTier = ((userData?.subscription_tier as string) || 'free') as TierKey;

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PricingClient
        userId={user.id}
        currentTier={currentTier}
        foundingLeaderRemaining={foundingLeaderRemaining}
      />
    </Suspense>
  );
}
