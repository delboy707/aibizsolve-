import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { DecisionsList } from '@/components/dashboard/DecisionsList';
import { UsageAnalytics } from '@/components/dashboard/UsageAnalytics';
import { TIERS, canGenerateReport } from '@/lib/tiers';
import type { TierKey } from '@/lib/tiers';
import { stripe } from '@/lib/stripe/client';

const TIER_BADGE: Record<TierKey, { label: string; className: string }> = {
  free: { label: 'Free', className: 'bg-gray-100 text-gray-600' },
  starter: { label: 'Starter', className: 'bg-blue-100 text-blue-700' },
  professional: { label: 'Pro', className: 'bg-primary-100 text-primary-700' },
  founding_leader: { label: 'Founder', className: 'bg-amber-100 text-amber-700' },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const { upgraded } = await searchParams;
  const showUpgradedBanner = upgraded === 'true';
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Fetch user data with tier fields
  const { data: userData } = await supabase
    .from('users')
    .select('subscription_tier, reports_used_this_cycle, free_report_used, stripe_customer_id')
    .eq('id', user.id)
    .single();

  const subscriptionTier = ((userData?.subscription_tier as string) || 'free') as TierKey;
  const reportsUsed = userData?.reports_used_this_cycle ?? 0;
  const freeReportUsed = userData?.free_report_used ?? false;
  const stripeCustomerId = userData?.stripe_customer_id as string | null;
  const isPaidUser = subscriptionTier !== 'free';

  const canGenerate = canGenerateReport(subscriptionTier, reportsUsed, freeReportUsed);

  // Route "New Report" based on tier/usage
  let newReportHref: string;
  if (subscriptionTier === 'free') {
    newReportHref = freeReportUsed ? '/upgrade' : '/onboarding';
  } else {
    newReportHref = '/chat';
  }

  // Fetch user's decisions
  const { data: decisions } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Analytics
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const analytics = {
    total: decisions?.length || 0,
    thisMonth: decisions?.filter(d => new Date(d.created_at) >= startOfMonth).length || 0,
    completed: decisions?.filter(d => d.status === 'complete').length || 0,
    inProgress: decisions?.filter(d => ['intake', 'clarifying', 'processing'].includes(d.status)).length || 0,
    archived: decisions?.filter(d => d.status === 'archived').length || 0,
  };

  const badge = TIER_BADGE[subscriptionTier];

  const handleSignOut = async () => {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/');
  };

  const handleManageSubscription = async () => {
    'use server';
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { redirect('/auth'); return; }

    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!userData?.stripe_customer_id) { redirect('/pricing'); return; }

    const session = await stripe().billingPortal.sessions.create({
      customer: userData.stripe_customer_id as string,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    redirect(session.url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <span className="font-semibold text-gray-900 text-lg">QEP AISolve</span>
            </Link>

            {/* Nav */}
            <div className="flex items-center gap-4">
              <Link
                href={newReportHref}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                + New Report
              </Link>

              {!isPaidUser && (
                <Link
                  href="/pricing"
                  className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Upgrade
                </Link>
              )}

              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                {/* Tier badge */}
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.className}`}>
                  {badge.label}
                </span>

                <span className="text-sm text-gray-600 hidden sm:block">{user.email}</span>

                {isPaidUser && stripeCustomerId ? (
                  <form action={handleManageSubscription}>
                    <button
                      type="submit"
                      className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                      Manage Plan
                    </button>
                  </form>
                ) : (
                  <Link
                    href="/pricing"
                    className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    Pricing
                  </Link>
                )}

                <form action={handleSignOut}>
                  <button
                    type="submit"
                    className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upgrade success banner */}
        {showUpgradedBanner && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <span className="text-green-600 text-xl">✓</span>
            <div className="flex-1">
              <p className="font-semibold text-green-900 text-sm">You&apos;re now on the {TIERS[subscriptionTier].name} plan</p>
              <p className="text-sm text-green-800">Your new limits and features are active immediately.</p>
            </div>
          </div>
        )}

        {/* Tier + Usage Banner */}
        <UsageAnalytics
          tier={subscriptionTier}
          reportsUsed={reportsUsed}
          freeReportUsed={freeReportUsed}
          canGenerate={canGenerate}
          analytics={analytics}
        />

        {/* Reports header + CTA */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Your Reports</h2>
          <Link
            href={canGenerate ? newReportHref : (isPaidUser ? newReportHref : '/upgrade')}
            className={`inline-flex items-center px-5 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors ${
              canGenerate
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed pointer-events-none'
            }`}
          >
            + New Report
          </Link>
        </div>

        {/* Decisions List */}
        {decisions && decisions.length > 0 ? (
          <DecisionsList decisions={decisions} />
        ) : (
          <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
            <p className="text-gray-500 text-lg mb-2">No reports yet</p>
            <p className="text-sm text-gray-400 mb-6">
              {subscriptionTier === 'free' && !freeReportUsed
                ? 'Generate your first free strategic report — no credit card required.'
                : 'Start a new consultation to get your strategic analysis.'}
            </p>
            <Link
              href={newReportHref}
              className="inline-block bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              {subscriptionTier === 'free' && !freeReportUsed
                ? 'Generate My Free Report →'
                : '+ New Report'}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
