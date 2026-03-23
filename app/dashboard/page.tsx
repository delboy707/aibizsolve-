import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { DecisionsList } from '@/components/dashboard/DecisionsList';
import { DomainGrid } from '@/components/dashboard/DomainGrid';
import { ManageSubscriptionButton } from '@/components/dashboard/ManageSubscriptionButton';
import { TIERS } from '@/lib/tiers';
import type { TierKey } from '@/lib/tiers';
import type { Decision, Domain } from '@/types';

const TIER_BADGES: Record<string, { label: string; className: string }> = {
  free: { label: 'FREE', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  starter: { label: 'STARTER', className: 'bg-primary-50 text-primary-700 border-primary-200' },
  professional: { label: 'PRO', className: 'bg-primary-600 text-white border-primary-700' },
  founding_leader: { label: 'FOUNDER', className: 'bg-amber-50 text-amber-700 border-amber-300' },
};

export default async function DashboardPage() {
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

  // Fetch user's decisions
  const { data: decisions } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch documents to check alchemy status
  const decisionIds = (decisions || []).map((d: Decision) => d.id);
  const { data: documents } = decisionIds.length > 0
    ? await supabase
        .from('documents')
        .select('decision_id, alchemy_content')
        .in('decision_id', decisionIds)
    : { data: [] };

  const alchemyByDecision = new Set(
    (documents || [])
      .filter((doc: { decision_id: string; alchemy_content: string | null }) => doc.alchemy_content)
      .map((doc: { decision_id: string }) => doc.decision_id)
  );

  const tier = ((userData?.subscription_tier as string) || 'free') as TierKey;
  const tierConfig = TIERS[tier];
  const badge = TIER_BADGES[tier] || TIER_BADGES.free;
  const reportsUsed = userData?.reports_used_this_cycle || 0;
  const freeReportUsed = userData?.free_report_used || false;

  // Calculate report usage display
  let usageText: string;
  let usagePercent: number;
  if (tier === 'free') {
    usageText = freeReportUsed ? '1 of 1 report used' : '0 of 1 report used';
    usagePercent = freeReportUsed ? 100 : 0;
  } else if (tierConfig.reports_per_month === Infinity) {
    usageText = `${reportsUsed} reports generated · Unlimited`;
    usagePercent = 0;
  } else {
    usageText = `${reportsUsed} of ${tierConfig.reports_per_month} reports used`;
    usagePercent = Math.round((reportsUsed / tierConfig.reports_per_month) * 100);
  }

  const isHighestTier = tier === 'founding_leader';

  // Contextual upgrade message
  let upgradeMessage: string | null = null;
  if (tier === 'free' && freeReportUsed) {
    upgradeMessage = "You've used your free report. Upgrade to keep solving strategic challenges.";
  } else if (tier === 'starter' && tierConfig.reports_per_month - reportsUsed <= 1) {
    upgradeMessage = `${tierConfig.reports_per_month - reportsUsed} report remaining this month. Upgrade to Professional for unlimited reports + Behavioural Alchemy.`;
  }

  const handleSignOut = async () => {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/');
  };

  // Count completed reports with alchemy
  const completedCount = (decisions || []).filter((d: Decision) => d.status === 'complete').length;
  const alchemyCount = alchemyByDecision.size;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <span className="font-semibold text-gray-900 text-lg">QEP AISolve</span>
            </Link>

            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-primary-600 font-semibold transition-colors">
                Dashboard
              </Link>
              <Link href="/chat" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                New Report
              </Link>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                Pricing
              </Link>
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${badge.className}`}>
                  {badge.label}
                </span>
                <span className="text-sm text-gray-600 hidden sm:inline">{user.email}</span>
                <form action={handleSignOut}>
                  <button
                    type="submit"
                    className="text-gray-500 hover:text-gray-900 font-medium transition-colors text-sm"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Usage Bar */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  {tierConfig.name} Plan
                </h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${badge.className}`}>
                  {badge.label}
                </span>
              </div>
              <p className="text-sm text-gray-600">{usageText}</p>
              {/* Usage progress bar (skip for unlimited) */}
              {tierConfig.reports_per_month !== Infinity && (
                <div className="mt-2 w-full max-w-xs bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      usagePercent >= 100 ? 'bg-red-500' : usagePercent >= 75 ? 'bg-amber-500' : 'bg-primary-600'
                    }`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
              )}
              {/* Quick stats */}
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span>{completedCount} completed report{completedCount !== 1 ? 's' : ''}</span>
                {alchemyCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                    {alchemyCount} with Alchemy
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isHighestTier && (
                <Link
                  href="/pricing"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-semibold"
                >
                  Upgrade
                </Link>
              )}
              {userData?.stripe_customer_id && (
                <ManageSubscriptionButton />
              )}
            </div>
          </div>
        </div>

        {/* Upgrade Banner (contextual) */}
        {upgradeMessage && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-amber-800 font-medium">{upgradeMessage}</p>
            <Link
              href="/pricing"
              className="inline-block px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-semibold whitespace-nowrap"
            >
              View Plans
            </Link>
          </div>
        )}

        {/* New Report Button */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/chat"
              className="inline-flex items-center bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-sm"
            >
              + New Report
            </Link>
            <p className="text-sm text-gray-600">
              Start a new strategic consultation
            </p>
          </div>
        </div>

        {/* Domain Grid */}
        <DomainGrid
          allowedDomains={[...tierConfig.allowed_domains] as Domain[]}
          tierKey={tier}
          isTrial={tier === 'free' && !freeReportUsed}
        />

        {/* Report History */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Reports</h2>

          {decisions && decisions.length > 0 ? (
            <DecisionsList decisions={decisions as Decision[]} />
          ) : (
            <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
              <p className="text-gray-600 mb-4">No reports yet</p>
              <Link
                href="/chat"
                className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Create Your First Report
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
