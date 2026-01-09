'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Decision } from '@/types';

interface DecisionsListProps {
  decisions: Decision[];
}

export function DecisionsList({ decisions }: DecisionsListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(null);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  // Filter decisions based on search and status
  const filteredDecisions = useMemo(() => {
    let filtered = decisions;

    // Filter by status
    if (filterStatus === 'active') {
      // Show all non-archived decisions
      filtered = filtered.filter(d => d.status !== 'archived');
    } else if (filterStatus !== 'all') {
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

  const handleRegenerateDocument = async (decisionId: string) => {
    if (!confirm('Regenerate this strategic document? This will create a new version based on your latest conversation.')) {
      return;
    }

    setProcessingId(decisionId);
    try {
      const response = await fetch('/api/document/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionId }),
      });

      if (response.ok) {
        alert('Document regenerated successfully!');
        router.refresh();
      } else {
        alert('Failed to regenerate document. Please try again.');
      }
    } catch (error) {
      console.error('Regeneration error:', error);
      alert('Failed to regenerate document. Please try again.');
    } finally {
      setProcessingId(null);
      setShowMenu(null);
    }
  };

  const handleArchiveDecision = async (decisionId: string) => {
    if (!confirm('Archive this decision? You can still access it later from archived decisions.')) {
      return;
    }

    setProcessingId(decisionId);
    try {
      const response = await fetch('/api/decision/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionId }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Failed to archive decision. Please try again.');
      }
    } catch (error) {
      console.error('Archive error:', error);
      alert('Failed to archive decision. Please try again.');
    } finally {
      setProcessingId(null);
      setShowMenu(null);
    }
  };

  const handleDuplicateDecision = async (decisionId: string) => {
    setProcessingId(decisionId);
    try {
      const response = await fetch('/api/decision/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisionId }),
      });

      if (response.ok) {
        const { newDecisionId } = await response.json();
        router.push(`/chat/${newDecisionId}`);
      } else {
        alert('Failed to duplicate decision. Please try again.');
      }
    } catch (error) {
      console.error('Duplicate error:', error);
      alert('Failed to duplicate decision. Please try again.');
    } finally {
      setProcessingId(null);
      setShowMenu(null);
    }
  };

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
          <option value="active">Active (Non-archived)</option>
          <option value="intake">Intake</option>
          <option value="clarifying">Clarifying</option>
          <option value="processing">Processing</option>
          <option value="complete">Complete</option>
          <option value="archived">Archived</option>
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

              <div className="flex gap-2">
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

                {/* Quick Actions Menu */}
                <div className="relative" ref={showMenu === decision.id ? menuRef : null}>
                  <button
                    onClick={() => setShowMenu(showMenu === decision.id ? null : decision.id)}
                    className="px-3 py-2 border-2 border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={processingId === decision.id}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>

                  {showMenu === decision.id && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                      {decision.status === 'complete' && (
                        <button
                          onClick={() => handleRegenerateDocument(decision.id)}
                          disabled={processingId === decision.id}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Regenerate Document
                        </button>
                      )}

                      <button
                        onClick={() => handleDuplicateDecision(decision.id)}
                        disabled={processingId === decision.id}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Duplicate as Template
                      </button>

                      <button
                        onClick={() => handleArchiveDecision(decision.id)}
                        disabled={processingId === decision.id}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 border-t border-gray-100"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        Archive Decision
                      </button>
                    </div>
                  )}
                </div>
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
