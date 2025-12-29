'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { Header } from '@/components/layout/header';
import { useCommitments } from '@/hooks/useCommitments';
import { useRealtimeOperations } from '@/hooks/useRealtime';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CaptureMemoryDialog } from '@/components/memory/capture-memory-dialog';
import { CreateCommitmentDialog } from '@/components/commitment/create-commitment-dialog';
import { relativeTime, absoluteTime } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { CommitmentState } from '@/lib/mentu/types';

interface CommitmentsListPageProps {
  workspaceName: string;
  workspaceId: string;
  user: User;
}

export function CommitmentsListPage({
  workspaceName,
  workspaceId,
  user,
}: CommitmentsListPageProps) {
  const [captureOpen, setCaptureOpen] = useState(false);
  const [commitOpen, setCommitOpen] = useState(false);
  const [filter, setFilter] = useState<CommitmentState | 'all'>('all');

  const { commitments, isLoading } = useCommitments(workspaceId);
  useRealtimeOperations(workspaceId);

  const filteredCommitments = useMemo(() => {
    if (filter === 'all') return commitments;
    return commitments.filter((c) => c.state === filter);
  }, [commitments, filter]);

  // Sort by newest first
  const sortedCommitments = useMemo(() => {
    return [...filteredCommitments].sort(
      (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()
    );
  }, [filteredCommitments]);

  const counts = useMemo(() => {
    return {
      all: commitments.length,
      open: commitments.filter((c) => c.state === 'open').length,
      claimed: commitments.filter((c) => c.state === 'claimed').length,
      closed: commitments.filter((c) => c.state === 'closed').length,
    };
  }, [commitments]);

  return (
    <div className="flex flex-col h-full">
      <Header
        user={user}
        onCaptureMemory={() => setCaptureOpen(true)}
        onCreateCommitment={() => setCommitOpen(true)}
      />

      <div className="flex-1 p-4 md:p-6 space-y-4 overflow-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Commitments</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {counts.all} total
            </p>
          </div>
          <Button onClick={() => setCommitOpen(true)}>
            New Commitment
          </Button>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="open">Open ({counts.open})</TabsTrigger>
            <TabsTrigger value="claimed">Claimed ({counts.claimed})</TabsTrigger>
            <TabsTrigger value="closed">Closed ({counts.closed})</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="py-8 text-center text-zinc-500">Loading...</div>
        ) : sortedCommitments.length === 0 ? (
          <div className="py-8 text-center text-zinc-500">
            No commitments found
          </div>
        ) : (
          <div className="space-y-2">
            {sortedCommitments.map((commitment) => (
              <Link
                key={commitment.id}
                href={`/workspace/${workspaceName}/commitments/${commitment.id}`}
                className="block"
              >
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{commitment.body}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        <span className="font-mono text-xs">{commitment.id}</span>
                        <span>by {commitment.actor}</span>
                        <Tooltip>
                          <TooltipTrigger>
                            <span>{relativeTime(commitment.ts)}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {absoluteTime(commitment.ts)}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {commitment.owner && (
                        <span className="text-sm text-zinc-500">
                          {commitment.owner}
                        </span>
                      )}
                      <Badge variant={commitment.state}>
                        {commitment.state}
                      </Badge>
                    </div>
                  </div>
                  {commitment.tags && commitment.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {commitment.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CaptureMemoryDialog
        open={captureOpen}
        onOpenChange={setCaptureOpen}
        workspaceId={workspaceId}
        user={user}
      />
      <CreateCommitmentDialog
        open={commitOpen}
        onOpenChange={setCommitOpen}
        workspaceId={workspaceId}
        user={user}
      />
    </div>
  );
}
