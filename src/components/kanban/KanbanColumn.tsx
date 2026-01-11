'use client';

import type { Commitment } from '@/lib/mentu/types';
import type { KanbanColumn as KanbanColumnType } from '@/hooks/useKanbanCommitments';
import { CommitmentCard } from './CommitmentCard';
import { cn } from '@/lib/utils';

interface ColumnConfig {
  title: string;
  color: string;
  bgColor: string;
}

const columnConfig: Record<KanbanColumnType, ColumnConfig> = {
  todo: {
    title: 'To Do',
    color: 'text-zinc-600 dark:text-zinc-400',
    bgColor: 'bg-zinc-100 dark:bg-zinc-800',
  },
  in_progress: {
    title: 'In Progress',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  in_review: {
    title: 'In Review',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
  },
  done: {
    title: 'Done',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
  },
  cancelled: {
    title: 'Cancelled',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
};

interface KanbanColumnProps {
  column: KanbanColumnType;
  commitments: Commitment[];
  selectedId: string | null;
  onCardClick: (id: string) => void;
  runningCommitmentIds?: string[];
  bugReportCommitmentIds?: Set<string>;
}

export function KanbanColumn({
  column,
  commitments,
  selectedId,
  onCardClick,
  runningCommitmentIds = [],
  bugReportCommitmentIds = new Set(),
}: KanbanColumnProps) {
  const config = columnConfig[column];

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] flex-1">
      {/* Column header */}
      <div className={cn('px-3 py-2 rounded-t-lg', config.bgColor)}>
        <div className="flex items-center justify-between">
          <h3 className={cn('font-semibold text-sm', config.color)}>
            {config.title}
          </h3>
          <span className={cn('text-xs font-medium', config.color)}>
            {commitments.length}
          </span>
        </div>
      </div>

      {/* Cards container */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-lg border border-t-0 border-zinc-200 dark:border-zinc-800 min-h-[200px]">
        {commitments.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-xs text-zinc-400 dark:text-zinc-600">
            No commitments
          </div>
        ) : (
          commitments.map((commitment) => (
            <CommitmentCard
              key={commitment.id}
              commitment={commitment}
              isSelected={selectedId === commitment.id}
              isRunning={runningCommitmentIds.includes(commitment.id)}
              isBugReport={bugReportCommitmentIds.has(commitment.id)}
              onClick={() => onCardClick(commitment.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
