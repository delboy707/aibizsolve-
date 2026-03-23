'use client';

import Link from 'next/link';
import type { AlchemyAccess } from '@/lib/tiers';

interface AlchemyIndicatorProps {
  access: AlchemyAccess;
  /** The full alchemy content (when access is 'full') */
  content?: string | null;
}

/**
 * Renders the appropriate Alchemy state based on user's tier:
 * - 'full': Shows the complete Alchemy section content
 * - 'teased': Shows section headings with blurred body + upgrade prompt
 * - 'none': Shows a compact upgrade banner
 */
export function AlchemyIndicator({ access, content }: AlchemyIndicatorProps) {
  if (access === 'full' && content) {
    return null; // Full content is rendered by the parent DocumentClient
  }

  if (access === 'teased') {
    return <AlchemyTeaser />;
  }

  return <AlchemyBanner />;
}

/* ──────────────────────────────────────────────────────────── */
/*  TEASED — Starter-tier users who see section structure       */
/* ──────────────────────────────────────────────────────────── */

function AlchemyTeaser() {
  return (
    <div className="max-w-3xl mx-auto py-10">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">⚗️</span>
        <h2 className="text-xl font-bold text-gray-900">Behavioural Alchemy</h2>
        <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200">
          Premium
        </span>
      </div>

      {/* Blurred preview cards */}
      <div className="space-y-4 mb-8">
        {[
          { title: 'Counterintuitive Options', lines: 3 },
          { title: 'The Perception Play', lines: 2 },
          { title: 'Small Bet, Big Signal', lines: 2 },
          { title: 'The Hidden Driver', lines: 2 },
        ].map((section) => (
          <div
            key={section.title}
            className="bg-alchemy-bg border border-alchemy-border rounded-lg p-4"
          >
            <h4 className="text-sm font-semibold text-alchemy-text mb-2">
              {section.title}
            </h4>
            {/* Blurred placeholder lines */}
            <div className="space-y-1.5 select-none" style={{ filter: 'blur(5px)' }}>
              {Array.from({ length: section.lines }).map((_, i) => (
                <div
                  key={i}
                  className="h-3 bg-amber-200/60 rounded"
                  style={{ width: `${85 - i * 15}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Upgrade prompt */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center">
        <p className="text-gray-900 font-semibold mb-1">
          These insights are generated for your specific problem
        </p>
        <p className="text-sm text-gray-500 mb-5">
          The Alchemy section reveals counterintuitive options most consultants won't consider.
          Upgrade to Professional or Founding Leader to unlock.
        </p>
        <Link
          href="/pricing"
          className="inline-block bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 transition-colors font-semibold text-sm"
        >
          View Plans
        </Link>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  BANNER — Starter-tier compact notice                        */
/* ──────────────────────────────────────────────────────────── */

function AlchemyBanner() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">⚗️</span>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Behavioural Alchemy available on Professional+
            </p>
            <p className="text-xs text-gray-500">
              Counterintuitive options powered by behavioural science
            </p>
          </div>
        </div>
        <Link
          href="/pricing"
          className="flex-shrink-0 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          Upgrade →
        </Link>
      </div>
    </div>
  );
}
