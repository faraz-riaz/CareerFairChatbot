import React from 'react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`p-6 ${
        isUser
          ? 'bg-purple-50 dark:bg-purple-900/20'
          : 'bg-gray-50 dark:bg-gray-800/50'
      }`}
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start gap-4">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isUser
                ? 'bg-purple-200 dark:bg-purple-700 text-purple-700 dark:text-purple-200'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
            }`}
          >
            {isUser ? 'U' : 'A'}
          </div>
          <div className="flex-1 space-y-2">
            <div
              className={`font-medium ${
                isUser
                  ? 'text-purple-700 dark:text-purple-300'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {isUser ? 'You' : 'Assistant'}
            </div>
            <div className="text-gray-800 dark:text-gray-200">
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}