'use client';

import { exampleDocuments, ExampleDocument } from '@/lib/data/exampleDocuments';
import { useState } from 'react';
import { ExamplePreviewModal } from './ExamplePreviewModal';

interface ExampleLibraryProps {
  ctaHref?: string; // Default to /auth for landing page, or /chat for dashboard
  ctaText?: string;
}

export function ExampleLibrary({
  ctaHref = '/auth',
  ctaText = 'Start Free Trial'
}: ExampleLibraryProps) {
  const [selectedExample, setSelectedExample] = useState<ExampleDocument | null>(null);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-3">
            See What QEP AISolve Can Do
          </h2>
          <p className="text-slate-600">
            Explore example strategic documents across different business domains.
            Each example shows the depth and quality you can expect for your own challenges.
          </p>
        </div>

        {/* Examples Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {exampleDocuments.map((example) => (
            <div
              key={example.id}
              className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              {/* Domain Badge */}
              <div className="mb-3">
                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  {example.domain}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                {example.title}
              </h3>

              {/* Problem Statement */}
              <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                {example.problem}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {example.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Preview Button */}
              <button
                onClick={() => setSelectedExample(example)}
                className="w-full py-2 px-4 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium text-sm"
              >
                Preview Document
              </button>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-8 text-center">
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            Ready to solve your business challenge?
          </h3>
          <p className="text-slate-600 mb-4">
            Get a strategic document like these for your specific problem — in 20 minutes.
          </p>
          <a
            href={ctaHref}
            className="inline-block py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            {ctaText}
          </a>
        </div>
      </div>

      {/* Preview Modal */}
      {selectedExample && (
        <ExamplePreviewModal
          example={selectedExample}
          onClose={() => setSelectedExample(null)}
          ctaHref={ctaHref}
        />
      )}
    </>
  );
}
