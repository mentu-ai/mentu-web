'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleSubmit = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-3">
      <div className={cn(
        'flex items-end gap-2 p-2 rounded-lg',
        'bg-zinc-50 dark:bg-zinc-800',
        'border border-zinc-200 dark:border-zinc-700',
        'focus-within:border-blue-500 dark:focus-within:border-blue-500',
        'transition-colors'
      )}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Connecting...' : 'Type a message...'}
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 resize-none bg-transparent',
            'text-sm text-zinc-900 dark:text-zinc-100',
            'placeholder-zinc-400 dark:placeholder-zinc-500',
            'outline-none',
            'disabled:opacity-50'
          )}
        />

        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className={cn(
            'p-1.5 rounded-md',
            'bg-blue-500 text-white',
            'hover:bg-blue-600',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors'
          )}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[10px] text-zinc-400 mt-1.5 text-center">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
