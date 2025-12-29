'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { WebhookLog } from '@/lib/mentu/types';

export function useWebhookLogs(workspaceId: string | undefined, limit = 50) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['webhook-logs', workspaceId, limit],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('received_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as WebhookLog[];
    },
    enabled: !!workspaceId,
  });
}
