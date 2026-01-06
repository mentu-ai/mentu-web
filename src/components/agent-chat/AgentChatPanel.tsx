'use client';

import { useRef } from 'react';
import { X, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgentChatContext } from '@/contexts/AgentChatContext';
import { useAgentChat } from '@/hooks/useAgentChat';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';

export function AgentChatPanel() {
  const { isOpen, close, status, isStreaming } = useAgentChatContext();
  const { sendMessage } = useAgentChat();
  const panelRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className={cn(
        'fixed right-0 top-11 bottom-0 w-full md:w-[420px]',
        'bg-white dark:bg-zinc-900',
        'border-l border-zinc-200 dark:border-zinc-700',
        'shadow-xl z-30',
        'flex flex-col',
        'transform transition-transform duration-200 ease-out',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-zinc-500" />
          <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
            Agent Chat
          </span>
          {isStreaming && (
            <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Connection status indicator */}
          <span className={cn(
            'text-[10px] px-1.5 py-0.5 rounded',
            status === 'connected' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            status === 'connecting' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            status === 'disconnected' && 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
            status === 'error' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
          )}>
            {status}
          </span>

          <button
            onClick={close}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ChatMessages />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-200 dark:border-zinc-700">
        <ChatInput onSend={sendMessage} disabled={status !== 'connected' || isStreaming} />
      </div>
    </div>
  );
}
