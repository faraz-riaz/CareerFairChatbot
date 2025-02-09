import React from 'react';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import { cn } from '../lib/utils';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div
      className={cn(
        'flex gap-4 p-6',
        message.role === 'bot' ? 'bg-gray-50' : 'bg-white'
      )}
    >
      <div className="flex-shrink-0">
        {message.role === 'bot' ? (
          <Bot className="h-6 w-6 text-purple-500" />
        ) : (
          <User className="h-6 w-6 text-gray-500" />
        )}
      </div>
      <div className="prose prose-sm max-w-none flex-1">
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
    </div>
  );
}