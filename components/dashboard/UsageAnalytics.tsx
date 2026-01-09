'use client';

import Link from 'next/link';

interface UsageAnalyticsProps {
  analytics: {
    total: number;
    thisMonth: number;
    last30Days: number;
    completed: number;
    inProgress: number;
    archived: number;
    mostCommonDomain: string | null;
    avgGenerationTime: number | null;
  };
  isTrialActive: boolean;
  trialDaysRemaining: number;
}

export function UsageAnalytics({ analytics, isTrialActive, trialDaysRemaining }: UsageAnalyticsProps) {
  return (
    <div className="mb-8 space-y-4">
      {/* Trial Warning Banner */}
      {isTrialActive && trialDaysRemaining <= 7 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-3xl">⏰</span>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-2">
                Trial Ending Soon
              </h3>
              <p className="text-sm text-amber-800 mb-3">
                Your trial ends in <strong>{trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''}</strong>.
                Choose a payment plan to continue accessing your strategic documents and insights.
              </p>
              <Link
                href="/pricing"
                className="inline-block px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-semibold"
              >
                Choose Your Plan
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Grid */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white">
          <h3 className="text-lg font-semibold text-gray-900">Your Activity</h3>
          <p className="text-sm text-gray-600 mt-1">
            Track your strategic decision-making progress
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 p-6">
          {/* Total Decisions */}
          <div className="text-center p-4 bg-primary-50 rounded-lg border border-primary-100">
            <div className="text-3xl font-bold text-primary-600 mb-1">
              {analytics.total}
            </div>
            <div className="text-sm text-gray-600">Total Decisions</div>
          </div>

          {/* This Month */}
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {analytics.thisMonth}
            </div>
            <div className="text-sm text-gray-600">This Month</div>
          </div>

          {/* Completed */}
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {analytics.completed}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>

          {/* In Progress */}
          <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-100">
            <div className="text-3xl font-bold text-amber-600 mb-1">
              {analytics.inProgress}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
        </div>

        {/* Insights Row */}
        {(analytics.mostCommonDomain || analytics.avgGenerationTime) && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="grid md:grid-cols-2 gap-6">
              {analytics.mostCommonDomain && (
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Most Common Domain</div>
                    <div className="font-semibold text-gray-900 capitalize">{analytics.mostCommonDomain}</div>
                  </div>
                </div>
              )}

              {analytics.avgGenerationTime !== null && (
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Avg Generation Time</div>
                    <div className="font-semibold text-gray-900">
                      {analytics.avgGenerationTime < 60
                        ? `${analytics.avgGenerationTime} min`
                        : `${Math.floor(analytics.avgGenerationTime / 60)}h ${analytics.avgGenerationTime % 60}m`
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Engagement Message */}
        {analytics.total > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-primary-50">
            <p className="text-sm text-primary-800">
              {analytics.inProgress > 0 ? (
                <>
                  💬 <strong>You have {analytics.inProgress} decision{analytics.inProgress !== 1 ? 's' : ''} in progress.</strong> Continue the conversation or generate your strategic documents.
                </>
              ) : analytics.completed > 0 ? (
                <>
                  ✨ <strong>Great work!</strong> You've completed {analytics.completed} strategic decision{analytics.completed !== 1 ? 's' : ''}. Ready to tackle another challenge?
                </>
              ) : (
                <>
                  🚀 <strong>Welcome!</strong> Start your first strategic consultation to get personalized business insights.
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
