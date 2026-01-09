'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Decision } from '@/types';

interface DecisionsListProps {
  decisions: Decision[];
}

export function DecisionsList({ decisions }: DecisionsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filter decisions based on search and status
  const filteredDecisions = useMemo(() => {
    let filtered = decisions;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(d => d.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d => {
        const problemMatch = d.problem_statement?.toLowerCase().includes(query);
        const domainMatch = d.classified_domains?.some((domain: string) =>
          domain.toLowerCase().includes(query)
        );
        const intentMatch = d.classified_intent?.toLowerCase().includes(query);
        return problemMatch || domainMatch || intentMatch;
      });
    }

    return filtered;
  }, [decisions, searchQuery, filterStatus]);

  return (
    <div>
      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search decisions by problem, domain, or intent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="intake">Intake</option>
          <option value="clarifying">Clarifying</option>
          <option value="processing">Processing</option>
          <option value="complete">Complete</option>
        </select>
      </div>

      {/* Results Count */}
      {(searchQuery || filterStatus !== 'all') && (
        <p className="text-sm text-gray-600 mb-4">
          Showing {filteredDecisions.length} of {decisions.length} decision{decisions.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Decisions Grid */}
      {filteredDecisions.length > 0 ? (
        <div className="grid gap-4">
          {filteredDecisions.map((decision: Decision) => (
            <div
              key={decision.id}
              className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {decision.problem_statement?.substring(0, 100) || 'Untitled Decision'}
                  {decision.problem_statement && decision.problem_statement.length > 100 && '...'}
                </h3>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  decision.status === 'complete'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : decision.status === 'clarifying'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                  {decision.status}
                </span>
              </div>

              {decision.classified_domains && decision.classified_domains.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {decision.classified_domains.map((domain: string) => (
                    <span key={domain} className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded border border-primary-200">
                      {domain}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2 text-xs text-gray-500 mb-4">
                <span>Created {new Date(decision.created_at).toLocaleDateString()}</span>
                {decision.classified_intent && (
                  <span>• Intent: {decision.classified_intent}</span>
                )}
              </div>

              {decision.status === 'complete' && (
                <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-800">
                    ✓ <strong>Document ready!</strong> View your strategic plan + Alchemy insights
                  </p>
                </div>
              )}

              {decision.status === 'clarifying' && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    💬 <strong>In progress:</strong> Continue answering questions, then generate document (appears after 3+ messages)
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Link
                  href={`/chat/${decision.id}`}
                  className="flex-1 text-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  {decision.status === 'complete' ? 'Continue Chat' : 'Continue'}
                </Link>
                {decision.status === 'complete' && (
                  <Link
                    href={`/document/${decision.id}`}
                    className="flex-1 text-center px-4 py-2 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-600 hover:text-white transition-colors text-sm font-medium"
                  >
                    📄 View Document
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
          <p className="text-gray-600 mb-2">No decisions found</p>
          <p className="text-sm text-gray-500">
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your search or filter'
              : 'Create your first decision to get started'}
          </p>
        </div>
      )}
    </div>
  );
}
