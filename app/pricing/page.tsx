import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import PricingClient from './PricingClient';

export default async function PricingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch user data only if logged in
  const { data: userData } = user
    ? await supabase.from('users').select('*').eq('id', user.id).single()
    : { data: null };

  // Fetch payment stats for segment anchors (public data)
  const { data: segments } = await supabase
    .from('payment_stats')
    .select('*')
    .order('segment');

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PricingClient
        user={user}
        userData={userData}
        segments={segments || []}
      />
    </Suspense>
  );
}
