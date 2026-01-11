'use client';

import { useMemo } from 'react';
import { useOperations } from './useOperations';
import { computeCommitments } from '@/lib/mentu/state';
import type { Commitment, CommitmentState, OperationRow, CapturePayload } from '@/lib/mentu/types';

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
  const { data: operations, isLoading, error, refetch } = useOperations(workspaceId);

  // Compute commitments from operations
  const commitments = useMemo(() => {
    if (!operations) return [];
    return computeCommitments(operations);
  }, [operations]);

  // Compute operation stats for debugging
  const operationStats = useMemo(() => {
    if (!operations) return null;
    const opCounts: Record<string, number> = {};
    operations.forEach((op: OperationRow) => {
      opCounts[op.op] = (opCounts[op.op] || 0) + 1;
    });
    return {
      total: operations.length,
      breakdown: opCounts,
      commitCount: opCounts['commit'] || 0,
      submitCount: opCounts['submit'] || 0,
    };
  }, [operations]);

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

  // Compute bug report commitment IDs (commitments sourced from bug/bug_report memories)
  const bugReportCommitmentIds = useMemo(() => {
    if (!operations) return new Set<string>();

    // Build a set of memory IDs that are bug reports
    const bugMemoryIds = new Set<string>();
    operations.forEach((op: OperationRow) => {
      if (op.op === 'capture') {
        const payload = op.payload as CapturePayload;
        if (payload?.kind === 'bug' || payload?.kind === 'bug_report') {
          bugMemoryIds.add(op.id);
        }
      }
    });

    // Find commitments that have a bug memory as source
    const bugCommitmentIds = new Set<string>();
    commitments.forEach((c: Commitment) => {
      if (c.source && bugMemoryIds.has(c.source)) {
        bugCommitmentIds.add(c.id);
      }
    });

    return bugCommitmentIds;
  }, [operations, commitments]);

  return {
    columns,
    counts,
    operationStats,
    bugReportCommitmentIds,
    isLoading,
    error,
    refetch,
  };
}
