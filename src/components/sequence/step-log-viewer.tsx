'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useWorkflowStepLogs } from '@/hooks/useWorkflowStepLogs';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface StepLogViewerProps {
  instanceId: string;
  stepId: string;
  defaultOpen?: boolean;
}

export function StepLogViewer({ instanceId, stepId, defaultOpen = false }: StepLogViewerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { logs, isConnected } = useWorkflowStepLogs({
    instanceId,
    stepId,
    enabled: isOpen,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="mt-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
      >
        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        Logs {isConnected && <span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-1" />}
      </button>

      {isOpen && (
        <div
          ref={scrollRef}
          className="mt-1 max-h-48 overflow-auto rounded bg-zinc-900 dark:bg-zinc-950 p-3 font-mono text-xs leading-relaxed"
        >
          {logs.length === 0 ? (
            <span className="text-zinc-500">No logs yet</span>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  'whitespace-pre-wrap break-all',
                  log.stream === 'stderr'
                    ? 'text-red-400'
                    : 'text-zinc-300'
                )}
              >
                {log.message}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
