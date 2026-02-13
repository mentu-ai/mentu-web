'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { useMemory } from '@/hooks/useMemories';
import { useOperations } from '@/hooks/useOperations';
import { useRealtimeOperations } from '@/hooks/useRealtime';
import { getCommitmentsFromSource, getCommitmentsWithEvidence } from '@/lib/mentu/state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnnotateDialog } from '@/components/commitment/annotate-dialog';
import { CreateCommitmentDialog } from '@/components/commitment/create-commitment-dialog';
import { DismissDialog } from '@/components/memory/dismiss-dialog';
import { relativeTime, absoluteTime } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Target, CheckCircle } from 'lucide-react';

interface MemoryDetailPageProps {
  workspaceName: string;
  workspaceId: string;
  memoryId: string;
  user: User;
}

export function MemoryDetailPage({
  workspaceName,
  workspaceId,
  memoryId,
  user,
}: MemoryDetailPageProps) {
  const [annotateOpen, setAnnotateOpen] = useState(false);
  const [commitOpen, setCommitOpen] = useState(false);
  const [dismissOpen, setDismissOpen] = useState(false);

  const { memory, isLoading } = useMemory(workspaceId, memoryId);
  const { data: operations } = useOperations(workspaceId);
  useRealtimeOperations(workspaceId);

  // Find commitments that reference this memory
  const commitmentsFromSource = useMemo(() => {
    if (!operations) return [];
    return getCommitmentsFromSource(operations, memoryId);
  }, [operations, memoryId]);

  const commitmentsWithEvidence = useMemo(() => {
    if (!operations) return [];
    return getCommitmentsWithEvidence(operations, memoryId);
  }, [operations, memoryId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-zinc-500">Memory not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/workspace/${workspaceName}/execution/memories`}
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Memories
      </Link>

      {/* Memory Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <code className="text-sm text-zinc-500 font-mono">{memory.id}</code>
              {memory.kind && (
                <Badge variant="secondary">{memory.kind}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Body content */}
        <div className="prose dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap">{memory.body}</p>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500">
          <div>
            <span className="text-zinc-400">Captured by</span>{' '}
            <span className="font-medium">{memory.actor}</span>
          </div>
          <Tooltip>
            <TooltipTrigger>
              <span>{relativeTime(memory.ts)}</span>
            </TooltipTrigger>
            <TooltipContent>{absoluteTime(memory.ts)}</TooltipContent>
          </Tooltip>
        </div>

        {/* Refs */}
        {memory.refs && memory.refs.length > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 mb-2">References</p>
            <div className="flex gap-2 flex-wrap">
              {memory.refs.map((ref) => (
                <Link
                  key={ref}
                  href={
                    ref.startsWith('mem_')
                      ? `/workspace/${workspaceName}/execution/memories/${ref}`
                      : `/workspace/${workspaceName}/execution/commitments/${ref}`
                  }
                  className="text-sm font-mono hover:underline"
                >
                  {ref}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Meta data */}
        {memory.meta && Object.keys(memory.meta).length > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 mb-2">Metadata</p>
            <pre className="text-xs bg-zinc-100 dark:bg-zinc-800 p-3 rounded-md overflow-auto">
              {JSON.stringify(memory.meta, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => setCommitOpen(true)}>
          <Target className="h-4 w-4 mr-2" />
          Create Commitment from this
        </Button>
        <Button variant="outline" onClick={() => setAnnotateOpen(true)}>
          Annotate
        </Button>
        <Button variant="destructive" onClick={() => setDismissOpen(true)}>
          Dismiss
        </Button>
      </div>

      {/* Commitments using this as source */}
      {commitmentsFromSource.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Commitments from this source ({commitmentsFromSource.length})
          </h2>
          <div className="space-y-2">
            {commitmentsFromSource.map((cmt) => (
              <Link
                key={cmt.id}
                href={`/workspace/${workspaceName}/execution/commitments/${cmt.id}`}
                className="block p-3 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <code className="text-xs text-zinc-500 font-mono">{cmt.id}</code>
                    <p className="text-sm mt-1">{cmt.body}</p>
                  </div>
                  <Badge variant={cmt.state}>{cmt.state}</Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Commitments using this as evidence */}
      {commitmentsWithEvidence.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Used as Evidence ({commitmentsWithEvidence.length})
          </h2>
          <div className="space-y-2">
            {commitmentsWithEvidence.map((cmt) => (
              <Link
                key={cmt.id}
                href={`/workspace/${workspaceName}/execution/commitments/${cmt.id}`}
                className="block p-3 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <code className="text-xs text-zinc-500 font-mono">{cmt.id}</code>
                    <p className="text-sm mt-1">{cmt.body}</p>
                  </div>
                  <Badge variant="closed">closed</Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Annotations */}
      {memory.annotations.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
          <h2 className="font-semibold mb-4">Annotations ({memory.annotations.length})</h2>
          <div className="space-y-4">
            {memory.annotations.map((annotation) => (
              <div
                key={annotation.id}
                className="p-3 rounded-md bg-zinc-50 dark:bg-zinc-800"
              >
                <div className="flex items-center gap-2 mb-2 text-sm">
                  <span className="font-medium">{annotation.actor}</span>
                  {annotation.kind && (
                    <Badge variant="outline" className="text-xs">
                      {annotation.kind}
                    </Badge>
                  )}
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="text-zinc-400">{relativeTime(annotation.ts)}</span>
                    </TooltipTrigger>
                    <TooltipContent>{absoluteTime(annotation.ts)}</TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-sm">{annotation.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AnnotateDialog
        open={annotateOpen}
        onOpenChange={setAnnotateOpen}
        workspaceId={workspaceId}
        targetId={memoryId}
        user={user}
      />
      <CreateCommitmentDialog
        open={commitOpen}
        onOpenChange={setCommitOpen}
        workspaceId={workspaceId}
        user={user}
        defaultSourceId={memoryId}
      />
      <DismissDialog
        open={dismissOpen}
        onOpenChange={setDismissOpen}
        workspaceId={workspaceId}
        memoryId={memoryId}
        user={user}
      />
    </div>
  );
}
