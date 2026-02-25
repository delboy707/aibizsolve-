'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCheckoutUrl } from '@/lib/stripe/redirect';
import type { TierKey } from '@/lib/tiers';

interface PricingClientProps {
  userId: string;
  currentTier: string;
  foundingLeaderRemaining: number;
}

const FAQ = [
  {
    q: 'How is this different from ChatGPT?',
    a: "You'll get a wall of text with no structure and no strategic lens. Try both — you'll feel the difference. QEP AISolve applies 583 proven strategic frameworks and returns a structured SCQA document with three options, a 90-day roadmap, and risk analysis.",
  },
  {
    q: 'How is this different from a consultant?',
    a: "A consultant gives you one answer after weeks of discovery. We give you structured options in minutes — including the unconventional ones they'd never propose. Keep your consultant for implementation. Use us for rapid strategic clarity.",
  },
  {
    q: 'Is Professional worth $79/month?',
    a: "One good strategic insight pays for years of subscription. The question isn't cost — it's whether you'll use it. Unlimited reports, Behavioural Alchemy on every one.",
  },
];

export default function PricingClient({
  userId,
  currentTier,
  foundingLeaderRemaining,
}: PricingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const upgraded = searchParams.get('upgraded') === 'true';

  const [loadingTier, setLoadingTier] = useState<TierKey | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleUpgrade = (tier: TierKey) => {
    const url = getCheckoutUrl(tier, userId);
    if (!url) {
      // Free tier — go start a report
      router.push('/chat');
      return;
    }
    setLoadingTier(tier);
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="font-semibold text-gray-900 text-lg">QEP AISolve</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Upgrade confirmation banner */}
        {upgraded && (
          <div className="mb-10 bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-3">
            <span className="text-green-600 text-xl">✓</span>
            <p className="text-green-800 font-medium">
              You&apos;re all set! Your subscription is now active. Enjoy unlimited reports.
            </p>
          </div>
        )}

        {/* Page heading */}
        <div className="text-center mb-6">
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-widest mb-3">
            Pricing
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Strategic clarity in minutes,<br className="hidden sm:block" /> not months.
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            QEP AISolve gives you consultancy-grade analysis on Strategy, Marketing, and Sales —
            plus the unconventional options consultants rarely suggest.
          </p>
        </div>

        {/* Free report inline CTA */}
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mb-12">
          <div>
            <p className="font-semibold text-primary-900 text-lg">Try it free.</p>
            <p className="text-primary-700 text-sm mt-1">
              One strategic report on your real business challenge. No credit card required.
            </p>
          </div>
          <Link
            href="/chat"
            className="shrink-0 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors text-sm"
          >
            Get Your Free Report →
          </Link>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">

          {/* Starter */}
          <div className={`bg-white rounded-2xl border-2 p-8 flex flex-col ${
            currentTier === 'starter' ? 'border-primary-600' : 'border-gray-200'
          }`}>
            {currentTier === 'starter' && (
              <span className="self-start mb-3 text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                Current plan
              </span>
            )}
            <h2 className="text-xl font-bold text-gray-900 mb-1">Starter</h2>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-bold text-gray-900">$29</span>
              <span className="text-gray-500">/month</span>
            </div>
            <p className="text-sm text-gray-500 mb-6">3 reports/month · Strategy module</p>

            <ul className="space-y-3 text-sm text-gray-700 mb-8 flex-1">
              {[
                '3 strategic reports per month',
                'Strategy module',
                'SCQA structured documents',
                '90-day implementation roadmaps',
                'Risk mitigation analysis',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-primary-600 mt-0.5 shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade('starter')}
              disabled={loadingTier !== null || currentTier === 'starter'}
              className="w-full py-3 rounded-lg border-2 border-primary-600 text-primary-600 font-semibold hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingTier === 'starter'
                ? 'Redirecting...'
                : currentTier === 'starter'
                ? 'Current plan'
                : 'Start with Starter'}
            </button>
          </div>

          {/* Professional — highlighted */}
          <div className={`bg-white rounded-2xl border-2 p-8 flex flex-col relative shadow-lg ${
            currentTier === 'professional' ? 'border-primary-600' : 'border-primary-500'
          }`}>
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold text-white bg-primary-600 px-3 py-1 rounded-full">
              Most Popular
            </span>
            {currentTier === 'professional' && (
              <span className="self-start mb-3 text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                Current plan
              </span>
            )}
            <h2 className="text-xl font-bold text-gray-900 mb-1">Professional</h2>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-bold text-gray-900">$79</span>
              <span className="text-gray-500">/month</span>
            </div>
            <p className="text-sm text-gray-500 mb-6">Unlimited · Strategy + Marketing + Sales</p>

            <ul className="space-y-3 text-sm text-gray-700 mb-8 flex-1">
              {[
                'Unlimited strategic reports',
                'Strategy + Marketing + Sales modules',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-primary-600 mt-0.5 shrink-0">✓</span>
                  {f}
                </li>
              ))}
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5 shrink-0">⚗️</span>
                <span>
                  <strong>Behavioural Alchemy</strong> — counterintuitive strategic options
                  in every report
                </span>
              </li>
              {[
                'SCQA structured documents',
                '90-day implementation roadmaps',
                'Risk mitigation analysis',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-primary-600 mt-0.5 shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade('professional')}
              disabled={loadingTier !== null || currentTier === 'professional'}
              className="w-full py-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow"
            >
              {loadingTier === 'professional'
                ? 'Redirecting...'
                : currentTier === 'professional'
                ? 'Current plan'
                : 'Go Professional'}
            </button>
          </div>

          {/* Founding Leader */}
          <div className={`bg-white rounded-2xl border-2 p-8 flex flex-col ${
            currentTier === 'founding_leader'
              ? 'border-amber-500'
              : foundingLeaderRemaining === 0
              ? 'border-gray-200 opacity-60'
              : 'border-amber-400'
          }`}>
            {currentTier === 'founding_leader' && (
              <span className="self-start mb-3 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                Current plan
              </span>
            )}
            <h2 className="text-xl font-bold text-gray-900 mb-1">Founding Leader</h2>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-bold text-gray-900">$149</span>
              <span className="text-gray-500">/month</span>
            </div>
            <p className="text-sm text-gray-500 mb-1">Everything · All modules · Locked for life</p>

            {/* Slot counter */}
            <div className={`text-xs font-semibold px-2 py-1 rounded-full self-start mb-5 ${
              foundingLeaderRemaining <= 10
                ? 'bg-red-50 text-red-600'
                : 'bg-amber-50 text-amber-700'
            }`}>
              {foundingLeaderRemaining > 0
                ? `${foundingLeaderRemaining} of 100 slots remaining`
                : 'All slots claimed'}
            </div>

            <ul className="space-y-3 text-sm text-gray-700 mb-8 flex-1">
              {[
                'Everything in Professional',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5 shrink-0">✓</span>
                  {f}
                </li>
              ))}
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5 shrink-0">✓</span>
                <span>
                  Innovation, Operations, HR & Finance modules included free when launched
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5 shrink-0">✓</span>
                <span>Founding Leader pricing locked for life</span>
              </li>
            </ul>

            <button
              onClick={() => handleUpgrade('founding_leader')}
              disabled={
                loadingTier !== null ||
                currentTier === 'founding_leader' ||
                foundingLeaderRemaining === 0
              }
              className="w-full py-3 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingTier === 'founding_leader'
                ? 'Redirecting...'
                : currentTier === 'founding_leader'
                ? 'Current plan'
                : foundingLeaderRemaining === 0
                ? 'All slots claimed'
                : 'Claim Your Founding Spot'}
            </button>
          </div>
        </div>

        {/* Three proof points */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16 text-center">
          {[
            {
              icon: '🏗️',
              title: 'Structured, not scattered',
              body: 'Built on proven strategic frameworks, not generic AI guesswork',
            },
            {
              icon: '⚡',
              title: 'Fast, not slow',
              body: 'Get structured strategic options in the time it takes to drink your coffee',
            },
            {
              icon: '🎯',
              title: 'Strategy + Surprise',
              body: "Every report shows conventional wisdom AND the behavioural curveball your competitors won't see",
            },
          ].map(({ icon, title, body }) => (
            <div key={title} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600">{body}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Common questions
          </h2>
          <div className="space-y-3">
            {FAQ.map(({ q, a }, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  {q}
                  <span className="text-gray-400 ml-4">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed">{a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
