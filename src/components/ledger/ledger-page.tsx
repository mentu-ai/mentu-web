'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { Header } from '@/components/layout/header';
import { useOperations } from '@/hooks/useOperations';
import { useRealtimeOperations } from '@/hooks/useRealtime';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { relativeTime, absoluteTime } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { OperationType, OperationRow } from '@/lib/mentu/types';
import { Camera, Target, Hand, ArrowRightLeft, CheckCircle, MessageSquare, Download, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LedgerPageProps {
  workspaceName: string;
  workspaceId: string;
  user: User;
}

const opIcons: Record<OperationType, typeof Camera> = {
  capture: Camera,
  commit: Target,
  claim: Hand,
  release: ArrowRightLeft,
  close: CheckCircle,
  annotate: MessageSquare,
};

const opColors: Record<OperationType, string> = {
  capture: 'text-blue-600',
  commit: 'text-purple-600',
  claim: 'text-blue-600',
  release: 'text-zinc-600',
  close: 'text-green-600',
  annotate: 'text-zinc-600',
};

export function LedgerPage({
  workspaceName,
  workspaceId,
  user,
}: LedgerPageProps) {
  const [filter, setFilter] = useState<OperationType | 'all'>('all');

  const { data: operations, isLoading } = useOperations(workspaceId);
  useRealtimeOperations(workspaceId);

  const filteredOperations = useMemo(() => {
    if (!operations) return [];
    if (filter === 'all') return operations;
    return operations.filter((op) => op.op === filter);
  }, [operations, filter]);

  // Sort by newest first
  const sortedOperations = useMemo(() => {
    return [...filteredOperations].sort(
      (a, b) => new Date(b.synced_at || b.ts).getTime() - new Date(a.synced_at || a.ts).getTime()
    );
  }, [filteredOperations]);

  const handleDownload = () => {
    if (!operations) return;

    const jsonl = operations
      .map((op) => JSON.stringify(op))
      .join('\n');

    const blob = new Blob([jsonl], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workspaceName}-ledger.jsonl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: 'Ledger exported as JSONL',
    });
  };

  const handleCopyOperation = (op: OperationRow) => {
    navigator.clipboard.writeText(JSON.stringify(op, null, 2));
    toast({
      title: 'Copied',
      description: 'Operation JSON copied to clipboard',
    });
  };

  return (
    <div className="flex flex-col h-full">
      <Header user={user} />

      <div className="flex-1 p-4 md:p-6 space-y-4 overflow-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Ledger</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {operations?.length ?? 0} operations
            </p>
          </div>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Export JSONL
          </Button>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="capture">Capture</TabsTrigger>
            <TabsTrigger value="commit">Commit</TabsTrigger>
            <TabsTrigger value="claim">Claim</TabsTrigger>
            <TabsTrigger value="release">Release</TabsTrigger>
            <TabsTrigger value="close">Close</TabsTrigger>
            <TabsTrigger value="annotate">Annotate</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="py-8 text-center text-zinc-500">Loading...</div>
        ) : sortedOperations.length === 0 ? (
          <div className="py-8 text-center text-zinc-500">
            No operations found
          </div>
        ) : (
          <div className="space-y-2">
            {sortedOperations.map((op) => {
              const Icon = opIcons[op.op];
              const link = op.op === 'capture'
                ? `/workspace/${workspaceName}/memories/${op.id}`
                : op.op === 'commit'
                ? `/workspace/${workspaceName}/commitments/${op.id}`
                : '#';

              return (
                <div
                  key={op.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Icon className={`h-5 w-5 mt-0.5 ${opColors[op.op]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary">{op.op}</Badge>
                          <code className="text-xs text-zinc-500 font-mono">
                            {op.id}
                          </code>
                          <span className="text-sm text-zinc-500">
                            by {op.actor}
                          </span>
                        </div>
                        <pre className="mt-2 text-xs bg-zinc-100 dark:bg-zinc-800 p-2 rounded overflow-auto max-h-32">
                          {JSON.stringify(op.payload, null, 2)}
                        </pre>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-xs text-zinc-400">
                            {relativeTime(op.ts)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{absoluteTime(op.ts)}</TooltipContent>
                      </Tooltip>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopyOperation(op)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {link !== '#' && (
                          <Link href={link}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs">
                              View
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
