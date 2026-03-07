'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { relativeTime, absoluteTime } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { OperationRow, CommitPayload, ClaimPayload } from '@/lib/mentu/types';
import { Target, Hand, ArrowRightLeft, CheckCircle, Send, ThumbsUp, RotateCcw, Upload, Activity, type LucideIcon } from 'lucide-react';

const opIcons: Record<string, LucideIcon> = {
  commit: Target,
  claim: Hand,
  release: ArrowRightLeft,
  close: CheckCircle,
  submit: Send,
  approve: ThumbsUp,
  reopen: RotateCcw,
  publish: Upload,
};

const opLabels: Record<string, string> = {
  commit: 'committed',
  claim: 'claimed',
  release: 'released',
  close: 'closed',
  submit: 'submitted',
  approve: 'approved',
  reopen: 'reopened',
  publish: 'published',
};

function getOpDescription(op: OperationRow): string {
  switch (op.op) {
    case 'commit':
      return (op.payload as CommitPayload).body.slice(0, 50);
    case 'claim':
    case 'release':
    case 'close':
    case 'submit':
    case 'approve':
    case 'reopen':
      return (op.payload as ClaimPayload).commitment;
    default:
      return '';
  }
}

// Only show meaningful state transitions — captures/annotates flood the feed
const significantOps = ['commit', 'claim', 'release', 'close', 'submit', 'approve', 'reopen', 'publish'];

interface CrossWorkspaceFeedProps {
  workspaceNames?: Map<string, string>;
}

export function CrossWorkspaceFeed({ workspaceNames }: CrossWorkspaceFeedProps) {
  const supabase = createClient();

  const { data: operations, isLoading } = useQuery({
    queryKey: ['cross-workspace-operations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operations')
        .select('*')
        .in('op', significantOps)
        .order('synced_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as unknown as OperationRow[];
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  return (
    <div>
      <h2 className="text-xs font-medium tracking-wider text-zinc-400 dark:text-zinc-600 uppercase mb-3 flex items-center gap-1.5">
        <Activity className="h-3 w-3" />
        Recent Activity
      </h2>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
        {isLoading && (
          <div className="py-8 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
          </div>
        )}

        {!isLoading && (!operations || operations.length === 0) && (
          <div className="py-8 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No recent activity</p>
          </div>
        )}

        {operations?.map((op) => {
          const Icon = opIcons[op.op] || Target;
          const description = getOpDescription(op);
          const wsName = workspaceNames?.get(op.workspace_id);

          return (
            <div
              key={op.id}
              className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <div className="mt-0.5 shrink-0">
                <Icon className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  {wsName && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 mr-1.5">
                      {wsName}
                    </span>
                  )}
                  <span className="font-medium">{op.actor}</span>{' '}
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {opLabels[op.op] || op.op}
                  </span>
                </p>
                {description && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                    {description}
                  </p>
                )}
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-600 shrink-0">
                    {relativeTime(op.ts)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {absoluteTime(op.ts)}
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </div>
  );
}
