import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function UpgradePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="font-semibold text-gray-900 text-lg">QEP AISolve</span>
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          You&apos;ve used your free report
        </h1>
        <p className="text-gray-600 mb-8 text-lg leading-relaxed">
          Ready to keep solving strategic challenges? Pick a plan and get back to work.
        </p>

        {/* Quick tier comparison */}
        <div className="space-y-3 mb-8 text-left">
          {[
            {
              name: 'Starter',
              price: '$29/month',
              highlight: '3 reports/month · Strategy module',
              href: '/pricing',
            },
            {
              name: 'Professional',
              price: '$79/month',
              highlight: 'Unlimited · Strategy + Marketing + Sales · Behavioural Alchemy',
              popular: true,
              href: '/pricing',
            },
            {
              name: 'Founding Leader',
              price: '$149/month',
              highlight: 'Everything · All 7 modules · Locked for life',
              href: '/pricing',
            },
          ].map(({ name, price, highlight, popular, href }) => (
            <Link
              key={name}
              href={href}
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${
                popular
                  ? 'border-primary-500 bg-primary-50 hover:bg-primary-100'
                  : 'border-gray-200 bg-white hover:border-primary-300'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{name}</span>
                  {popular && (
                    <span className="text-xs font-bold text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">
                      Most Popular
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{highlight}</p>
              </div>
              <span className="font-bold text-gray-900 shrink-0 ml-4">{price}</span>
            </Link>
          ))}
        </div>

        <Link
          href="/pricing"
          className="inline-block w-full py-4 bg-primary-600 text-white rounded-xl font-semibold text-lg hover:bg-primary-700 transition-colors"
        >
          See Full Pricing →
        </Link>

        <p className="mt-4 text-sm text-gray-500">
          <Link href="/dashboard" className="underline hover:text-gray-700">
            Go to dashboard
          </Link>
          {' · '}
          <Link href="/document" className="underline hover:text-gray-700">
            View my reports
          </Link>
        </p>
      </div>
    </div>
  );
}
