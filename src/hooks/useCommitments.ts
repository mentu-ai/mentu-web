'use client';

import { useMemo } from 'react';
import { useOperations } from './useOperations';
import { computeCommitments, getCommitment } from '@/lib/mentu/state';

export function useCommitments(workspaceId: string | undefined) {
  const { data: operations, isLoading, error, refetch } = useOperations(workspaceId);

  const commitments = useMemo(() => {
    if (!operations) return [];
    return computeCommitments(operations);
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
