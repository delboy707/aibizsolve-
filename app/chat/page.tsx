'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ChatInterface from '@/components/chat/ChatInterface';
import Link from 'next/link';
import type { Message, UploadedDocument } from '@/types';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [decisionId, setDecisionId] = useState<string | null>(null);
  const [pendingUploads, setPendingUploads] = useState<UploadedDocument[]>([]);
  const creatingDecision = useRef(false);
  const router = useRouter();
  const supabase = createClient();

  // Handle file uploads before decision creation
  const handleUploadComplete = (document: UploadedDocument) => {
    setPendingUploads(prev => [...prev, document]);
  };

  const handleSendMessage = async (content: string) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      let currentDecisionId = decisionId;

      // Create new decision if this is the first message
      if (!currentDecisionId && !creatingDecision.current) {
        creatingDecision.current = true;

        const { data: decision, error: decisionError } = await supabase
          .from('decisions')
          .insert({
            user_id: user.id,
            problem_statement: content,
            status: 'intake',
          })
          .select()
          .single();

        if (decisionError) {
          creatingDecision.current = false;
          throw decisionError;
        }

        currentDecisionId = decision.id;
        setDecisionId(currentDecisionId);

        // Link any pre-submit uploaded documents to this decision
        if (pendingUploads.length > 0) {
          const uploadIds = pendingUploads.map(doc => doc.id);
          await supabase
            .from('uploaded_documents')
            .update({ decision_id: currentDecisionId })
            .in('id', uploadIds);
        }

        // Save the initial user message before navigating
        await supabase.from('messages').insert({
          decision_id: currentDecisionId,
          role: 'user',
          content,
        });

        // Call AI API to generate initial response with clarifying questions
        const aiResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            decisionId: currentDecisionId,
            userMessage: content,
          }),
        });

        if (!aiResponse.ok) {
          // AI response failed; page will still navigate to chat
        }

        // Update URL to include decision ID (this will navigate away)
        router.push(`/chat/${currentDecisionId}`);
        return; // Exit early, the new page will handle future messages
      }

      if (!currentDecisionId) {
        // Decision is being created, skip duplicate
        return;
      }

      // Save user message
      const { data: userMessage } = await supabase
        .from('messages')
        .insert({
          decision_id: currentDecisionId,
          role: 'user',
          content,
        })
        .select()
        .single();

      if (userMessage) {
        setMessages((prev) => [...prev, userMessage as Message]);
      }

      // Call AI API with streaming
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decisionId: currentDecisionId,
          userMessage: content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      if (reader) {
        const tempMessage: Message = {
          id: 'streaming-temp',
          decision_id: currentDecisionId,
          role: 'assistant',
          content: '',
          step_label: null,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempMessage]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'content') {
                  accumulatedText += data.text;
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === 'streaming-temp'
                        ? { ...msg, content: accumulatedText }
                        : msg
                    )
                  );
                } else if (data.type === 'done') {
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === 'streaming-temp' ? data.message : msg
                    )
                  );
                } else if (data.type === 'error') {
                  setMessages(prev => prev.filter(msg => msg.id !== 'streaming-temp'));
                }
              } catch {
                // Ignore JSON parse errors for incomplete chunks
              }
            }
          }
        }
      }

    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto flex flex-col">
        <ChatInterface
          decisionId={decisionId || undefined}
          messages={messages}
          onSendMessage={handleSendMessage}
          pendingUploads={pendingUploads}
          onUploadComplete={handleUploadComplete}
        />
      </main>
    </div>
  );
}
