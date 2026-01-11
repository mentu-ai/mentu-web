import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { createAgentQuery } from './client.js';
import { saveMessage } from '../db/messages.js';
import { agentLogger } from '../utils/logger.js';
import type { WSAssistantChunk, WSToolUse, WSToolResult, WSDone } from '../websocket/types.js';

export async function processUserMessage(
  ws: WebSocket,
  conversationId: string,
  content: string,
  requestId?: string
): Promise<void> {
  const messageId = uuidv4();
  let fullContent = '';
  let toolCallCount = 0;
  const startTime = Date.now();

  try {
    // Use Agent SDK query - it handles the agentic loop automatically
    // Authentication uses CLAUDE_CODE_OAUTH_TOKEN from Claude Code's auth
    const agentStream = createAgentQuery(content);

    for await (const message of agentStream) {
      // Handle different message types from Agent SDK
      if (message.type === 'assistant') {
        // Assistant message with content blocks
        if (message.message?.content) {
          for (const block of message.message.content) {
            if ('text' in block && block.text) {
              fullContent += block.text;

              // Stream text chunk to client
              sendToClient<WSAssistantChunk>(ws, {
                type: 'assistant_chunk',
                conversation_id: conversationId,
                data: { delta: block.text, message_id: messageId },
              });
            } else if ('name' in block) {
              // Tool use block
              toolCallCount++;
              const toolId = 'id' in block ? block.id : uuidv4();

              agentLogger.debug('Tool use', {
                conversationId,
                requestId,
                metadata: { tool: block.name, toolId, callNumber: toolCallCount },
              });

              sendToClient<WSToolUse>(ws, {
                type: 'tool_use',
                conversation_id: conversationId,
                data: {
                  tool_call_id: toolId,
                  tool: block.name,
                  input: 'input' in block ? block.input as Record<string, unknown> : {},
                },
              });

              // Save tool use to DB
              await saveMessage({
                id: toolId,
                conversation_id: conversationId,
                role: 'tool_use',
                content: '',
                tool_name: block.name,
                tool_input: 'input' in block ? block.input as Record<string, unknown> : {},
              });
            }
          }
        }
      } else if (message.type === 'user') {
        // Tool result from Agent SDK (it handles tool execution internally)
        if (message.message?.content) {
          for (const block of message.message.content) {
            if ('type' in block && block.type === 'tool_result') {
              const toolResultBlock = block as { tool_use_id: string; content: string };

              sendToClient<WSToolResult>(ws, {
                type: 'tool_result',
                conversation_id: conversationId,
                data: {
                  tool_call_id: toolResultBlock.tool_use_id,
                  output: typeof toolResultBlock.content === 'string'
                    ? toolResultBlock.content
                    : JSON.stringify(toolResultBlock.content),
                  is_error: false,
                },
              });

              // Save tool result to DB
              await saveMessage({
                id: `result_${toolResultBlock.tool_use_id}`,
                conversation_id: conversationId,
                role: 'tool_result',
                content: typeof toolResultBlock.content === 'string'
                  ? toolResultBlock.content
                  : JSON.stringify(toolResultBlock.content),
              });
            }
          }
        }
      } else if (message.type === 'result') {
        // Final result from Agent SDK
        agentLogger.info('Agent completed', {
          conversationId,
          requestId,
          duration: Date.now() - startTime,
          metadata: {
            subtype: message.subtype,
            toolCallCount,
            responseLength: fullContent.length,
          },
        });
      }
    }

    // Save assistant message if we have content
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    agentLogger.error('Agent error', {
      conversationId,
      requestId,
      duration: Date.now() - startTime,
      metadata: {
        error: errorMessage,
        toolCallCount,
      },
    });

    // Handle common errors with user-friendly messages
    if (errorMessage.includes('Claude Code not found')) {
      sendToClient(ws, {
        type: 'error',
        conversation_id: conversationId,
        data: { message: 'Claude Code CLI not installed. Run: npm install -g @anthropic-ai/claude-code' },
      });
    } else if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
      sendToClient(ws, {
        type: 'error',
        conversation_id: conversationId,
        data: { message: 'Authentication failed. Run "claude" in terminal to authenticate with OAuth.' },
      });
    } else {
      sendToClient(ws, {
        type: 'error',
        conversation_id: conversationId,
        data: { message: `Failed to get response: ${errorMessage}` },
      });
    }
  }
}

function sendToClient<T extends { type: string }>(ws: WebSocket, message: T): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}
