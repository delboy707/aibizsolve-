import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OnboardingClient from './OnboardingClient';

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware handles unauthenticated users, but guard here too
  if (!user) {
    redirect('/auth?redirect=/onboarding');
  }

  // If they've already generated their free report, skip onboarding
  const { data: profile } = await supabase
    .from('users')
    .select('free_report_used, subscription_tier')
    .eq('id', user.id)
    .single();

  const hasUsedFreeReport = profile?.free_report_used === true;
  const isPaidUser = profile?.subscription_tier &&
    profile.subscription_tier !== 'free';

  // Paid users don't need onboarding — send to chat
  if (isPaidUser) {
    redirect('/chat');
  }

  // Free users who already used their report — send to upgrade
  if (hasUsedFreeReport) {
    redirect('/upgrade');
  }

  return <OnboardingClient userId={user.id} />;
}
