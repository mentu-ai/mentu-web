'use client';

import { useMemo } from 'react';
import { useCommitments } from './useCommitments';
import type { Commitment, CommitmentState } from '@/lib/mentu/types';

export type KanbanColumn = 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';

export interface KanbanColumns {
  todo: Commitment[];
  in_progress: Commitment[];
  in_review: Commitment[];
  done: Commitment[];
  cancelled: Commitment[];
}

/**
 * Maps commitment state to kanban column.
 */
export function stateToColumn(state: CommitmentState): KanbanColumn {
  switch (state) {
    case 'open':
      return 'todo';
    case 'claimed':
    case 'reopened':
      return 'in_progress';
    case 'in_review':
      return 'in_review';
    case 'closed':
      return 'done';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'todo';
  }
}

/**
 * Hook to get commitments grouped by kanban column.
 */
export function useKanbanCommitments(workspaceId: string | undefined) {
  const { commitments, isLoading, error, refetch } = useCommitments(workspaceId);

  const columns = useMemo<KanbanColumns>(() => {
    const result: KanbanColumns = {
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
      cancelled: [],
    };

    for (const commitment of commitments) {
      const column = stateToColumn(commitment.state);
      result[column].push(commitment);
    }

    // Sort each column by creation time (newest first for todo, oldest first for others)
    result.todo.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
    result.in_progress.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
    result.in_review.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
    result.done.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
    result.cancelled.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

    console.log('[useKanbanCommitments] Column counts:', {
      todo: result.todo.length,
      in_progress: result.in_progress.length,
      in_review: result.in_review.length,
      done: result.done.length,
      cancelled: result.cancelled.length,
    });

    return result;
  }, [commitments]);

  const counts = useMemo(() => ({
    todo: columns.todo.length,
    in_progress: columns.in_progress.length,
    in_review: columns.in_review.length,
    done: columns.done.length,
    cancelled: columns.cancelled.length,
    total: commitments.length,
  }), [columns, commitments.length]);

  return {
    columns,
    counts,
    isLoading,
    error,
    refetch,
  };
}
