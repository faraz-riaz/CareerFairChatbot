import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

interface TypewriterTextProps {
  content: string;
  onComplete?: () => void;
}

export function TypewriterText({ content, onComplete }: TypewriterTextProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const userHasScrolled = useRef(false);

  // Track user scroll
  useEffect(() => {
    const handleScroll = () => {
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100;
      if (!isAtBottom) {
        userHasScrolled.current = true;
      } else {
        userHasScrolled.current = false;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setDisplayedContent('');
    setIsComplete(false);
    userHasScrolled.current = false;
    
    const words = content.split(' ');
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        setDisplayedContent(prev => prev + (prev ? ' ' : '') + words[currentIndex]);
        currentIndex++;

        // Only scroll if user hasn't scrolled up
        if (!userHasScrolled.current) {
          requestAnimationFrame(() => {
            containerRef.current?.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'end'
            });
          });
        }
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [content]);

  return (
    <div ref={containerRef} className="prose dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
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
        {isComplete ? content : displayedContent}
      </ReactMarkdown>
    </div>
  );
} 