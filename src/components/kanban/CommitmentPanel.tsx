'use client';

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { useCommitment } from '@/hooks/useCommitments';
import { useBridgeCommands } from '@/hooks/useBridgeCommands';
import { getCommitmentTimeline } from '@/lib/mentu/state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommitmentTimeline } from '@/components/commitment/commitment-timeline';
import { DiffViewer } from '@/components/diff/DiffViewer';
import { BridgeLogsViewer } from './BridgeLogsViewer';
import { SpawnAgentButton } from './actions/SpawnAgentButton';
import { DevServerButton } from './actions/DevServerButton';
import { CreatePRButton } from './actions/CreatePRButton';
import { MergeButton } from './actions/MergeButton';
import { relativeTime, absoluteTime } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  GitBranch,
  FolderTree,
  Clock,
  User as UserIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommitmentPanelProps {
  commitmentId: string | null;
  onClose: () => void;
  workspaceName: string;
  workspaceId: string;
  user: User;
}

export function CommitmentPanel({
  commitmentId,
  onClose,
  workspaceName,
  workspaceId,
  // user is available for future use (e.g., action authorization)
}: CommitmentPanelProps) {
  const [activeTab, setActiveTab] = useState('timeline');
  const [copied, setCopied] = useState(false);

  const { commitment, operations, isLoading } = useCommitment(workspaceId, commitmentId || '');
  const { data: bridgeCommands } = useBridgeCommands(workspaceId);

  // Find active bridge command for this commitment
  const activeBridgeCommand = bridgeCommands?.find(
    (cmd) => cmd.commitment_id === commitmentId && (cmd.status === 'running' || cmd.status === 'pending')
  );

  // Get timeline for this commitment
  const timeline = commitment && operations
    ? getCommitmentTimeline(operations, commitment.id)
    : [];

  // Check if worktree exists (claimed, in_review, or reopened states)
  const hasWorktree = commitment ? ['claimed', 'in_review', 'reopened'].includes(commitment.state) : false;

  // Generate worktree path (convention: /worktrees/{commitment_id})
  const worktreePath = commitment ? `/worktrees/${commitment.id}` : null;

  // Copy worktree path to clipboard
  const handleCopyPath = async () => {
    if (worktreePath) {
      await navigator.clipboard.writeText(worktreePath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Reset tab when commitment changes
  useEffect(() => {
    if (commitmentId) {
      setActiveTab('timeline');
    }
  }, [commitmentId]);

  // Panel visibility
  const isOpen = commitmentId !== null;

  return (
    <div
      className={cn(
        'fixed right-0 top-14 bottom-0 w-full md:w-[400px] bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-xl transition-transform duration-200 z-20 overflow-hidden flex flex-col',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 min-w-0">
          {commitment && (
            <Badge variant={commitment.state}>
              {commitment.state === 'in_review' ? 'in review' : commitment.state}
            </Badge>
          )}
          <span className="text-xs font-mono text-zinc-500 truncate">
            {commitmentId}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Panel content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-zinc-500">Loading...</div>
        </div>
      ) : commitment ? (
        <div className="flex-1 overflow-auto">
          {/* Commitment body */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <p className="text-sm leading-relaxed">{commitment.body}</p>

            {/* Source memory link */}
            {commitment.source && (
              <a
                href={`/workspace/${workspaceName}/memories/${commitment.source}`}
                className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Source: {commitment.source}
              </a>
            )}
          </div>

          {/* Metadata grid */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-zinc-500 uppercase tracking-wide">Created</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3 text-zinc-400" />
                    {relativeTime(commitment.ts)}
                  </p>
                </TooltipTrigger>
                <TooltipContent>{absoluteTime(commitment.ts)}</TooltipContent>
              </Tooltip>
            </div>

            <div>
              <span className="text-xs text-zinc-500 uppercase tracking-wide">Owner</span>
              <p className="flex items-center gap-1 mt-0.5">
                <UserIcon className="h-3 w-3 text-zinc-400" />
                {commitment.owner || 'Unassigned'}
              </p>
            </div>

            {hasWorktree && (
              <>
                <div className="col-span-2">
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">Worktree Path</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <FolderTree className="h-3 w-3 text-zinc-400" />
                    <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded truncate flex-1">
                      {worktreePath}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={handleCopyPath}
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">Branch</span>
                  <p className="flex items-center gap-1 mt-0.5">
                    <GitBranch className="h-3 w-3 text-zinc-400" />
                    <code className="text-xs">{commitment.id}</code>
                  </p>
                </div>

                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">Base</span>
                  <p className="flex items-center gap-1 mt-0.5">
                    <GitBranch className="h-3 w-3 text-zinc-400" />
                    <code className="text-xs">main</code>
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-2">
            <SpawnAgentButton
              commitment={commitment}
              workspaceId={workspaceId}
              activeBridgeCommand={activeBridgeCommand}
            />
            <DevServerButton
              commitment={commitment}
              workspaceId={workspaceId}
              hasWorktree={hasWorktree}
            />
            <CreatePRButton
              commitment={commitment}
              workspaceId={workspaceId}
              hasWorktree={hasWorktree}
            />
            <MergeButton
              commitment={commitment}
              workspaceId={workspaceId}
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <div className="px-4 border-b border-zinc-200 dark:border-zinc-800">
              <TabsList className="w-full justify-start h-10 bg-transparent p-0">
                <TabsTrigger
                  value="timeline"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-4"
                >
                  Timeline
                </TabsTrigger>
                <TabsTrigger
                  value="logs"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-4"
                >
                  Logs
                </TabsTrigger>
                <TabsTrigger
                  value="changes"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-4"
                >
                  Changes
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="timeline" className="p-4 m-0">
              <CommitmentTimeline operations={timeline} workspaceName={workspaceName} />
            </TabsContent>

            <TabsContent value="logs" className="p-4 m-0">
              <BridgeLogsViewer
                commandId={activeBridgeCommand?.id}
                commitmentId={commitmentId || undefined}
              />
            </TabsContent>

            <TabsContent value="changes" className="p-4 m-0">
              {hasWorktree ? (
                <DiffViewer
                  commitmentId={commitment.id}
                  pollingInterval={activeTab === 'changes' ? 5000 : false}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FolderTree className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-4" />
                  <p className="text-zinc-500 dark:text-zinc-400">No worktree active</p>
                  <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
                    Spawn an agent to create a worktree
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500">Commitment not found</p>
        </div>
      )}
    </div>
  );
}
