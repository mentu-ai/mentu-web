import type { AgentMessage } from '../db/messages.js';
import { getConversationMessages } from '../db/messages.js';

/**
 * Format for Claude Agent SDK resume messages
 * The SDK uses a simplified format for conversation context
 */
export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Options for history retrieval
 */
export interface HistoryOptions {
  /** Maximum number of message pairs to include (default: 20) */
  maxPairs?: number;
  /** Maximum estimated characters to include (default: 100000) */
  maxChars?: number;
}

const DEFAULT_MAX_PAIRS = 20;
const DEFAULT_MAX_CHARS = 100000;

/**
 * Fetch and format conversation history for Claude
 *
 * Retrieves messages from Supabase and formats them for the Agent SDK.
 * Tool use/result messages are collapsed into the assistant message content.
 */
export async function getConversationHistory(
  conversationId: string,
  options: HistoryOptions = {}
): Promise<HistoryMessage[]> {
  // Fetch only recent messages from DB (performance optimization)
  // Max 20 pairs × ~4 messages per pair (user, assistant, tool_use, tool_result) = 80
  // Add buffer to 100 to ensure we have enough after filtering
  const messages = await getConversationMessages(conversationId, 100);

  if (messages.length === 0) {
    return [];
  }

  // Filter to user and assistant messages only
  // Tool use/result are considered part of the assistant's turn
  const formatted = formatMessagesForSDK(messages);

  // Apply limits
  return truncateHistory(formatted, options);
}

/**
 * Format database messages to SDK format
 *
 * Combines tool_use and tool_result into assistant messages
 * since they represent the assistant's reasoning process
 */
function formatMessagesForSDK(messages: AgentMessage[]): HistoryMessage[] {
  const result: HistoryMessage[] = [];
  let currentAssistantContent = '';
  let inAssistantTurn = false;

  for (const msg of messages) {
    switch (msg.role) {
      case 'user':
        // Flush any pending assistant content
        if (inAssistantTurn && currentAssistantContent) {
          result.push({ role: 'assistant', content: currentAssistantContent.trim() });
          currentAssistantContent = '';
        }
        inAssistantTurn = false;
        result.push({ role: 'user', content: msg.content });
        break;

      case 'assistant':
        inAssistantTurn = true;
        currentAssistantContent += msg.content + '\n';
        break;

      case 'tool_use':
        // Include tool usage in assistant context
        inAssistantTurn = true;
        if (msg.tool_name) {
          currentAssistantContent += `[Used tool: ${msg.tool_name}]\n`;
        }
        break;

      case 'tool_result':
        // Include abbreviated tool results
        inAssistantTurn = true;
        if (msg.content) {
          const abbreviated = abbreviateToolResult(msg.content);
          currentAssistantContent += `[Tool result: ${abbreviated}]\n`;
        }
        break;

      case 'system':
        // Skip system messages - handled separately via systemPrompt
        break;
    }
  }

  // Flush final assistant content
  if (inAssistantTurn && currentAssistantContent) {
    result.push({ role: 'assistant', content: currentAssistantContent.trim() });
  }

  return result;
}

/**
 * Abbreviate long tool results to save context space
 */
function abbreviateToolResult(content: string, maxLength = 500): string {
  if (content.length <= maxLength) {
    return content;
  }
  return content.slice(0, maxLength) + '... [truncated]';
}

/**
 * Truncate history to fit within limits
 *
 * Keeps the most recent messages, ensuring user/assistant pairs
 * are not split
 */
function truncateHistory(
  messages: HistoryMessage[],
  options: HistoryOptions
): HistoryMessage[] {
  const maxPairs = options.maxPairs ?? DEFAULT_MAX_PAIRS;
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;

  // Start from most recent, work backwards
  const result: HistoryMessage[] = [];
  let totalChars = 0;
  let pairs = 0;

  // Process in reverse to keep most recent
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const msgChars = msg.content.length;

    // Check limits
    if (pairs >= maxPairs * 2) break; // maxPairs * 2 because each pair is 2 messages
    if (totalChars + msgChars > maxChars) break;

    result.unshift(msg);
    totalChars += msgChars;
    pairs++;
  }

  // Ensure we start with a user message for proper context
  while (result.length > 0 && result[0].role !== 'user') {
    result.shift();
  }

  return result;
}

/**
 * Build the prompt with history context
 *
 * Creates a combined prompt that includes conversation history
 * followed by the new user message
 */
export function buildPromptWithHistory(
  currentMessage: string,
  history: HistoryMessage[]
): string {
  if (history.length === 0) {
    return currentMessage;
  }

  // Build context section
  const contextParts: string[] = [
    '<conversation_history>',
  ];

  for (const msg of history) {
    const role = msg.role === 'user' ? 'Human' : 'Assistant';
    contextParts.push(`${role}: ${msg.content}`);
  }

  contextParts.push('</conversation_history>');
  contextParts.push('');
  contextParts.push('Continue the conversation. The human says:');
  contextParts.push(currentMessage);

  return contextParts.join('\n');
}
