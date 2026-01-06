'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAgentChatContext } from '@/contexts/AgentChatContext';
import type {
  WSMessage,
  WSAssistantChunk,
  WSToolUse,
  WSToolResult,
  WSError,
  ChatMessage
} from '@/lib/agent/types';

const AGENT_WS_URL = process.env.NEXT_PUBLIC_AGENT_WS_URL || 'wss://api.mentu.ai/agent';
const RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

export function useAgentChat() {
  const {
    status,
    setStatus,
    conversation,
    addMessage,
    updateMessage,
    setIsStreaming,
  } = useAgentChatContext();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const currentMessageIdRef = useRef<string | null>(null);
  const currentContentRef = useRef('');

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
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus('connecting');

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

      // Exponential backoff reconnect
      const delay = Math.min(
        RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current),
        MAX_RECONNECT_DELAY
      );
      reconnectAttempts.current++;
      setTimeout(connect, delay);
    };

    ws.onerror = () => {
      setStatus('error');
    };
  }, [setStatus, handleMessage]);

  const sendMessage = useCallback((content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    if (!conversation) {
      console.error('No active conversation');
      return;
    }

    // Add user message to UI immediately
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      conversation_id: conversation.id,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg);

    // Send to server
    wsRef.current.send(JSON.stringify({
      type: 'user_message',
      conversation_id: conversation.id,
      data: { content },
    }));
  }, [conversation, addMessage]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Auto-connect when conversation is set
  useEffect(() => {
    if (conversation && status === 'disconnected') {
      connect();
    }

    return () => {
      // Don't disconnect on unmount - let it reconnect
    };
  }, [conversation, status, connect]);

  return {
    status,
    connect,
    disconnect,
    sendMessage,
  };
}
