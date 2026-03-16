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
  pendingUploads?: UploadedDocument[];
  onUploadComplete?: (document: UploadedDocument) => void;
}

export default function ChatInterface({
  decisionId,
  messages = [],
  onSendMessage,
  pendingUploads = [],
  onUploadComplete
}: ChatInterfaceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>(pendingUploads);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync pendingUploads prop changes
  useEffect(() => {
    if (pendingUploads.length > 0) {
      setUploadedDocs(prev => {
        const existingIds = new Set(prev.map(d => d.id));
        const newDocs = pendingUploads.filter(d => !existingIds.has(d.id));
        return [...prev, ...newDocs];
      });
    }
  }, [pendingUploads]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    setIsLoading(true);
    setCurrentStep('Processing your request...');
    setError(null);

    try {
      await onSendMessage(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
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
    // Notify parent component about the upload
    if (onUploadComplete) {
      onUploadComplete(document);
    }
  };

  const handleRemoveDoc = (docId: string) => {
    setUploadedDocs(prev => prev.filter(d => d.id !== docId));
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

        {error && (
          <div className="mx-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
            <span className="shrink-0 mt-0.5">⚠</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4 shadow-sm space-y-3">
        {/* File upload — always visible (works with or without decisionId) */}
        <FileUpload
          decisionId={decisionId}
          onUploadComplete={handleUploadComplete}
        />

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
                {!decisionId && (
                  <button
                    onClick={() => handleRemoveDoc(doc.id)}
                    className="text-gray-400 hover:text-red-500 ml-1"
                    title="Remove file"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
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
