// Types must match frontend exactly
export type MessageRole = 'user' | 'assistant' | 'tool_use' | 'tool_result' | 'system';

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
