import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PricingClient from './PricingClient';

export default async function PricingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Fetch user data
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch payment stats for segment anchors
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
