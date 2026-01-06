'use client';

import { useRef, useEffect } from 'react';
import { useAgentChatContext } from '@/contexts/AgentChatContext';
import { ChatMessage } from './ChatMessage';

export function ChatMessages() {
  const { messages, isStreaming } = useAgentChatContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScroll.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  // Detect if user has scrolled up
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 100;
  };

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-zinc-400 dark:text-zinc-500">
          <p className="text-sm">No messages yet</p>
          <p className="text-xs mt-1">Start a conversation with the agent</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto p-4 space-y-4"
    >
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {isStreaming && (
        <div className="flex items-center gap-2 text-zinc-400 text-sm">
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>
      )}
    </div>
  );
}
