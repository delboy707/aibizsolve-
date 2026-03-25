'use client';

import { useState } from 'react';
import Link from 'next/link';

type BillingInterval = 'monthly' | 'annual';

interface Tier {
  name: string;
  price: number;
  annual_price: number | null;
  monthly_equivalent: number | null;
  tagline: string;
  cta: string;
  href: string;
  annualHref?: string;
  popular: boolean;
  features: string[];
  lockedFeature?: string;
}

const tiers: Tier[] = [
  {
    name: 'Free',
    price: 0,
    annual_price: null,
    monthly_equivalent: null,
    tagline: 'Try it on a real problem',
    cta: 'Get Your Free Report',
    href: '/auth?mode=signup',
    popular: false,
    features: [
      '1 strategic report',
      'All 7 business modules',
      'SCQA framework document',
      '90-day implementation roadmap',
      'Behavioural Alchemy (on your free report)',
    ],
  },
  {
    name: 'Starter',
    price: 29,
    annual_price: 261,
    monthly_equivalent: 21.75,
    tagline: 'Test the value',
    cta: 'Start Free Trial',
    href: '/auth?mode=signup',
    annualHref: '/auth?mode=signup&plan=starter_annual',
    popular: false,
    features: [
      '3 reports per month',
      'Strategy module',
      'SCQA framework documents',
      '90-day implementation roadmap',
    ],
    lockedFeature: 'Behavioural Alchemy insight',
  },
  {
    name: 'Professional',
    price: 79,
    annual_price: 711,
    monthly_equivalent: 59.25,
    tagline: 'Full capability for serious leaders',
    cta: 'Start Free Trial',
    href: '/auth?mode=signup',
    annualHref: '/auth?mode=signup&plan=professional_annual',
    popular: true,
    features: [
      'Unlimited reports',
      'Strategy + Marketing + Sales modules',
      'Behavioural Alchemy insights',
      'SCQA framework documents',
      '90-day implementation roadmap',
      'Risk mitigation strategies',
    ],
  },
  {
    name: 'Founding Leader',
    price: 149,
    annual_price: 1341,
    monthly_equivalent: 111.75,
    tagline: 'Lock in early adopter pricing',
    cta: 'Become a Founding Leader',
    href: '/auth?mode=signup',
    annualHref: '/auth?mode=signup&plan=founding_leader_annual',
    popular: false,
    features: [
      'Everything in Professional',
      'Innovation module (on launch)',
      'Operations module (on launch)',
      'HR module (on launch)',
      'Finance module (on launch)',
      'Guaranteed early adopter pricing',
    ],
  },
];

export default function PricingClient() {
  const [interval, setInterval] = useState<BillingInterval>('monthly');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <span className="font-semibold text-gray-900 text-lg">QEP AISolve</span>
            </Link>
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Try it free — get one real strategic report with no time limit. No credit card required.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-10">
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setInterval('monthly')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                interval === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('annual')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 ${
                interval === 'annual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Annual
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                Save 25%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {tiers.map((tier) => {
            const showAnnual = interval === 'annual' && tier.annual_price !== null;
            const ctaHref = showAnnual && tier.annualHref ? tier.annualHref : tier.href;

            return (
              <div
                key={tier.name}
                className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col ${
                  tier.popular
                    ? 'border-primary-600 shadow-lg lg:scale-105'
                    : 'border-gray-200 shadow-sm'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary-600 text-white text-sm font-semibold px-4 py-1 rounded-full whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-gray-900">{tier.name}</h2>
                    {showAnnual && (
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        Save 25%
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{tier.tagline}</p>
                </div>

                <div className="mb-5">
                  {tier.price === 0 ? (
                    <span className="text-5xl font-bold text-gray-900">$0</span>
                  ) : showAnnual ? (
                    <>
                      <span className="text-5xl font-bold text-gray-900">
                        ${tier.annual_price}
                      </span>
                      <span className="text-gray-500 ml-1">/year</span>
                      <p className="text-sm text-green-600 font-medium mt-1">
                        That&apos;s just ${tier.monthly_equivalent}/mo
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="text-5xl font-bold text-gray-900">${tier.price}</span>
                      <span className="text-gray-500 ml-1">/month</span>
                    </>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="text-primary-600 font-bold mt-0.5 flex-shrink-0">✓</span>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                  {tier.lockedFeature && (
                    <li className="flex items-start gap-3">
                      <span className="text-gray-400 mt-0.5 flex-shrink-0">✕</span>
                      <span className="text-sm text-gray-400">{tier.lockedFeature}</span>
                    </li>
                  )}
                </ul>

                <Link
                  href={ctaHref}
                  className={`block w-full text-center py-3 px-4 rounded-lg font-semibold text-sm transition-colors ${
                    tier.popular
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : tier.price === 0
                      ? 'bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-gray-500 mt-10">
          Cancel anytime. No long-term contracts.
        </p>
      </main>
    </div>
  );
}
