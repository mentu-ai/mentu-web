'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { ActorMapping } from '@/lib/mentu/types';

export function useActorMappings(workspaceId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['actor-mappings', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('actor_mappings')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ActorMapping[];
    },
    enabled: !!workspaceId,
  });
}

export function useCreateActorMapping() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (mapping: {
      workspace_id: string;
      external_system: string;
      external_id: string;
      mentu_actor: string;
    }) => {
      const { data, error } = await supabase
        .from('actor_mappings')
        .insert(mapping as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['actor-mappings', variables.workspace_id],
      });
    },
  });
}

export function useDeleteActorMapping() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const { error } = await supabase
        .from('actor_mappings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, workspaceId };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({
        queryKey: ['actor-mappings', variables.workspaceId],
      });
    },
  });
}
