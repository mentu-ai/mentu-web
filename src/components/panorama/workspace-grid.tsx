'use client';

import Link from 'next/link';
import { relativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { PanoramaWorkspace } from '@/lib/mentu/types';
import { Target, Play, FolderOpen, ArrowUpRight } from 'lucide-react';

interface WorkspaceGridProps {
  workspaces: PanoramaWorkspace[];
}

export function WorkspaceGrid({ workspaces }: WorkspaceGridProps) {
  if (workspaces.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 py-12 text-center">
        <FolderOpen className="h-6 w-6 text-zinc-400 dark:text-zinc-600 mx-auto mb-3" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No workspaces registered
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {workspaces.map((ws) => {
        const hasActivity = ws.active_sequences.length > 0;

        return (
          <Link key={ws.workspace_id} href={`/workspace/${ws.name}`} className="group">
            <div
              className={cn(
                'relative rounded-lg border bg-white dark:bg-zinc-900 p-4 h-full transition-all duration-200',
                'border-zinc-200 dark:border-zinc-800',
                'hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm',
                hasActivity && 'border-l-2 border-l-blue-500 dark:border-l-blue-400'
              )}
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-sm truncate">{ws.name}</span>
                  {ws.stack && (
                    <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                      {ws.stack}
                    </span>
                  )}
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />
                  <span className="font-mono">{ws.stats.open}</span> open
                </span>
                <span>
                  <span className="font-mono">{ws.stats.claimed}</span> claimed
                </span>
                {ws.stats.in_review > 0 && (
                  <span className="text-amber-600 dark:text-amber-400">
                    <span className="font-mono">{ws.stats.in_review}</span> review
                  </span>
                )}
              </div>

              {/* Running sequences */}
              {hasActivity && (
                <div className="flex items-center gap-1.5 mt-2.5 text-xs text-blue-600 dark:text-blue-400">
                  <Play className="h-3 w-3" />
                  {ws.active_sequences.length} sequence{ws.active_sequences.length !== 1 ? 's' : ''} running
                </div>
              )}

              {/* Last activity */}
              {ws.last_activity_at && (
                <p className="text-[11px] text-zinc-400 dark:text-zinc-600 mt-2.5">
                  Last activity {relativeTime(ws.last_activity_at)}
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
