'use client';

import { cn } from '@/lib/utils';
import { relativeTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Commitment } from '@/lib/mentu/types';
import { useKanbanCommitments } from '@/hooks/useKanbanCommitments';

interface CommitmentKanbanProps {
  workspaceId?: string;
  commitments?: Commitment[];
  panoramaMode?: boolean;
  workspaceNames?: Map<string, string>;
}

interface KanbanColumnDef {
  key: string;
  label: string;
  color: string;
  badgeColor: string;
}

const columns: KanbanColumnDef[] = [
  { key: 'todo', label: 'Open', color: 'border-t-zinc-400', badgeColor: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300' },
  { key: 'in_progress', label: 'Claimed', color: 'border-t-blue-500', badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  { key: 'in_review', label: 'In Review', color: 'border-t-amber-500', badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  { key: 'done', label: 'Closed', color: 'border-t-green-500', badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
];

export function CommitmentKanban({ workspaceId, panoramaMode, workspaceNames }: CommitmentKanbanProps) {
  const { columns: kanbanColumns, counts, isLoading } = useKanbanCommitments(workspaceId);

  if (isLoading) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
        Loading commitments...
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((col) => {
        const items = kanbanColumns[col.key as keyof typeof kanbanColumns] || [];
        const count = counts[col.key as keyof typeof counts] || 0;

        return (
          <div key={col.key} className="space-y-2">
            <div className={cn('flex items-center gap-2 pb-2 border-t-2', col.color)}>
              <h3 className="text-sm font-medium pt-2">{col.label}</h3>
              <span className={cn('text-xs px-1.5 py-0.5 rounded-full mt-2', col.badgeColor)}>
                {count}
              </span>
            </div>

            <div className="space-y-2 min-h-[100px]">
              {items.length === 0 && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-4">
                  Empty
                </p>
              )}
              {items.slice(0, 20).map((commitment) => (
                <Card key={commitment.id} className="shadow-sm">
                  <CardContent className="p-3 space-y-1.5">
                    {panoramaMode && workspaceNames && (
                      <Badge variant="secondary" className="text-[10px]">
                        {workspaceNames.get(commitment.id.split('_')[0]) || 'unknown'}
                      </Badge>
                    )}
                    <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 truncate">
                      {commitment.id}
                    </p>
                    <p className="text-sm truncate">{commitment.body.split('\n')[0]}</p>
                    <div className="flex items-center justify-between">
                      {commitment.owner && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {commitment.owner}
                        </span>
                      )}
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-auto">
                        {relativeTime(commitment.ts)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
