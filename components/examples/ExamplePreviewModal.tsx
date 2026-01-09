'use client';

import { ExampleDocument } from '@/lib/data/exampleDocuments';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface ExamplePreviewModalProps {
  example: ExampleDocument;
  onClose: () => void;
  ctaHref?: string;
}

export function ExamplePreviewModal({ example, onClose, ctaHref = '/auth' }: ExamplePreviewModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200">
          <div className="flex-1">
            <div className="mb-2">
              <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                {example.domain}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {example.title}
            </h2>
            <p className="text-slate-600 text-sm">
              <strong>Problem:</strong> {example.problem}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Executive Summary Highlight */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">
              Executive Summary (SCQA)
            </h3>
            <div className="prose prose-sm max-w-none text-slate-700">
              <ReactMarkdown>{example.executiveSummary}</ReactMarkdown>
            </div>
          </div>

          {/* Full Document */}
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown>{example.fullDocument}</ReactMarkdown>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="border-t border-slate-200 p-6 bg-slate-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              This is an example. Get a strategic document for <strong>your</strong> specific challenge.
            </p>
            <a
              href={ctaHref}
              className="py-2 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm whitespace-nowrap"
            >
              {ctaHref === '/auth' ? 'Start Free Trial' : 'Try It Yourself'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
