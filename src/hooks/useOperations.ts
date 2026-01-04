'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { OperationRow } from '@/lib/mentu/types';

export function useOperations(workspaceId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['operations', workspaceId, 'v2'],
    queryFn: async () => {
      if (!workspaceId) return [];

      console.log('[useOperations] Fetching operations for workspace:', workspaceId);

      // Fetch all operations (Supabase default limit is 1000)
      // Use a high limit to get all - for very large datasets, implement pagination
      const { data, error, count } = await supabase
        .from('operations')
        .select('*', { count: 'exact' })
        .eq('workspace_id', workspaceId)
        .order('synced_at', { ascending: true })
        .limit(10000);

      if (error) {
        console.error('[useOperations] Error fetching:', error);
        throw error;
      }

      console.log('[useOperations] Fetched', data?.length, 'operations (total count:', count, ')');

      // Log operation breakdown
      const opCounts: Record<string, number> = {};
      (data || []).forEach((op: OperationRow) => {
        opCounts[op.op] = (opCounts[op.op] || 0) + 1;
      });
      console.log('[useOperations] Operation breakdown:', opCounts);

      return (data || []) as unknown as OperationRow[];
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
