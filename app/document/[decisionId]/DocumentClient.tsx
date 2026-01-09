'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DocumentClientProps {
  decisionId: string;
  document: {
    id: string;
    title: string;
    content: string;
    created_at: string;
  };
}

export default function DocumentClient({ decisionId, document }: DocumentClientProps) {
  const [activeTab, setActiveTab] = useState<'strategic' | 'alchemy'>('strategic');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Format date consistently
  const createdDate = new Date(document.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });

  // Split content at Section 8
  const contentParts = document.content.split(/## 8\. ALCHEMY SECTION.*?\n/);
  const strategicContent = contentParts[0] || document.content;
  const alchemyContent = contentParts[1] || '';

  const hasAlchemy = alchemyContent.trim().length > 0;

  // Download as markdown
  const downloadMarkdown = () => {
    const blob = new Blob([document.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download as text
  const downloadText = () => {
    // Strip markdown formatting for plain text
    const plainText = document.content
      .replace(/^#{1,6}\s/gm, '') // Remove headers
      .replace(/\*\*/g, '') // Remove bold
      .replace(/\*/g, '') // Remove italics
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Remove links, keep text

    const blob = new Blob([plainText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(document.content);
    alert('Document copied to clipboard!');
  };

  const renderContent = (content: string, isAlchemy: boolean = false) => {
    return content
      .split('\n')
      .map((line: string) => {
        // Convert markdown headings
        if (line.startsWith('## ')) {
          return `<h2 class="text-2xl font-bold mt-8 mb-4 ${isAlchemy ? 'text-warning' : 'text-gray-900'}">${line.substring(3)}</h2>`;
        }
        if (line.startsWith('### ')) {
          return `<h3 class="text-xl font-semibold mt-6 mb-3 ${isAlchemy ? 'text-warning' : 'text-gray-800'}">${line.substring(4)}</h3>`;
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <span className="font-semibold text-gray-900 text-lg">QEP AISolve</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href={`/chat/${decisionId}`}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Back to Chat
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Document */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Document Header */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {document.title}
                </h1>
                <p className="text-sm text-gray-600">
                  Generated on {mounted ? createdDate : ''}
                </p>
              </div>

              {/* Download Actions */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  title="Copy to clipboard"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>
                <button
                  onClick={downloadText}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  title="Download as plain text"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  TXT
                </button>
                <button
                  onClick={downloadMarkdown}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                  title="Download as markdown"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download MD
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('strategic')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
                  activeTab === 'strategic'
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>📊</span>
                  <span>Strategic Document</span>
                </div>
                <p className="text-xs mt-1 text-gray-500">Sections 1-7: SCQA Framework</p>
              </button>

              {hasAlchemy && (
                <button
                  onClick={() => setActiveTab('alchemy')}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
                    activeTab === 'alchemy'
                      ? 'text-warning border-b-2 border-warning bg-alchemy-bg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>⚗️</span>
                    <span>Alchemy Insights</span>
                  </div>
                  <p className="text-xs mt-1 text-gray-500">Counterintuitive Options</p>
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8">
            {activeTab === 'strategic' ? (
              <div>
                <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-xl">
                  <h3 className="text-sm font-semibold text-primary-900 mb-2">
                    📊 Strategic Analysis — Sections 1-7
                  </h3>
                  <p className="text-sm text-primary-800 mb-3">
                    This is your board-ready strategic document using the SCQA framework (Situation, Complication, Question, Answer).
                  </p>
                  <div className="text-xs text-primary-700 space-y-1">
                    <p><strong>What's included:</strong></p>
                    <ul className="ml-4 space-y-0.5">
                      <li>• Executive Summary (SCQA)</li>
                      <li>• Situation Analysis & Problem Diagnosis</li>
                      <li>• 3 Strategic Options with pros/cons</li>
                      <li>• Clear Recommendation with rationale</li>
                      <li>• 30-60-90 Day Implementation Roadmap</li>
                      <li>• Risk Mitigation Strategies</li>
                    </ul>
                  </div>
                </div>

                <div className="prose prose-slate max-w-none">
                  <div
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: renderContent(strategicContent, false),
                    }}
                  />
                </div>
              </div>
            ) : (
              <div>
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

                <div className="prose prose-slate max-w-none">
                  <div
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: renderContent(alchemyContent, true),
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-8 pt-0 border-t border-gray-200 flex justify-between items-center">
            <button
              onClick={() => {
                const contentToCopy = activeTab === 'strategic' ? strategicContent : alchemyContent;
                navigator.clipboard.writeText(contentToCopy);
                alert(`${activeTab === 'strategic' ? 'Strategic Document' : 'Alchemy Insights'} copied to clipboard!`);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Copy {activeTab === 'strategic' ? 'Strategic Document' : 'Alchemy Insights'}
            </button>
            <Link
              href={`/chat/${decisionId}`}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
            >
              Continue Conversation
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
