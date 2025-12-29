'use client';

import { useMemo } from 'react';
import { useOperations } from './useOperations';
import { computeMemories, getMemory } from '@/lib/mentu/state';

export function useMemories(workspaceId: string | undefined) {
  const { data: operations, isLoading, error, refetch } = useOperations(workspaceId);

  const memories = useMemo(() => {
    if (!operations) return [];
    return computeMemories(operations);
  }, [operations]);

  return {
    memories,
    isLoading,
    error,
    refetch,
  };
}

export function useMemory(workspaceId: string | undefined, memoryId: string) {
  const { data: operations, isLoading, error, refetch } = useOperations(workspaceId);

  const memory = useMemo(() => {
    if (!operations) return null;
    return getMemory(operations, memoryId);
  }, [operations, memoryId]);

  return {
    memory,
    operations,
    isLoading,
    error,
    refetch,
  };
}
