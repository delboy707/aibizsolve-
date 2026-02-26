import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { TierKey } from '@/lib/tiers';
import { TIERS } from '@/lib/tiers';

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; domain?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  const tier = ((userData?.subscription_tier as string) || 'free') as TierKey;
  const reason = params.reason || 'general';
  const domain = params.domain;

  const messages: Record<string, { title: string; body: string }> = {
    report_limit: {
      title: tier === 'free'
        ? "You've used your free report"
        : `You've hit your ${TIERS[tier].reports_per_month} report limit this month`,
      body: tier === 'free'
        ? 'Upgrade to keep solving strategic challenges. Starter gives you 3 reports/month, Professional gives you unlimited.'
        : 'Upgrade to Professional for unlimited reports plus Behavioural Alchemy insights.',
    },
    domain_locked: {
      title: `${domain ? domain.charAt(0).toUpperCase() + domain.slice(1) : 'This domain'} requires an upgrade`,
      body: 'Expand your access to more business domains with a higher-tier plan.',
    },
    general: {
      title: 'Upgrade to unlock more',
      body: 'Get more reports, more domains, and Behavioural Alchemy insights.',
    },
  };

  const msg = messages[reason] || messages.general;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">{msg.title}</h1>
        <p className="text-gray-600 mb-8">{msg.body}</p>

        <div className="space-y-3">
          <Link
            href="/pricing"
            className="block w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            View Plans
          </Link>
          <Link
            href="/dashboard"
            className="block w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
