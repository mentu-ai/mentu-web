'use client';

import { useQuery } from '@tanstack/react-query';
import type { CommitmentDiff } from '@/types/diff';

/**
 * Configuration for diff API connection.
 * In development, the mentu-ai server runs locally.
 * In production, this would need to be configured or disabled.
 */
const DIFF_API_BASE = process.env.NEXT_PUBLIC_MENTU_API_URL || 'http://localhost:3001';

/**
 * Fetch diff data for a commitment.
 */
async function fetchDiff(commitmentId: string): Promise<CommitmentDiff | null> {
  try {
    const response = await fetch(`${DIFF_API_BASE}/diff/${commitmentId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch diff: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    // API not available - return null gracefully
    console.warn('Diff API not available:', error);
    return null;
  }
}

/**
 * Hook to fetch diff data for a commitment's worktree.
 *
 * @param commitmentId - The commitment ID (cmt_xxxxxxxx)
 * @param options - Query options
 * @returns Query result with diff data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useDiff('cmt_abc12345');
 * if (data?.files.length) {
 *   // Render diff viewer
 * }
 * ```
 */
export function useDiff(
  commitmentId: string | undefined,
  options?: {
    /** Polling interval in ms (default: 5000). Set to false to disable. */
    refetchInterval?: number | false;
    /** Whether to enable the query (default: true when commitmentId provided) */
    enabled?: boolean;
  }
) {
  const {
    refetchInterval = 5000,
    enabled = !!commitmentId,
  } = options || {};

  return useQuery<CommitmentDiff | null>({
    queryKey: ['diff', commitmentId],
    queryFn: () => fetchDiff(commitmentId!),
    enabled: enabled && !!commitmentId,
    refetchInterval: refetchInterval,
    staleTime: 2000,
    // Don't retry on network errors (API may not be available)
    retry: false,
    // Return stale data immediately while revalidating
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Check if the diff API is available.
 * Useful for conditionally showing the diff viewer.
 */
export function useDiffApiStatus() {
  return useQuery<boolean>({
    queryKey: ['diff', 'api-status'],
    queryFn: async () => {
      try {
        const response = await fetch(`${DIFF_API_BASE}/health`, {
          method: 'GET',
        });
        return response.ok;
      } catch {
        return false;
      }
    },
    staleTime: 30000, // Check every 30 seconds
    retry: false,
  });
}
