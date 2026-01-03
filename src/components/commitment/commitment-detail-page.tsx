'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { Header } from '@/components/layout/header';
import { useCommitment } from '@/hooks/useCommitments';
import { useRealtimeOperations } from '@/hooks/useRealtime';
import { getCommitmentTimeline, getExternalRefs } from '@/lib/mentu/state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClaimDialog } from './claim-dialog';
import { ReleaseDialog } from './release-dialog';
import { CloseWithEvidenceDialog } from './close-with-evidence-dialog';
import { AnnotateDialog } from './annotate-dialog';
import { CommitmentTimeline } from './commitment-timeline';
import { DiffViewer } from '@/components/diff/DiffViewer';
import { relativeTime, absoluteTime, getActor } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, ExternalLink, Github, GitBranch, Clock } from 'lucide-react';

interface CommitmentDetailPageProps {
  workspaceName: string;
  workspaceId: string;
  commitmentId: string;
  user: User;
}

export function CommitmentDetailPage({
  workspaceName,
  workspaceId,
  commitmentId,
  user,
}: CommitmentDetailPageProps) {
  const [claimOpen, setClaimOpen] = useState(false);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [annotateOpen, setAnnotateOpen] = useState(false);

  const { commitment, operations, isLoading } = useCommitment(workspaceId, commitmentId);
  useRealtimeOperations(workspaceId);

  const actor = getActor(user);
  const isOwner = commitment?.owner === actor;
  const canClaim = commitment?.state === 'open';
  const canRelease = commitment?.state === 'claimed' && isOwner;
  const canClose = commitment?.state === 'claimed' && isOwner;

  const timeline = operations ? getCommitmentTimeline(operations, commitmentId) : [];
  const externalRefs = operations ? getExternalRefs(operations, commitmentId) : [];

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header user={user} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!commitment) {
    return (
      <div className="flex flex-col h-full">
        <Header user={user} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500">Commitment not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header user={user} />

      <div className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        {/* Back link */}
        <Link
          href={`/workspace/${workspaceName}/commitments`}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Commitments
        </Link>

        {/* Header */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-sm text-zinc-500 font-mono">{commitment.id}</code>
                <Badge variant={commitment.state}>{commitment.state}</Badge>
              </div>
              <h1 className="text-xl font-bold">{commitment.body}</h1>
            </div>
          </div>

          {/* External refs (GitHub badges) */}
          {externalRefs.length > 0 && (
            <div className="flex gap-2 mb-4">
              {externalRefs.map((ref) => {
                try {
                  const data = JSON.parse(ref.body);
                  if (data.system === 'github') {
                    return (
                      <a
                        key={ref.id}
                        href={data.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      >
                        <Github className="h-4 w-4" />
                        #{data.id}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    );
                  }
                } catch {
                  return null;
                }
                return null;
              })}
            </div>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
            <div>
              <span className="text-zinc-400">Created by</span>{' '}
              <Link
                href={`/workspace/${workspaceName}/actors/${commitment.actor}`}
                className="font-medium hover:underline"
              >
                {commitment.actor}
              </Link>
            </div>
            <Tooltip>
              <TooltipTrigger>
                <span>{relativeTime(commitment.ts)}</span>
              </TooltipTrigger>
              <TooltipContent>{absoluteTime(commitment.ts)}</TooltipContent>
            </Tooltip>
            {commitment.owner && (
              <div>
                <span className="text-zinc-400">Owner</span>{' '}
                <Link
                  href={`/workspace/${workspaceName}/actors/${commitment.owner}`}
                  className="font-medium hover:underline"
                >
                  {commitment.owner}
                </Link>
              </div>
            )}
          </div>

          {/* Source memory link */}
          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-500 mb-1">Source Memory</p>
            <Link
              href={`/workspace/${workspaceName}/memories/${commitment.source}`}
              className="text-sm font-mono hover:underline"
            >
              {commitment.source}
            </Link>
          </div>

          {/* Tags */}
          {commitment.tags && commitment.tags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 mb-2">Tags</p>
              <div className="flex gap-1">
                {commitment.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Evidence (if closed) */}
          {commitment.state === 'closed' && commitment.evidence && (
            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 mb-1">Evidence</p>
              <Link
                href={`/workspace/${workspaceName}/memories/${commitment.evidence}`}
                className="text-sm font-mono hover:underline"
              >
                {commitment.evidence}
              </Link>
              {commitment.closed_by && (
                <p className="text-sm text-zinc-500 mt-1">
                  Closed by{' '}
                  <Link
                    href={`/workspace/${workspaceName}/actors/${commitment.closed_by}`}
                    className="font-medium hover:underline"
                  >
                    {commitment.closed_by}
                  </Link>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {canClaim && (
            <Button onClick={() => setClaimOpen(true)}>Claim</Button>
          )}
          {canRelease && (
            <Button variant="outline" onClick={() => setReleaseOpen(true)}>
              Release
            </Button>
          )}
          {canClose && (
            <Button onClick={() => setCloseOpen(true)}>
              Close with Evidence
            </Button>
          )}
          <Button variant="outline" onClick={() => setAnnotateOpen(true)}>
            Annotate
          </Button>
        </div>

        {/* Tabbed content: Details, Changes, Timeline */}
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="timeline" className="gap-1.5">
              <Clock className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="changes" className="gap-1.5">
              <GitBranch className="h-4 w-4" />
              Changes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <CommitmentTimeline
                operations={timeline}
                workspaceName={workspaceName}
              />
            </div>
          </TabsContent>

          <TabsContent value="changes">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <DiffViewer
                commitmentId={commitmentId}
                pollingInterval={5000}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <ClaimDialog
        open={claimOpen}
        onOpenChange={setClaimOpen}
        workspaceId={workspaceId}
        commitmentId={commitmentId}
        user={user}
      />
      <ReleaseDialog
        open={releaseOpen}
        onOpenChange={setReleaseOpen}
        workspaceId={workspaceId}
        commitmentId={commitmentId}
        user={user}
      />
      <CloseWithEvidenceDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        workspaceId={workspaceId}
        commitmentId={commitmentId}
        user={user}
      />
      <AnnotateDialog
        open={annotateOpen}
        onOpenChange={setAnnotateOpen}
        workspaceId={workspaceId}
        targetId={commitmentId}
        user={user}
      />
    </div>
  );
}
