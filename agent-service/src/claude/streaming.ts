import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import type Anthropic from '@anthropic-ai/sdk';
import { createMessageStream } from './client.js';
import { executeTool } from '../tools/registry.js';
import { getConversationMessages, saveMessage } from '../db/messages.js';
import type { WSAssistantChunk, WSToolUse, WSToolResult, WSDone } from '../websocket/types.js';

export async function processUserMessage(
  ws: WebSocket,
  conversationId: string,
  content: string
): Promise<void> {
  // Load conversation history
  const history = await getConversationMessages(conversationId);

  // Convert to Anthropic format
  const messages: Anthropic.MessageParam[] = history.map((msg) => {
    if (msg.role === 'tool_use') {
      return {
        role: 'assistant' as const,
        content: [{
          type: 'tool_use' as const,
          id: msg.id,
          name: msg.tool_name || 'unknown',
          input: msg.tool_input || {},
        }],
      };
    }
    if (msg.role === 'tool_result') {
      return {
        role: 'user' as const,
        content: [{
          type: 'tool_result' as const,
          tool_use_id: msg.id.replace('result_', ''),
          content: msg.content,
        }],
      };
    }
    return {
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content,
    };
  });

  // Add current user message
  messages.push({ role: 'user', content });

  // Process with Claude
  await streamClaudeResponse(ws, conversationId, messages);
}

async function streamClaudeResponse(
  ws: WebSocket,
  conversationId: string,
  messages: Anthropic.MessageParam[]
): Promise<void> {
  const messageId = uuidv4();
  let fullContent = '';

  try {
    const stream = await createMessageStream(messages);

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          const chunk = event.delta.text;
          fullContent += chunk;

          // Send chunk to client
          sendToClient<WSAssistantChunk>(ws, {
            type: 'assistant_chunk',
            conversation_id: conversationId,
            data: { delta: chunk, message_id: messageId },
          });
        }
      } else if (event.type === 'message_delta') {
        if (event.delta.stop_reason === 'tool_use') {
          // Handle tool uses
          const finalMessage = await stream.finalMessage();

          for (const block of finalMessage.content) {
            if (block.type === 'tool_use') {
              // Notify client of tool use
              sendToClient<WSToolUse>(ws, {
                type: 'tool_use',
                conversation_id: conversationId,
                data: {
                  tool_call_id: block.id,
                  tool: block.name,
                  input: block.input as Record<string, unknown>,
                },
              });

              // Save tool use to DB
              await saveMessage({
                id: block.id,
                conversation_id: conversationId,
                role: 'tool_use',
                content: '',
                tool_name: block.name,
                tool_input: block.input as Record<string, unknown>,
              });

              // Execute tool
              const result = await executeTool(block.name, block.input as Record<string, unknown>);

              // Notify client of result
              sendToClient<WSToolResult>(ws, {
                type: 'tool_result',
                conversation_id: conversationId,
                data: {
                  tool_call_id: block.id,
                  output: result.output,
                  is_error: result.is_error,
                },
              });

              // Save tool result to DB
              await saveMessage({
                id: `result_${block.id}`,
                conversation_id: conversationId,
                role: 'tool_result',
                content: result.output,
              });
            }
          }

          // Continue conversation with tool results
          const updatedHistory = await getConversationMessages(conversationId);
          const updatedMessages: Anthropic.MessageParam[] = updatedHistory.map((msg) => {
            if (msg.role === 'tool_use') {
              return {
                role: 'assistant' as const,
                content: [{
                  type: 'tool_use' as const,
                  id: msg.id,
                  name: msg.tool_name || 'unknown',
                  input: msg.tool_input || {},
                }],
              };
            }
            if (msg.role === 'tool_result') {
              return {
                role: 'user' as const,
                content: [{
                  type: 'tool_result' as const,
                  tool_use_id: msg.id.replace('result_', ''),
                  content: msg.content,
                }],
              };
            }
            return {
              role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
              content: msg.content,
            };
          });

          // Recursive call to continue processing
          await streamClaudeResponse(ws, conversationId, updatedMessages);
          return;
        }
      }
    }

    // Save assistant message
    if (fullContent) {
      await saveMessage({
        id: messageId,
        conversation_id: conversationId,
        role: 'assistant',
        content: fullContent,
      });
    }

    // Send done signal
    sendToClient<WSDone>(ws, {
      type: 'done',
      conversation_id: conversationId,
      data: { message_id: messageId },
    });
  } catch (error) {
    console.error('Error streaming Claude response:', error);
    sendToClient(ws, {
      type: 'error',
      conversation_id: conversationId,
      data: { message: 'Failed to get response from Claude' },
    });
  }
}

function sendToClient<T extends { type: string }>(ws: WebSocket, message: T): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}
