'use client';

import { useEffect, useRef, useState } from 'react';
import { useBridgeLogs, useCommitmentLogs } from '@/hooks/useBridgeLogs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Copy,
  Check,
  ArrowDownToLine,
  Pause,
  Terminal,
} from 'lucide-react';

interface BridgeLogsViewerProps {
  commandId?: string;
  commitmentId?: string;
}

export function BridgeLogsViewer({ commandId, commitmentId }: BridgeLogsViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);

  // Use either direct command logs or commitment logs
  const directLogs = useBridgeLogs(commandId);
  const commitmentLogs = useCommitmentLogs(commitmentId, undefined);

  const { logs, isLoading, isStreaming } = commandId ? directLogs : commitmentLogs;

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Copy all logs to clipboard
  const handleCopy = async () => {
    const text = logs.map((log) => log.content).join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Detect scroll position to toggle auto-scroll
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setAutoScroll(isAtBottom);
    }
  };

  // Empty state
  if (!commandId && !commitmentId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Terminal className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-4" />
        <p className="text-zinc-500 dark:text-zinc-400">No agent activity</p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
          Spawn an agent to see logs here
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-zinc-500">Loading logs...</div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Terminal className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-4" />
        <p className="text-zinc-500 dark:text-zinc-400">No logs yet</p>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
          {isStreaming ? 'Waiting for output...' : 'Agent has not produced any output'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isStreaming && (
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Streaming
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setAutoScroll(!autoScroll)}
          >
            {autoScroll ? (
              <>
                <ArrowDownToLine className="h-3 w-3 mr-1" />
                Auto-scroll
              </>
            ) : (
              <>
                <Pause className="h-3 w-3 mr-1" />
                Paused
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Log entries */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto bg-zinc-950 rounded-lg p-3 font-mono text-xs leading-relaxed"
      >
        {logs.map((log) => (
          <LogLine key={log.id} log={log} />
        ))}
      </div>
    </div>
  );
}

interface LogLineProps {
  log: {
    id: string;
    type: 'system' | 'agent' | 'tool' | 'todo' | 'error' | 'task' | 'file';
    content: string;
  };
}

function LogLine({ log }: LogLineProps) {
  const getEmoji = () => {
    switch (log.type) {
      case 'task':
        return '🚀';
      case 'system':
        return '⚙️';
      case 'agent':
        return '💬';
      case 'todo':
        return '📋';
      case 'tool':
        return '🔧';
      case 'file':
        return '📄';
      case 'error':
        return '❌';
      default:
        return '💬';
    }
  };

  const getColor = () => {
    switch (log.type) {
      case 'system':
        return 'text-zinc-400';
      case 'task':
        return 'text-blue-300';
      case 'tool':
        return 'text-yellow-300';
      case 'error':
        return 'text-red-300';
      case 'todo':
        return 'text-purple-300';
      case 'file':
        return 'text-green-300';
      case 'agent':
      default:
        return 'text-zinc-300';
    }
  };

  return (
    <div className={cn('flex gap-2 py-0.5', getColor())}>
      <span className="flex-shrink-0">{getEmoji()}</span>
      <span className="whitespace-pre-wrap break-all">{log.content}</span>
    </div>
  );
}
