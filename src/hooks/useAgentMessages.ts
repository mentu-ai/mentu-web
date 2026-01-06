'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { ChatMessage } from '@/lib/agent/types';

// Database row type for agent_messages (table may not exist yet)
interface AgentMessageRow {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_output?: string;
  created_at: string;
}

export function useAgentMessages(conversationId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['agent-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      // Use explicit type assertion since table may not exist in generated types yet
      const { data, error } = await supabase
        .from('agent_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true }) as unknown as {
          data: AgentMessageRow[] | null;
          error: Error | null;
        };

      if (error) throw error;

      // Map database rows to ChatMessage type
      return (data || []).map(row => ({
        id: row.id,
        conversation_id: row.conversation_id,
        role: row.role as ChatMessage['role'],
        content: row.content,
        tool_name: row.tool_name,
        tool_input: row.tool_input,
        tool_output: row.tool_output,
        timestamp: row.created_at,
      })) as ChatMessage[];
    },
    enabled: !!conversationId,
  });
}
