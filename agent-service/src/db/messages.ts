import { supabase } from './supabase.js';

export interface AgentMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'tool_use' | 'tool_result' | 'system';
  content: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_output?: string;
  created_at?: string;
}

export async function saveMessage(message: Omit<AgentMessage, 'created_at'>): Promise<void> {
  const { error } = await supabase
    .from('agent_messages')
    .insert({
      ...message,
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Failed to save message:', error);
    throw new Error(`Failed to save message: ${error.message}`);
  }
}

export async function getConversationMessages(
  conversationId: string
): Promise<AgentMessage[]> {
  const { data, error } = await supabase
    .from('agent_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to get messages:', error);
    return [];
  }

  return (data || []) as AgentMessage[];
}
