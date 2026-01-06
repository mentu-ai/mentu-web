'use client';

import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/lib/agent/types';
import { ToolCallDisplay } from './ToolCallDisplay';
import { User, Bot, AlertCircle } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { role, content, tool_name, tool_input, streaming } = message;

  // Tool use/result messages
  if (role === 'tool_use' || role === 'tool_result') {
    return (
      <ToolCallDisplay
        toolName={tool_name || 'unknown'}
        input={tool_input}
        output={role === 'tool_result' ? content : undefined}
        isResult={role === 'tool_result'}
      />
    );
  }

  // System/error messages
  if (role === 'system') {
    return (
      <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p className="text-sm">{content}</p>
      </div>
    );
  }

  const isUser = role === 'user';

  return (
    <div className={cn(
      'flex gap-3',
      isUser ? 'flex-row-reverse' : 'flex-row'
    )}>
      {/* Avatar */}
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
        isUser
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
      )}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message bubble */}
      <div className={cn(
        'max-w-[80%] rounded-lg px-3 py-2',
        isUser
          ? 'bg-blue-500 text-white'
          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
      )}>
        <p className="text-sm whitespace-pre-wrap break-words">
          {content}
          {streaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse" />
          )}
        </p>
      </div>
    </div>
  );
}
