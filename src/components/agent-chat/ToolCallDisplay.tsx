'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Terminal, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolCallDisplayProps {
  toolName: string;
  input?: Record<string, unknown>;
  output?: string;
  isResult?: boolean;
}

export function ToolCallDisplay({ toolName, input, output, isResult }: ToolCallDisplayProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 text-left',
          'bg-zinc-50 dark:bg-zinc-800/50',
          'hover:bg-zinc-100 dark:hover:bg-zinc-800',
          'transition-colors'
        )}
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        )}

        <Terminal className="w-3.5 h-3.5 text-zinc-500" />

        <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
          {toolName}
        </span>

        {isResult && (
          <CheckCircle className="w-3.5 h-3.5 text-green-500 ml-auto" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-zinc-200 dark:border-zinc-700">
          {input && (
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-700">
              <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">Input</p>
              <pre className="text-xs font-mono text-zinc-600 dark:text-zinc-300 overflow-x-auto">
                {JSON.stringify(input, null, 2)}
              </pre>
            </div>
          )}

          {output && (
            <div className="p-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">Output</p>
              <pre className="text-xs font-mono text-zinc-600 dark:text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                {output.length > 500 ? `${output.slice(0, 500)}...` : output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
