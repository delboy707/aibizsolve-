'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ChatInterface from '@/components/chat/ChatInterface';
import Link from 'next/link';
import type { Message } from '@/types';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [decisionId, setDecisionId] = useState<string | null>(null);
  const creatingDecision = useRef(false);
  const router = useRouter();
  const supabase = createClient();

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
          console.error('Error creating decision:', decisionError);
          creatingDecision.current = false;
          throw decisionError;
        }

        currentDecisionId = decision.id;
        setDecisionId(currentDecisionId);

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
          console.error('Failed to get AI response');
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

      // TODO: Call AI API to process message and generate response
      // For now, just add a placeholder response
      const { data: assistantMessage } = await supabase
        .from('messages')
        .insert({
          decision_id: currentDecisionId,
          role: 'assistant',
          content: 'Thank you for sharing that. I\'m analyzing your problem and will ask a few clarifying questions to better understand your situation.',
          step_label: 'Understanding your problem',
        })
        .select()
        .single();

      if (assistantMessage) {
        setMessages((prev) => [...prev, assistantMessage as Message]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
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
        />
      </main>
    </div>
  );
}
