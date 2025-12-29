'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { BridgeMachine } from '@/lib/mentu/types';

export function useBridgeMachines(workspaceId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['bridge-machines', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('bridge_machines')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as BridgeMachine[];
    },
    enabled: !!workspaceId,
  });
}
