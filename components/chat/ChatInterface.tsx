'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, UploadedDocument } from '@/types';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ExamplePrompts from './ExamplePrompts';
import ProgressIndicator from './ProgressIndicator';
import FileUpload from './FileUpload';

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
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
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

  const handleUploadComplete = (document: UploadedDocument) => {
    setUploadedDocs(prev => [...prev, document]);
    // Optionally send a message indicating document was uploaded
    handleSendMessage(`[Document uploaded: ${document.file_name}]`);
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
      <div className="border-t border-gray-200 bg-white p-4 shadow-sm space-y-3">
        {decisionId && (
          <FileUpload
            decisionId={decisionId}
            onUploadComplete={handleUploadComplete}
          />
        )}

        {uploadedDocs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {uploadedDocs.map(doc => (
              <div
                key={doc.id}
                className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-sm"
              >
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-700">{doc.file_name}</span>
                <span className="text-green-600">
                  {doc.processing_status === 'completed' ? '✓' : '⏳'}
                </span>
              </div>
            ))}
          </div>
        )}

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
