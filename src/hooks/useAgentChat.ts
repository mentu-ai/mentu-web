'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAgentChatContext } from '@/contexts/AgentChatContext';
import type {
  WSMessage,
  WSAssistantChunk,
  WSToolUse,
  WSToolResult,
  WSError,
  ChatMessage,
  Conversation
} from '@/lib/agent/types';

const AGENT_WS_URL = process.env.NEXT_PUBLIC_AGENT_WS_URL || '';
const RECONNECT_DELAY = 5000;
const MAX_RECONNECT_DELAY = 60000;
const MAX_RECONNECT_ATTEMPTS = 5;

export function useAgentChat() {
  const {
    isOpen,
    status,
    setStatus,
    conversation,
    setConversation,
    addMessage,
    updateMessage,
    setIsStreaming,
  } = useAgentChatContext();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const currentMessageIdRef = useRef<string | null>(null);
  const currentContentRef = useRef('');
  const conversationIdRef = useRef<string | null>(conversation?.id || null);

  // Keep ref in sync with state
  if (conversation?.id && conversationIdRef.current !== conversation.id) {
    conversationIdRef.current = conversation.id;
  }

  const handleMessage = useCallback((msg: WSMessage) => {
    switch (msg.type) {
      case 'assistant_chunk': {
        const chunk = msg as WSAssistantChunk;
        setIsStreaming(true);

        if (!currentMessageIdRef.current) {
          // Start new assistant message
          const newId = chunk.data.message_id || `msg_${Date.now()}`;
          currentMessageIdRef.current = newId;
          currentContentRef.current = chunk.data.delta;

          addMessage({
            id: newId,
            conversation_id: msg.conversation_id,
            role: 'assistant',
            content: chunk.data.delta,
            timestamp: new Date().toISOString(),
            streaming: true,
          });
        } else {
          // Append to existing message
          currentContentRef.current += chunk.data.delta;
          updateMessage(currentMessageIdRef.current, {
            content: currentContentRef.current,
          });
        }
        break;
      }

      case 'tool_use': {
        const toolUse = msg as WSToolUse;
        addMessage({
          id: toolUse.data.tool_call_id,
          conversation_id: msg.conversation_id,
          role: 'tool_use',
          content: '',
          tool_name: toolUse.data.tool,
          tool_input: toolUse.data.input,
          timestamp: new Date().toISOString(),
        });
        break;
      }

      case 'tool_result': {
        const toolResult = msg as WSToolResult;
        addMessage({
          id: `result_${toolResult.data.tool_call_id}`,
          conversation_id: msg.conversation_id,
          role: 'tool_result',
          content: toolResult.data.output,
          timestamp: new Date().toISOString(),
        });
        break;
      }

      case 'done': {
        setIsStreaming(false);
        if (currentMessageIdRef.current) {
          updateMessage(currentMessageIdRef.current, { streaming: false });
        }
        currentMessageIdRef.current = null;
        currentContentRef.current = '';
        break;
      }

      case 'error': {
        const error = msg as WSError;
        setIsStreaming(false);
        addMessage({
          id: `error_${Date.now()}`,
          conversation_id: msg.conversation_id,
          role: 'system',
          content: `Error: ${error.data.message}`,
          timestamp: new Date().toISOString(),
        });
        currentMessageIdRef.current = null;
        currentContentRef.current = '';
        break;
      }
    }
  }, [addMessage, updateMessage, setIsStreaming]);

  const connect = useCallback(() => {
    // Don't connect if no URL configured
    if (!AGENT_WS_URL) {
      console.log('Agent WebSocket URL not configured');
      setStatus('disconnected');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return;

    // Stop after max attempts
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
      console.log('Max reconnect attempts reached');
      setStatus('error');
      return;
    }

    setStatus('connecting');

    // Create a conversation if we don't have one
    if (!conversationIdRef.current) {
      const newConversation: Conversation = {
        id: crypto.randomUUID(),
        workspace_id: 'default',
        title: 'New Chat',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      conversationIdRef.current = newConversation.id;
      setConversation(newConversation);
    }

    try {
      const ws = new WebSocket(AGENT_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          handleMessage(msg);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        setStatus('disconnected');
        wsRef.current = null;

        // Only reconnect if panel is still open and under max attempts
        if (isOpen && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(
            RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current),
            MAX_RECONNECT_DELAY
          );
          reconnectAttempts.current++;
          setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        // Don't log error, just let onclose handle reconnect
        setStatus('error');
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setStatus('error');
    }
  }, [setStatus, handleMessage, setConversation, isOpen]);

  const sendMessage = useCallback((content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    const convId = conversationIdRef.current;
    if (!convId) {
      console.error('No active conversation');
      return;
    }

    // Add user message to UI immediately
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      conversation_id: convId,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg);

    // Send to server
    wsRef.current.send(JSON.stringify({
      type: 'user_message',
      conversation_id: convId,
      data: { content },
    }));
  }, [addMessage]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Auto-connect when panel opens
  useEffect(() => {
    if (isOpen && status === 'disconnected') {
      connect();
    }

    // Disconnect when panel closes
    if (!isOpen && wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      reconnectAttempts.current = 0;
    }
  }, [isOpen, status, connect]);

  return {
    status,
    connect,
    disconnect,
    sendMessage,
  };
}
