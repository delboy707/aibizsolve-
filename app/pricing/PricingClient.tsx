'use client';

import Link from 'next/link';

const tiers = [
  {
    name: 'Starter',
    price: 29,
    tagline: 'Test the value',
    cta: 'Start Free Trial',
    href: '/auth?mode=signup',
    popular: false,
    features: [
      '3 reports per month',
      'Strategy module',
      'SCQA framework documents',
      '90-day implementation roadmap',
    ],
  },
  {
    name: 'Professional',
    price: 79,
    tagline: 'Full capability for serious leaders',
    cta: 'Start Free Trial',
    href: '/auth?mode=signup',
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
    tagline: 'Lock in early adopter pricing',
    cta: 'Become a Founding Leader',
    href: '/auth?mode=signup',
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            28-day free trial on all plans. No credit card required.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative bg-white rounded-2xl border-2 p-8 flex flex-col ${
                tier.popular
                  ? 'border-primary-600 shadow-lg md:scale-105'
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

              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">{tier.name}</h2>
                <p className="text-sm text-gray-500">{tier.tagline}</p>
              </div>

              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">${tier.price}</span>
                <span className="text-gray-500 ml-1">/month</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <span className="text-primary-600 font-bold mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={`block w-full text-center py-3 px-6 rounded-lg font-semibold text-base transition-colors ${
                  tier.popular
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500 mt-10">
          Cancel anytime. No long-term contracts.
        </p>
      </main>
    </div>
  );
}
