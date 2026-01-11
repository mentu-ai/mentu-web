import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { processUserMessage } from '../claude/streaming.js';
import { getOrCreateConversation } from '../db/conversations.js';
import { saveMessage } from '../db/messages.js';
import { checkRateLimit, getRateLimitStatus } from '../auth/rate-limiter.js';
import { agentLogger, generateRequestId } from '../utils/logger.js';
import type { WSMessage, WSUserMessage } from './types.js';
import type { AuthenticatedUser } from '../auth/verify.js';

// Fallback user for development mode
const DEV_USER: AuthenticatedUser = { id: 'dev_user', email: 'dev@localhost' };

export function handleConnection(ws: WebSocket, user?: AuthenticatedUser): void {
  let conversationId: string | null = null;
  const activeUser = user || DEV_USER;

  ws.on('message', async (data) => {
    const requestId = generateRequestId();
    const startTime = Date.now();

    try {
      const message: WSMessage = JSON.parse(data.toString());

      switch (message.type) {
        case 'user_message': {
          const userMsg = message as WSUserMessage;

          // Check rate limit
          const rateCheck = checkRateLimit(activeUser.id);
          if (!rateCheck.allowed) {
            agentLogger.warn('Rate limit exceeded', {
              userId: activeUser.id,
              requestId,
              metadata: {
                reason: rateCheck.reason,
                retryAfter: rateCheck.retryAfter,
                ...getRateLimitStatus(activeUser.id),
              },
            });
            sendError(ws, conversationId || 'unknown', rateCheck.reason || 'Rate limit exceeded', rateCheck.retryAfter);
            return;
          }

          // Get or create conversation
          if (!conversationId) {
            conversationId = userMsg.conversation_id || uuidv4();
            await getOrCreateConversation(conversationId);
          }

          agentLogger.info('Processing message', {
            userId: activeUser.id,
            conversationId,
            requestId,
            metadata: {
              contentLength: userMsg.data.content.length,
            },
          });

          // Save user message
          await saveMessage({
            id: uuidv4(),
            conversation_id: conversationId,
            role: 'user',
            content: userMsg.data.content,
          });

          // Process with Claude and stream response
          await processUserMessage(ws, conversationId, userMsg.data.content, requestId);

          agentLogger.info('Message processed', {
            userId: activeUser.id,
            conversationId,
            requestId,
            duration: Date.now() - startTime,
          });
          break;
        }

        case 'ping': {
          // Respond to ping for connection keep-alive
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
          break;
        }

        default:
          agentLogger.warn('Unknown message type', {
            userId: activeUser.id,
            requestId,
            metadata: { type: message.type },
          });
      }
    } catch (error) {
      agentLogger.error('Error handling message', {
        userId: activeUser.id,
        conversationId: conversationId || undefined,
        requestId,
        duration: Date.now() - startTime,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      sendError(ws, conversationId || 'unknown', 'Failed to process message');
    }
  });

  ws.on('error', (error) => {
    agentLogger.error('WebSocket error', {
      userId: activeUser.id,
      conversationId: conversationId || undefined,
      metadata: { error: error.message },
    });
  });
}

function sendError(ws: WebSocket, conversationId: string, message: string, retryAfter?: number): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'error',
      conversation_id: conversationId,
      data: { message, retryAfter },
    }));
  }
}
