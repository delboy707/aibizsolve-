'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import ChatInterface from '@/components/chat/ChatInterface';
import Link from 'next/link';
import type { Message } from '@/types';

interface ChatClientProps {
  decisionId: string;
  decisionTitle: string | null;
  initialMessages: Message[];
}

export default function ChatClient({
  decisionId,
  decisionTitle,
  initialMessages
}: ChatClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isGeneratingDocument, setIsGeneratingDocument] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const supabase = createClient();

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${decisionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `decision_id=eq.${decisionId}`,
        },
        (payload) => {
          console.log('New message received via subscription:', payload.new);
          setMessages((prev) => {
            // Avoid duplicates
            const exists = prev.some(msg => msg.id === payload.new.id);
            if (exists) return prev;
            return [...prev, payload.new as Message];
          });
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [decisionId, supabase]);

  // Polling fallback to fetch new messages (for development stability)
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      const { data: newMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('decision_id', decisionId)
        .order('created_at', { ascending: true });

      if (newMessages && newMessages.length > messages.length) {
        console.log('Polling found new messages:', newMessages.length - messages.length);
        setMessages(newMessages as Message[]);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [decisionId, messages.length, supabase]);

  const handleSendMessage = async (content: string) => {
    try {
      // Save user message
      await supabase.from('messages').insert({
        decision_id: decisionId,
        role: 'user',
        content,
      });

      // Call AI API to generate response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decisionId,
          userMessage: content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      // Response will be saved by API and synced via real-time subscription
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const handleGenerateDocument = async () => {
    try {
      setIsGeneratingDocument(true);
      setGenerationProgress('Starting document generation...');

      // Simulate progress updates
      setTimeout(() => setGenerationProgress('Generating strategic analysis (SCQA)...'), 2000);
      setTimeout(() => setGenerationProgress('Generating counterintuitive options (Alchemy)...'), 60000);
      setTimeout(() => setGenerationProgress('Finalizing document...'), 90000);

      const response = await fetch('/api/document/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ decisionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate document');
      }

      const data = await response.json();

      setGenerationProgress('Complete! Redirecting...');

      // Redirect to document view
      window.location.href = `/document/${decisionId}`;
    } catch (error) {
      console.error('Error generating document:', error);
      alert('Failed to generate document. Please try again.');
      setIsGeneratingDocument(false);
      setGenerationProgress('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Q</span>
                </div>
                <span className="font-semibold text-gray-900 text-lg">QEP AISolve</span>
              </Link>
              {decisionTitle && (
                <span className="text-sm text-gray-500 pl-3 border-l border-gray-300">{decisionTitle}</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {messages.length >= 3 && (
                <button
                  onClick={handleGenerateDocument}
                  disabled={isGeneratingDocument}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                >
                  {isGeneratingDocument ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    'Generate Strategic Document'
                  )}
                </button>
              )}
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Modal */}
      {isGeneratingDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="mb-4">
                <svg className="animate-spin h-12 w-12 mx-auto text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Generating Your Document</h3>
              <p className="text-gray-600 mb-4">{generationProgress}</p>

              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-left">
                <p className="text-sm text-primary-900 font-semibold mb-2">What's being created:</p>
                <ul className="text-sm text-primary-800 space-y-1">
                  <li>✓ Strategic analysis using SCQA framework</li>
                  <li>✓ 30-60-90 day implementation roadmap</li>
                  <li>✓ Risk mitigation strategies</li>
                  <li>✓ Counterintuitive options (Alchemy Layer)</li>
                </ul>
                <p className="text-xs text-primary-700 mt-3 italic">
                  This takes ~2 minutes to ensure the highest quality strategic insights.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto flex flex-col">
        <ChatInterface
          decisionId={decisionId}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
      </main>
    </div>
  );
}
