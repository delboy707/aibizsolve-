'use client';

import { Message } from '@/types';
import { useEffect, useState } from 'react';

interface MessageListProps {
  messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-3xl rounded-xl px-4 py-3 shadow-sm ${
              message.role === 'user'
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-200 text-gray-900'
            }`}
          >
            {message.step_label && (
              <div className={`text-xs font-medium mb-2 ${
                message.role === 'user' ? 'text-primary-100' : 'text-primary-600'
              }`}>
                {message.step_label}
              </div>
            )}
            <div className="whitespace-pre-wrap">{message.content}</div>
            {mounted && (
              <div className={`text-xs mt-2 ${
                message.role === 'user' ? 'text-primary-100' : 'text-gray-500'
              }`}>
                {new Date(message.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
