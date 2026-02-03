'use client';

import Link from 'next/link';
import { SectionCopyButton } from './SectionCopyButton';

interface AlchemySectionProps {
  content: string;
  hasAccess: boolean;
  onCopy?: () => void;
}

/**
 * AlchemySection Component
 *
 * Displays the Alchemy Layer content with premium styling.
 * Shows an upgrade prompt if the user doesn't have access.
 */
export function AlchemySection({ content, hasAccess, onCopy }: AlchemySectionProps) {
  const hasContent = content.trim().length > 0;

  // Parse content into sections with copy buttons
  const parseSections = (rawContent: string) => {
    const lines = rawContent.split('\n');
    const sections: React.ReactElement[] = [];

    type Section = { title: string; content: string[]; startIdx: number };
    let currentSection: Section | null = null;

    const pushSection = (section: Section) => {
      const sectionContent = section.content.join('\n');
      const sectionWithHeader = `## ${section.title}\n${sectionContent}`;

      sections.push(
        <div key={section.startIdx} className="section-wrapper">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-2xl font-bold mt-8 text-warning">
              {section.title}
            </h2>
            <SectionCopyButton
              sectionTitle={section.title}
              sectionContent={sectionWithHeader}
            />
          </div>
          <div dangerouslySetInnerHTML={{ __html: renderLines(section.content) }} />
        </div>
      );
    };

    lines.forEach((line, idx) => {
      if (line.startsWith('## ')) {
        if (currentSection) {
          pushSection(currentSection);
        }
        currentSection = {
          title: line.substring(3),
          content: [],
          startIdx: idx
        };
      } else if (currentSection) {
        currentSection.content.push(line);
      }
    });

    if (currentSection) {
      pushSection(currentSection);
    }

    return sections;
  };

  const renderLines = (lines: string[]): string => {
    return lines
      .map((line: string) => {
        if (line.startsWith('### ')) {
          return `<h3 class="text-xl font-semibold mt-6 mb-3 text-warning">${line.substring(4)}</h3>`;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return `<p class="font-semibold text-gray-900 mt-4 mb-2">${line.slice(2, -2)}</p>`;
        }
        if (line.startsWith('- ')) {
          return `<li class="ml-6 mb-1">${line.substring(2)}</li>`;
        }
        if (line.trim() === '---') {
          return '<hr class="my-8 border-gray-300" />';
        }
        if (line.trim() === '') {
          return '<br />';
        }
        return `<p class="mb-3 text-gray-700">${line}</p>`;
      })
      .join('');
  };

  // Show upgrade prompt if user doesn't have access
  if (!hasAccess || !hasContent) {
    return <AlchemyUpgradePrompt />;
  }

  return (
    <div>
      {/* Alchemy Header */}
      <div className="mb-6 p-4 bg-alchemy-bg border border-alchemy-border rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">⚗️</span>
          <h3 className="text-sm font-semibold text-alchemy-text m-0">
            Alchemy: Counterintuitive Options — Section 8
          </h3>
        </div>
        <p className="text-sm text-alchemy-text mb-3">
          These behavioral insights challenge conventional thinking. Most business problems have a
          psychological dimension that rational analysis misses. These counterintuitive options explore what others won't consider.
        </p>
        <div className="text-xs text-alchemy-text space-y-1">
          <p><strong>The Four Lenses:</strong></p>
          <ul className="ml-4 space-y-0.5">
            <li>• <strong>The Opposite Lens</strong> — What if we did the reverse?</li>
            <li>• <strong>The Perception Lens</strong> — Change how it feels, not what it is</li>
            <li>• <strong>The Signal Lens</strong> — Make it feel valuable without changing substance</li>
            <li>• <strong>The Small Bet Lens</strong> — Low-cost interventions with outsized impact</li>
          </ul>
          <p className="mt-2 italic">This is what differentiates QEP AISolve from standard consultants.</p>
        </div>
      </div>

      {/* Alchemy Content */}
      <div className="prose prose-slate max-w-none">
        {parseSections(content)}
      </div>
    </div>
  );
}

/**
 * AlchemyUpgradePrompt Component
 *
 * Shows when user doesn't have access to Alchemy features.
 */
export function AlchemyUpgradePrompt() {
  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <div className="mb-8">
        <span className="text-6xl">⚗️</span>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        Unlock Counterintuitive Options
      </h3>
      <p className="text-gray-600 mb-6 leading-relaxed">
        The Alchemy section provides behavioral insights that challenge conventional thinking.
        Most consultants give you the rational answer. We give you options they won't consider.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
        <h4 className="font-semibold text-amber-900 mb-3">
          What You're Missing:
        </h4>
        <div className="text-left text-sm text-amber-800 space-y-2">
          <AlchemyLensItem
            name="The Opposite Lens"
            description="What if we did the exact reverse of the obvious solution?"
          />
          <AlchemyLensItem
            name="The Perception Lens"
            description="Change how it feels rather than what it is"
          />
          <AlchemyLensItem
            name="The Signal Lens"
            description="Make it feel valuable without changing substance"
          />
          <AlchemyLensItem
            name="The Small Bet Lens"
            description="Micro-interventions under $10K with outsized impact"
          />
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          <strong>Alchemy insights are included for users who pay at or above their segment average.</strong>
        </p>
        <Link
          href="/pricing"
          className="inline-block px-8 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors font-semibold shadow-sm"
        >
          Upgrade to Unlock Alchemy
        </Link>
        <p className="text-xs text-gray-500">
          Most users pay $50-150/month. You decide what it's worth.
        </p>
      </div>
    </div>
  );
}

/**
 * AlchemyLensItem Component
 *
 * Displays a single Alchemy lens with name and description.
 */
function AlchemyLensItem({ name, description }: { name: string; description: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-amber-600">•</span>
      <div>
        <strong>{name}</strong> — {description}
      </div>
    </div>
  );
}

/**
 * AlchemyTeaser Component
 *
 * A smaller teaser for Alchemy shown inline in documents.
 */
export function AlchemyTeaser() {
  return (
    <div className="my-8 p-6 bg-amber-50 border-2 border-amber-300 rounded-xl">
      <div className="flex items-start gap-4">
        <span className="text-3xl">⚗️</span>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 mb-2">
            Unlock Counterintuitive Options
          </h3>
          <p className="text-sm text-amber-800 mb-4">
            The Alchemy Layer provides behavioral insights most consultants won't consider:
          </p>
          <ul className="text-sm text-amber-800 space-y-1 mb-4">
            <li>• <strong>The Opposite Lens</strong> — What if we did the reverse?</li>
            <li>• <strong>The Perception Lens</strong> — Change how it feels, not what it is</li>
            <li>• <strong>The Signal Lens</strong> — Make it feel valuable without changing substance</li>
            <li>• <strong>The Small Bet Lens</strong> — Low-cost interventions with outsized impact</li>
          </ul>
          <Link
            href="/pricing"
            className="inline-block px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors font-medium text-sm"
          >
            Upgrade to Unlock
          </Link>
        </div>
      </div>
    </div>
  );
}
