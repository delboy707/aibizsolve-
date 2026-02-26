'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TIERS } from '@/lib/tiers';
import type { TierKey } from '@/lib/tiers';
import { AppHeader } from '@/components/layout/AppHeader';

interface PricingClientProps {
  userId: string;
  currentTier: TierKey;
  foundingLeaderRemaining: number;
  userEmail?: string;
  hasStripe?: boolean;
}

export default function PricingClient({ userId, currentTier, foundingLeaderRemaining, userEmail, hasStripe }: PricingClientProps) {
  const searchParams = useSearchParams();
  const upgraded = searchParams.get('upgraded') === 'true';
  const [mounted, setMounted] = useState(false);
  const [faqOpen, setFaqOpen] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleUpgrade = (tier: TierKey) => {
    const config = TIERS[tier];
    if (!config.payment_link) return;

    const url = new URL(config.payment_link);
    url.searchParams.set('client_reference_id', userId);
    window.location.href = url.toString();
  };

  const faqs = [
    {
      id: 'chatgpt',
      q: 'How is this different from ChatGPT?',
      a: "You'll get a wall of text with no structure and no strategic lens. Try both — you'll feel the difference. QEP AISolve gives you a consultancy-grade SCQA document with structured options, a 90-day roadmap, and risk mitigation — not a generic essay.",
    },
    {
      id: 'consultant',
      q: 'How is this different from a consultant?',
      a: "A consultant gives you one answer after weeks. We give you structured options in minutes — including the unconventional ones they'd never propose. And at a fraction of the cost.",
    },
    {
      id: 'worth',
      q: 'Is it worth $79/month?',
      a: "One good strategic insight pays for years of subscription. The question isn't cost — it's whether you'll use it.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader email={userEmail} tier={currentTier} hasStripe={hasStripe} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success banner */}
        {upgraded && mounted && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <p className="text-green-800 font-semibold">Welcome aboard! Your subscription is active.</p>
          </div>
        )}

        {/* Free CTA at top */}
        {currentTier === 'free' && (
          <div className="mb-10 text-center">
            <p className="text-lg text-gray-700 mb-3">
              Try it free. One strategic report on your real business challenge. No credit card required.
            </p>
            <Link
              href="/onboarding"
              className="inline-block px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-sm text-lg"
            >
              Get Your Free Report
            </Link>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Strategic clarity in minutes, not months.
          </p>
        </div>

        {/* ── Three-tier cards ── */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Starter */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 flex flex-col">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Starter</h2>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-bold text-gray-900">$29</span>
              <span className="text-gray-500">/month</span>
            </div>
            <p className="text-gray-600 text-sm mb-6">{TIERS.starter.description}</p>
            <ul className="space-y-3 text-sm text-gray-700 mb-8 flex-1">
              <li className="flex items-start gap-2"><span className="text-primary-600 mt-0.5">✓</span>3 strategic reports per month</li>
              <li className="flex items-start gap-2"><span className="text-primary-600 mt-0.5">✓</span>Strategy module</li>
              <li className="flex items-start gap-2"><span className="text-primary-600 mt-0.5">✓</span>SCQA structured documents</li>
              <li className="flex items-start gap-2"><span className="text-primary-600 mt-0.5">✓</span>90-day implementation roadmaps</li>
            </ul>
            <button
              onClick={() => handleUpgrade('starter')}
              disabled={currentTier === 'starter'}
              className="w-full py-3 rounded-lg font-semibold transition-colors border border-primary-600 text-primary-600 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentTier === 'starter' ? 'Current Plan' : 'Start with Starter'}
            </button>
          </div>

          {/* Professional — highlighted */}
          <div className="bg-white rounded-xl border-2 border-primary-600 shadow-lg p-8 flex flex-col relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Professional</h2>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-bold text-gray-900">$79</span>
              <span className="text-gray-500">/month</span>
            </div>
            <p className="text-gray-600 text-sm mb-6">{TIERS.professional.description}</p>
            <ul className="space-y-3 text-sm text-gray-700 mb-8 flex-1">
              <li className="flex items-start gap-2"><span className="text-primary-600 mt-0.5">✓</span>Unlimited strategic reports</li>
              <li className="flex items-start gap-2"><span className="text-primary-600 mt-0.5">✓</span>Strategy + Marketing + Sales modules</li>
              <li className="flex items-start gap-2 font-semibold"><span className="text-amber-500 mt-0.5">⚗️</span>Behavioural Alchemy — counterintuitive options in every report</li>
              <li className="flex items-start gap-2"><span className="text-primary-600 mt-0.5">✓</span>SCQA structured documents</li>
              <li className="flex items-start gap-2"><span className="text-primary-600 mt-0.5">✓</span>90-day implementation roadmaps</li>
            </ul>
            <button
              onClick={() => handleUpgrade('professional')}
              disabled={currentTier === 'professional'}
              className="w-full py-3 rounded-lg font-semibold transition-colors bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentTier === 'professional' ? 'Current Plan' : 'Go Professional'}
            </button>
          </div>

          {/* Founding Leader */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 flex flex-col">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Founding Leader</h2>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-bold text-gray-900">$149</span>
              <span className="text-gray-500">/month</span>
            </div>
            <p className="text-xs text-amber-700 font-semibold mb-4">
              {mounted ? `${foundingLeaderRemaining} of 100 slots remaining` : 'Limited to 100 founders'}
            </p>
            <p className="text-gray-600 text-sm mb-6">{TIERS.founding_leader.description}</p>
            <ul className="space-y-3 text-sm text-gray-700 mb-8 flex-1">
              <li className="flex items-start gap-2"><span className="text-primary-600 mt-0.5">✓</span>Everything in Professional</li>
              <li className="flex items-start gap-2"><span className="text-primary-600 mt-0.5">✓</span>Innovation, Operations, HR, Finance modules included free when launched</li>
              <li className="flex items-start gap-2 font-semibold"><span className="text-amber-500 mt-0.5">🔒</span>Founding Leader pricing locked for life</li>
            </ul>
            <button
              onClick={() => handleUpgrade('founding_leader')}
              disabled={currentTier === 'founding_leader' || foundingLeaderRemaining <= 0}
              className="w-full py-3 rounded-lg font-semibold transition-colors border border-amber-600 text-amber-700 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentTier === 'founding_leader'
                ? 'Current Plan'
                : foundingLeaderRemaining <= 0
                ? 'Sold Out'
                : 'Claim Your Founding Spot'}
            </button>
          </div>
        </div>

        {/* ── Messaging section ── */}
        <div className="text-center mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Strategic clarity in minutes, not months.</h2>
          <p className="text-gray-600 max-w-3xl mx-auto mb-10">
            QEP AISolve gives you consultancy-grade analysis on Strategy, Marketing, and Sales — plus the unconventional options consultants rarely suggest.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl mb-3">🏗️</div>
              <h3 className="font-semibold text-gray-900 mb-1">Structured, not scattered</h3>
              <p className="text-sm text-gray-600">Built on proven strategic frameworks, not generic AI guesswork</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-semibold text-gray-900 mb-1">Fast, not slow</h3>
              <p className="text-sm text-gray-600">Get structured strategic options in the time it takes to drink your coffee</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-semibold text-gray-900 mb-1">Strategy + Surprise</h3>
              <p className="text-sm text-gray-600">Every report shows conventional wisdom AND the behavioural curveball your competitors won&apos;t see</p>
            </div>
          </div>
        </div>

        {/* ── FAQ / Objection handling ── */}
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Common Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.id} className="bg-white border border-gray-200 rounded-lg">
                <button
                  onClick={() => setFaqOpen(faqOpen === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="font-semibold text-gray-900">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${faqOpen === faq.id ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {faqOpen === faq.id && (
                  <div className="px-4 pb-4 text-sm text-gray-700">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
