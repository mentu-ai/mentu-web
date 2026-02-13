'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { OperationRow } from '@/lib/mentu/types';

const PAGE_SIZE = 1000; // Supabase default limit

/**
 * Fetch all operations with pagination to overcome Supabase's 1000 row limit
 */
async function fetchAllOperations(supabase: ReturnType<typeof createClient>, workspaceId: string): Promise<OperationRow[]> {
  const allOperations: OperationRow[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('operations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('synced_at', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error('[useOperations] Error fetching page at offset', offset, ':', error);
      throw error;
    }

    if (data && data.length > 0) {
      allOperations.push(...(data as unknown as OperationRow[]));
      offset += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE; // If we got less than PAGE_SIZE, we're done
    } else {
      hasMore = false;
    }
  }

  return allOperations;
}

export function useOperations(workspaceId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['operations', workspaceId, 'v2'],
    queryFn: async () => {
      if (!workspaceId) return [];

      // Use pagination to fetch ALL operations
      const data = await fetchAllOperations(supabase, workspaceId);

      return data;
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes - realtime handles incremental updates
    refetchOnMount: 'always', // Always refetch on mount to ensure fresh data
  });
}

export function useRecentOperations(workspaceId: string | undefined, limit = 10) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['operations', workspaceId, 'recent', limit],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('operations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('synced_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as unknown as OperationRow[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateOperation() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (operation: {
      id: string;
      workspace_id: string;
      op: string;
      ts: string;
      actor: string;
      payload: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from('operations')
        .insert(operation as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate operations queries for this workspace
      queryClient.invalidateQueries({
        queryKey: ['operations', variables.workspace_id],
      });
    },
  });
}
