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

      // Fetch all operations (Supabase default limit is 1000)
      // Use a high limit to get all - for very large datasets, implement pagination
      const { data, error } = await supabase
        .from('operations')
        .select('*', { count: 'exact' })
        .eq('workspace_id', workspaceId)
        .order('synced_at', { ascending: true })
        .limit(10000);

      if (error) throw error;
      return (data || []) as unknown as OperationRow[];
    },
    enabled: !!workspaceId,
    staleTime: Infinity, // Realtime handles updates
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
