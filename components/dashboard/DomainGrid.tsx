'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Domain } from '@/types';
import type { TierKey } from '@/lib/tiers';

interface DomainCardData {
  domain: Domain;
  label: string;
  description: string;
  icon: string;
  workflowCount: number;
  sampleBooks: string[];
}

const DOMAIN_CARDS: DomainCardData[] = [
  {
    domain: 'strategy',
    label: 'Strategy',
    description: 'Competitive positioning, growth levers, business model design',
    icon: '♟',
    workflowCount: 183,
    sampleBooks: ['Competitive Strategy — Porter', 'Good Strategy Bad Strategy — Rumelt'],
  },
  {
    domain: 'marketing',
    label: 'Marketing',
    description: 'Demand generation, brand positioning, customer acquisition',
    icon: '📣',
    workflowCount: 224,
    sampleBooks: ['Positioning — Ries & Trout', 'Building a StoryBrand — Miller'],
  },
  {
    domain: 'sales',
    label: 'Sales',
    description: 'Pipeline optimization, conversion strategy, pricing',
    icon: '🤝',
    workflowCount: 176,
    sampleBooks: ['SPIN Selling — Rackham', 'The Challenger Sale — Dixon & Adamson'],
  },
  {
    domain: 'innovation',
    label: 'Innovation',
    description: 'Product development, disruption strategy, validated learning',
    icon: '💡',
    workflowCount: 233,
    sampleBooks: ['The Lean Startup — Ries', 'Inspired — Cagan', 'Sprint — Knapp'],
  },
  {
    domain: 'operations',
    label: 'Operations',
    description: 'Process improvement, supply chain, lean management',
    icon: '⚙️',
    workflowCount: 189,
    sampleBooks: ['The Goal — Goldratt', 'The Toyota Way — Liker', 'Lean Thinking — Womack'],
  },
  {
    domain: 'hr',
    label: 'HR & People',
    description: 'Talent acquisition, leadership development, culture design',
    icon: '👥',
    workflowCount: 198,
    sampleBooks: ['Who — Smart & Street', 'Radical Candor — Scott', 'Work Rules! — Bock'],
  },
  {
    domain: 'finance',
    label: 'Finance',
    description: 'Financial planning, valuation, budgeting, risk management',
    icon: '📊',
    workflowCount: 189,
    sampleBooks: ['Financial Intelligence — Berman & Knight', 'Valuation — McKinsey'],
  },
];

const PREMIUM_DOMAINS: Domain[] = ['innovation', 'operations', 'hr', 'finance'];

interface DomainGridProps {
  allowedDomains: Domain[];
  tierKey: TierKey;
  isTrial: boolean;
}

export function DomainGrid({ allowedDomains, tierKey, isTrial }: DomainGridProps) {
  const [upgradeModal, setUpgradeModal] = useState<DomainCardData | null>(null);

  const isLocked = (domain: Domain) => !allowedDomains.includes(domain);

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Strategic Modules</h2>
            <p className="text-sm text-gray-500 mt-1">
              {allowedDomains.length === 7
                ? `All 7 modules unlocked${isTrial ? ' (trial)' : ''}`
                : `${allowedDomains.length} of 7 modules available`}
            </p>
          </div>
          {allowedDomains.length < 7 && (
            <Link
              href="/pricing"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              Unlock all modules →
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* First row: base domains (3) + first premium */}
          {DOMAIN_CARDS.map((card) => {
            const locked = isLocked(card.domain);

            return (
              <div
                key={card.domain}
                onClick={() => locked ? setUpgradeModal(card) : undefined}
                className={`
                  relative rounded-xl border p-5 transition-all
                  ${locked
                    ? 'bg-gray-50 border-gray-200 cursor-pointer hover:border-gray-300 hover:shadow-sm'
                    : 'bg-white border-gray-200 hover:border-primary-500 hover:shadow-md'
                  }
                `}
              >
                {/* Lock overlay for premium domains */}
                {locked && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-500 px-2 py-1 rounded-full border border-gray-200">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Locked
                    </span>
                  </div>
                )}

                {/* Domain icon */}
                <div className={`text-2xl mb-3 ${locked ? 'opacity-40' : ''}`}>
                  {card.icon}
                </div>

                {/* Domain name */}
                <h3 className={`font-semibold mb-1 ${locked ? 'text-gray-400' : 'text-gray-900'}`}>
                  {card.label}
                </h3>

                {/* Description */}
                <p className={`text-xs leading-relaxed mb-3 ${locked ? 'text-gray-400' : 'text-gray-500'}`}>
                  {card.description}
                </p>

                {/* Workflow count */}
                <div className={`text-xs font-medium ${locked ? 'text-gray-400' : 'text-primary-600'}`}>
                  {card.workflowCount} workflows
                </div>

                {/* Upgrade CTA for locked cards */}
                {locked && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-xs font-medium text-primary-600 hover:text-primary-700">
                      Upgrade to Founding Leader →
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upgrade Modal */}
      {upgradeModal && (
        <UpgradeModal
          card={upgradeModal}
          onClose={() => setUpgradeModal(null)}
        />
      )}
    </>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  UPGRADE MODAL                                              */
/* ──────────────────────────────────────────────────────────── */

function UpgradeModal({
  card,
  onClose,
}: {
  card: DomainCardData;
  onClose: () => void;
}) {
  const totalPremiumWorkflows = DOMAIN_CARDS
    .filter(c => PREMIUM_DOMAINS.includes(c.domain))
    .reduce((sum, c) => sum + c.workflowCount, 0);

  const premiumBooks = DOMAIN_CARDS
    .filter(c => PREMIUM_DOMAINS.includes(c.domain))
    .flatMap(c => c.sampleBooks)
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-lg max-w-lg w-full border border-gray-200 overflow-hidden">
        {/* Header accent */}
        <div className="h-1 bg-gradient-to-r from-primary-600 to-primary-500" />

        <div className="p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Icon + Title */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{card.icon}</span>
            <h3 className="text-xl font-bold text-gray-900">{card.label} Module</h3>
          </div>

          <p className="text-gray-600 mb-6">{card.description}</p>

          {/* What you unlock */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Founding Leader unlocks:
            </h4>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="text-primary-600 font-bold mt-0.5 flex-shrink-0">+</span>
                <span><span className="font-medium">4 additional domains</span> with {totalPremiumWorkflows} expert workflows</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="text-primary-600 font-bold mt-0.5 flex-shrink-0">+</span>
                <span><span className="font-medium">Behavioural Alchemy</span> — counterintuitive options on every report</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="text-primary-600 font-bold mt-0.5 flex-shrink-0">+</span>
                <span><span className="font-medium">Early adopter pricing</span> — locked in forever at $149/month</span>
              </li>
            </ul>
          </div>

          {/* Book sources */}
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Powered by frameworks from
            </p>
            <div className="flex flex-wrap gap-2">
              {premiumBooks.map((book) => (
                <span
                  key={book}
                  className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded border border-primary-100"
                >
                  {book}
                </span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="flex-1 text-center bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold text-sm"
            >
              Upgrade to Founding Leader — $149/mo
            </Link>
            <button
              onClick={onClose}
              className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
