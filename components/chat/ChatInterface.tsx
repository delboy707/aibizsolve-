'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from '@/types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ExamplePrompts from './ExamplePrompts';
import ProgressIndicator from './ProgressIndicator';

interface ChatInterfaceProps {
  decisionId?: string;
  messages?: Message[];
  onSendMessage: (content: string) => Promise<void>;
}

export default function ChatInterface({
  decisionId,
  messages = [],
  onSendMessage
}: ChatInterfaceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    setIsLoading(true);
    setCurrentStep('Processing your request...');

    try {
      await onSendMessage(content);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
      setCurrentStep('');
    }
  };

  const handleExampleClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const showExamples = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {showExamples ? (
          <ExamplePrompts onExampleClick={handleExampleClick} />
        ) : (
          <>
            <MessageList messages={messages} />
            <div ref={messagesEndRef} />
          </>
        )}

        {isLoading && <ProgressIndicator step={currentStep} />}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4 shadow-sm">
        <MessageInput
          onSend={handleSendMessage}
          disabled={isLoading}
          placeholder={
            showExamples
              ? "Describe your business challenge..."
              : "Ask a follow-up question or provide more details..."
          }
        />
      </div>
    </div>
  );
}
