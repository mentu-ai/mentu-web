// Chat message types
export type MessageRole = 'user' | 'assistant' | 'tool_use' | 'tool_result' | 'system';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_output?: string;
  timestamp: string;
  streaming?: boolean;
}

export interface Conversation {
  id: string;
  workspace_id: string;
  title: string;
  commitment_id?: string;
  created_at: string;
  updated_at: string;
}

// WebSocket message types
export type WSMessageType =
  | 'user_message'
  | 'assistant_chunk'
  | 'tool_use'
  | 'tool_result'
  | 'error'
  | 'done';

export interface WSMessage {
  type: WSMessageType;
  conversation_id: string;
  data: unknown;
}

export interface WSUserMessage {
  type: 'user_message';
  conversation_id: string;
  data: { content: string };
}

export interface WSAssistantChunk {
  type: 'assistant_chunk';
  conversation_id: string;
  data: { delta: string; message_id?: string };
}

export interface WSToolUse {
  type: 'tool_use';
  conversation_id: string;
  data: {
    tool_call_id: string;
    tool: string;
    input: Record<string, unknown>;
  };
}

export interface WSToolResult {
  type: 'tool_result';
  conversation_id: string;
  data: {
    tool_call_id: string;
    output: string;
    is_error?: boolean;
  };
}

export interface WSDone {
  type: 'done';
  conversation_id: string;
  data: { message_id: string };
}

export interface WSError {
  type: 'error';
  conversation_id: string;
  data: { message: string; code?: string };
}

// Connection state
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
