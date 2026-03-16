'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import ChatInterface from '@/components/chat/ChatInterface';
import { AppHeader } from '@/components/layout/AppHeader';
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
  const [userInfo, setUserInfo] = useState<{ email: string; tier: string; hasStripe: boolean } | null>(null);
  const supabase = createClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Abort in-flight requests on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Fetch user info for header
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('users')
        .select('subscription_tier, stripe_customer_id')
        .eq('id', user.id)
        .single();
      setUserInfo({
        email: user.email || '',
        tier: profile?.subscription_tier || 'free',
        hasStripe: !!profile?.stripe_customer_id,
      });
    })();
  }, [supabase]);

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
          // Message received via subscription
          setMessages((prev) => {
            // Avoid duplicates
            const exists = prev.some(msg => msg.id === payload.new.id);
            if (exists) return prev;
            return [...prev, payload.new as Message];
          });
        }
      )
      .subscribe();

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
        // Found new messages via polling
        setMessages(newMessages as Message[]);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [decisionId, messages.length, supabase]);

  const handleSendMessage = async (content: string) => {
    // Cancel any previous in-flight request
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Save user message
      await supabase.from('messages').insert({
        decision_id: decisionId,
        role: 'user',
        content,
      });

      // Call AI API with streaming
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decisionId,
          userMessage: content,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      if (reader) {
        // Create a temporary streaming message
        const tempMessage: Message = {
          id: 'streaming-temp',
          decision_id: decisionId,
          role: 'assistant',
          content: '',
          step_label: null,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempMessage]);

        let buffer = '';
        let receivedDone = false;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete last line in buffer

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.type === 'content') {
                    accumulatedText += data.text;
                    // Update the streaming message
                    setMessages(prev =>
                      prev.map(msg =>
                        msg.id === 'streaming-temp'
                          ? { ...msg, content: accumulatedText }
                          : msg
                      )
                    );
                  } else if (data.type === 'done') {
                    receivedDone = true;
                    // Replace temp message with real saved message
                    setMessages(prev =>
                      prev.map(msg =>
                        msg.id === 'streaming-temp' ? data.message : msg
                      )
                    );
                  } else if (data.type === 'error') {
                    // Server sent an explicit error event
                    throw new Error(data.error || 'Something went wrong. Please try again.');
                  }
                } catch (e) {
                  if (e instanceof SyntaxError) {
                    // Genuinely corrupt JSON — skip this line
                    console.warn('[Chat] Unparseable SSE data:', line.slice(6).substring(0, 100));
                  } else {
                    throw e; // Re-throw application errors
                  }
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        // Stream ended without a proper 'done' event — something went wrong
        if (!receivedDone) {
          setMessages(prev => prev.filter(msg => msg.id !== 'streaming-temp'));
          throw new Error('Response was interrupted. Please try again.');
        }
      }
    } catch (error) {
      // Clean up temp message on any error
      setMessages(prev => prev.filter(msg => msg.id !== 'streaming-temp'));

      if (error instanceof DOMException && error.name === 'AbortError') {
        return; // User navigated away — don't surface error
      }

      throw error; // Propagate to ChatInterface for display
    }
  };

  const handleGenerateDocument = async () => {
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const timeoutIds: ReturnType<typeof setTimeout>[] = [];

    try {
      setIsGeneratingDocument(true);
      setGenerationProgress('Starting document generation...');

      // Progress updates (cosmetic — cleared on completion or error)
      timeoutIds.push(setTimeout(() => setGenerationProgress('Generating strategic analysis (SCQA)...'), 2000));
      timeoutIds.push(setTimeout(() => setGenerationProgress('Generating counterintuitive options (Alchemy)...'), 60000));
      timeoutIds.push(setTimeout(() => setGenerationProgress('Finalizing document...'), 90000));

      const response = await fetch('/api/document/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ decisionId }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate document');
      }

      const data = await response.json();

      timeoutIds.forEach(clearTimeout);
      setGenerationProgress('Complete! Redirecting...');

      // Redirect to document view
      window.location.href = `/document/${decisionId}`;
    } catch (error) {
      timeoutIds.forEach(clearTimeout);

      if (error instanceof DOMException && error.name === 'AbortError') {
        setIsGeneratingDocument(false);
        setGenerationProgress('');
        return;
      }

      alert(error instanceof Error ? error.message : 'Failed to generate document. Please try again.');
      setIsGeneratingDocument(false);
      setGenerationProgress('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader
        email={userInfo?.email}
        tier={userInfo?.tier}
        hasStripe={userInfo?.hasStripe}
      />

      {/* Generate Document Bar */}
      {messages.length >= 3 && (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {decisionTitle && (
              <span className="text-sm text-gray-500 truncate mr-4">{decisionTitle}</span>
            )}
            <button
              onClick={handleGenerateDocument}
              disabled={isGeneratingDocument}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm ml-auto"
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
          </div>
        </div>
      )}

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
