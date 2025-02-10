import React from 'react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import { User, Bot } from 'lucide-react';
import { TypewriterText } from './TypewriterText';

interface ChatMessageProps {
  message: Message;
  isNew?: boolean;
}

export function ChatMessage({ message, isNew = false }: ChatMessageProps) {
  const isUser = message.role === 'user';

  const MarkdownContent = () => (
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          // Override pre and code block styling
          pre: ({ node, ...props }) => (
            <pre
              className={`mt-2 p-2 rounded bg-gray-800 dark:bg-gray-900 text-gray-200 overflow-x-auto`}
              {...props}
            />
          ),
          code: ({ node, inline, ...props }) =>
            inline ? (
              <code
                className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                {...props}
              />
            ) : (
              <code {...props} />
            ),
        }}
      >
        {message.content}
      </ReactMarkdown>
    </div>
  );

  return (
    <div
      className={`p-4 flex ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} max-w-[80%] gap-3`}>
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isUser
              ? 'bg-purple-100 dark:bg-purple-900'
              : 'bg-gray-100 dark:bg-gray-700'
          }`}
        >
          {isUser ? (
            <User className="h-5 w-5 text-purple-600 dark:text-purple-300" />
          ) : (
            <Bot className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          )}
        </div>

        {/* Message Bubble */}
        <div
          className={`flex flex-col gap-1 ${
            isUser ? 'items-end' : 'items-start'
          }`}
        >
          <div
            className={`rounded-2xl px-4 py-2 ${
              isUser
                ? 'bg-purple-500 text-white dark:bg-purple-600'
                : 'bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-200 shadow-sm'
            }`}
          >
            {isUser || !isNew ? (
              <div className={`prose max-w-none ${
                isUser 
                  ? 'dark:prose-invert prose-p:text-white prose-headings:text-white'
                  : 'prose-gray dark:prose-invert'
              }`}>
                <ReactMarkdown
                  components={{
                    pre: ({ node, ...props }) => (
                      <pre
                        className={`mt-2 p-2 rounded ${
                          isUser
                            ? 'bg-purple-600/50 dark:bg-gray-900 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200'
                        } overflow-x-auto`}
                        {...props}
                      />
                    ),
                    code: ({ node, inline, ...props }) =>
                      inline ? (
                        <code
                          className={`px-1 py-0.5 rounded ${
                            isUser
                              ? 'bg-purple-600/50 dark:bg-gray-800 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200'
                          }`}
                          {...props}
                        />
                      ) : (
                        <code {...props} />
                      ),
                    a: ({ node, ...props }) => (
                      <a
                        className={`underline ${
                          isUser
                            ? 'text-white hover:text-purple-100'
                            : 'text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300'
                        }`}
                        {...props}
                      />
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <TypewriterText content={message.content} />
            )}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 px-2">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}