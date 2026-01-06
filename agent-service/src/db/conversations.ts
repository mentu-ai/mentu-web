import { supabase } from './supabase.js';

export interface Conversation {
  id: string;
  workspace_id: string;
  title: string;
  commitment_id?: string;
  created_at: string;
  updated_at: string;
}

export async function getOrCreateConversation(id: string): Promise<Conversation> {
  // Try to get existing conversation
  const { data: existing } = await supabase
    .from('agent_conversations')
    .select('*')
    .eq('id', id)
    .single();

  if (existing) {
    return existing as Conversation;
  }

  // Create new conversation
  const { data, error } = await supabase
    .from('agent_conversations')
    .insert({
      id,
      workspace_id: 'default', // TODO: Get from context
      title: 'New Conversation',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create conversation: ${error.message}`);
  }

  return data as Conversation;
}

export async function updateConversationTitle(
  id: string,
  title: string
): Promise<void> {
  await supabase
    .from('agent_conversations')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', id);
}
