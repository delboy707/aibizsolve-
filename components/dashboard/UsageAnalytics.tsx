'use client';

import Link from 'next/link';
import { TIERS } from '@/lib/tiers';
import type { TierKey } from '@/lib/tiers';

interface UsageAnalyticsProps {
  tier: TierKey;
  reportsUsed: number;
  freeReportUsed: boolean;
  canGenerate: boolean;
  analytics: {
    total: number;
    thisMonth: number;
    completed: number;
    inProgress: number;
    archived: number;
  };
}

export function UsageAnalytics({
  tier,
  reportsUsed,
  freeReportUsed,
  canGenerate,
  analytics,
}: UsageAnalyticsProps) {
  const tierConfig = TIERS[tier];
  const isUnlimited = tierConfig.reports_per_month === Infinity;
  const reportsLimit = tierConfig.reports_per_month as number;

  // Derive usage bar values
  let usageLabel: string;
  let usagePercent: number;
  let barColor: string;

  if (tier === 'free') {
    if (freeReportUsed) {
      usageLabel = '1 of 1 free report used';
      usagePercent = 100;
      barColor = 'bg-red-500';
    } else {
      usageLabel = '0 of 1 free report available';
      usagePercent = 0;
      barColor = 'bg-primary-500';
    }
  } else if (isUnlimited) {
    usageLabel = 'Unlimited reports';
    usagePercent = 0;
    barColor = 'bg-primary-500';
  } else {
    const pct = Math.min(100, Math.round((reportsUsed / reportsLimit) * 100));
    usageLabel = `${reportsUsed} of ${reportsLimit} reports used this month`;
    usagePercent = pct;
    barColor = pct >= 100 ? 'bg-red-500' : pct >= 67 ? 'bg-amber-500' : 'bg-primary-500';
  }

  const atLimit = !canGenerate;

  return (
    <div className="mb-8 space-y-4">
      {/* Tier + Usage Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            {/* Plan name */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Current Plan
            </p>
            <h3 className="text-lg font-bold text-gray-900 mb-3">{tierConfig.name}</h3>

            {/* Usage bar */}
            {isUnlimited ? (
              <p className="text-sm font-medium text-gray-600">{usageLabel}</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-700">{usageLabel}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 max-w-xs">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: usagePercent > 0 ? `${usagePercent}%` : '0%' }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Upgrade / Manage CTA */}
          <div className="shrink-0 flex flex-col gap-2">
            {tier === 'free' && freeReportUsed && (
              <Link
                href="/pricing"
                className="inline-block px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-semibold text-center"
              >
                Upgrade to Continue →
              </Link>
            )}
            {tier === 'starter' && atLimit && (
              <Link
                href="/pricing"
                className="inline-block px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-semibold text-center"
              >
                Upgrade for Unlimited →
              </Link>
            )}
            {tier === 'starter' && !atLimit && (
              <Link
                href="/pricing"
                className="inline-block px-5 py-2 border border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 transition-colors text-sm font-medium text-center"
              >
                Unlock Behavioural Alchemy →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Contextual alert banners */}
      {tier === 'free' && freeReportUsed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
          <span className="text-lg mt-0.5">⚡</span>
          <div className="flex-1">
            <p className="font-semibold text-amber-900 text-sm">You've used your free report</p>
            <p className="text-sm text-amber-800 mt-0.5">
              Upgrade to Starter ($29/month) for 3 reports/month, or Professional ($79/month) for unlimited reports with Behavioural Alchemy.
            </p>
          </div>
          <Link
            href="/pricing"
            className="shrink-0 text-sm font-semibold text-amber-800 hover:text-amber-900 underline"
          >
            See plans
          </Link>
        </div>
      )}

      {tier === 'starter' && atLimit && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
          <span className="text-lg mt-0.5">⚡</span>
          <div className="flex-1">
            <p className="font-semibold text-amber-900 text-sm">Monthly limit reached</p>
            <p className="text-sm text-amber-800 mt-0.5">
              You've used all {reportsLimit} reports this month. Upgrade to Professional for unlimited reports and Behavioural Alchemy insights.
            </p>
          </div>
          <Link
            href="/pricing"
            className="shrink-0 text-sm font-semibold text-amber-800 hover:text-amber-900 underline"
          >
            Upgrade
          </Link>
        </div>
      )}

      {/* Quick stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{analytics.total}</div>
          <div className="text-xs text-gray-500 mt-1">Total Reports</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{analytics.thisMonth}</div>
          <div className="text-xs text-gray-500 mt-1">This Month</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{analytics.completed}</div>
          <div className="text-xs text-gray-500 mt-1">Completed</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{analytics.inProgress}</div>
          <div className="text-xs text-gray-500 mt-1">In Progress</div>
        </div>
      </div>
    </div>
  );
}
