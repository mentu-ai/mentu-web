import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { processUserMessage } from '../claude/streaming.js';
import { getOrCreateConversation } from '../db/conversations.js';
import { saveMessage } from '../db/messages.js';
import type { WSMessage, WSUserMessage } from './types.js';

export function handleConnection(ws: WebSocket): void {
  let conversationId: string | null = null;

  ws.on('message', async (data) => {
    try {
      const message: WSMessage = JSON.parse(data.toString());

      switch (message.type) {
        case 'user_message': {
          const userMsg = message as WSUserMessage;

          // Get or create conversation
          if (!conversationId) {
            conversationId = userMsg.conversation_id || uuidv4();
            await getOrCreateConversation(conversationId);
          }

          // Save user message
          await saveMessage({
            id: uuidv4(),
            conversation_id: conversationId,
            role: 'user',
            content: userMsg.data.content,
          });

          // Process with Claude and stream response
          await processUserMessage(ws, conversationId, userMsg.data.content);
          break;
        }

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendError(ws, conversationId || 'unknown', 'Failed to process message');
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
}

function sendError(ws: WebSocket, conversationId: string, message: string): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'error',
      conversation_id: conversationId,
      data: { message },
    }));
  }
}
