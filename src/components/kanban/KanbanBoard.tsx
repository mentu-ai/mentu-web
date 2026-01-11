'use client';

import type { KanbanColumns, KanbanColumn as KanbanColumnType } from '@/hooks/useKanbanCommitments';
import { KanbanColumn } from './KanbanColumn';

const COLUMN_ORDER: KanbanColumnType[] = ['todo', 'in_progress', 'in_review', 'done', 'cancelled'];

interface KanbanBoardProps {
  columns: KanbanColumns;
  selectedId: string | null;
  onCardClick: (id: string) => void;
  runningCommitmentIds?: string[];
  bugReportCommitmentIds?: Set<string>;
}

export function KanbanBoard({ columns, selectedId, onCardClick, runningCommitmentIds = [], bugReportCommitmentIds = new Set() }: KanbanBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMN_ORDER.map((column) => (
        <KanbanColumn
          key={column}
          column={column}
          commitments={columns[column]}
          selectedId={selectedId}
          onCardClick={onCardClick}
          runningCommitmentIds={runningCommitmentIds}
          bugReportCommitmentIds={bugReportCommitmentIds}
        />
      ))}
    </div>
  );
}
