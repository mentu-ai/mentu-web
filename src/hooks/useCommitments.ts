'use client';

import { useMemo } from 'react';
import { useOperations } from './useOperations';
import { computeCommitments, getCommitment } from '@/lib/mentu/state';

export function useCommitments(workspaceId: string | undefined) {
  const { data: operations, isLoading, error, refetch } = useOperations(workspaceId);

  const commitments = useMemo(() => {
    if (!operations) {
      console.log('[useCommitments] No operations yet');
      return [];
    }
    const computed = computeCommitments(operations);

    // Log state breakdown
    const stateCounts: Record<string, number> = {};
    computed.forEach(c => {
      stateCounts[c.state] = (stateCounts[c.state] || 0) + 1;
    });
    console.log('[useCommitments] Computed', computed.length, 'commitments:', stateCounts);

    // Log in_review commitments specifically
    const inReview = computed.filter(c => c.state === 'in_review');
    if (inReview.length > 0) {
      console.log('[useCommitments] In Review commitments:', inReview.map(c => ({ id: c.id, body: c.body.substring(0, 50) })));
    }

    return computed;
  }, [operations]);

  return {
    commitments,
    isLoading,
    error,
    refetch,
  };
}

export function useCommitment(workspaceId: string | undefined, commitmentId: string) {
  const { data: operations, isLoading, error, refetch } = useOperations(workspaceId);

  const commitment = useMemo(() => {
    if (!operations) return null;
    return getCommitment(operations, commitmentId);
  }, [operations, commitmentId]);

  return {
    commitment,
    operations,
    isLoading,
    error,
    refetch,
  };
}
