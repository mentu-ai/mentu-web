'use client';

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import type { ChatMessage, Conversation, ConnectionStatus } from '@/lib/agent/types';

interface AgentChatContextValue {
  // Panel state
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;

  // Connection state
  status: ConnectionStatus;
  setStatus: (status: ConnectionStatus) => void;

  // Conversation state
  conversation: Conversation | null;
  setConversation: (conv: Conversation | null) => void;

  // Messages
  messages: ChatMessage[];
  setMessages: (msgs: ChatMessage[]) => void;
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;

  // Streaming state
  isStreaming: boolean;
  setIsStreaming: (streaming: boolean) => void;
}

const AgentChatContext = createContext<AgentChatContextValue | null>(null);

export function AgentChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(msg =>
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  }, []);

  const value = useMemo(() => ({
    isOpen,
    toggle,
    open,
    close,
    status,
    setStatus,
    conversation,
    setConversation,
    messages,
    setMessages,
    addMessage,
    updateMessage,
    isStreaming,
    setIsStreaming,
  }), [
    isOpen, toggle, open, close,
    status, conversation, messages, isStreaming,
    addMessage, updateMessage
  ]);

  return (
    <AgentChatContext.Provider value={value}>
      {children}
    </AgentChatContext.Provider>
  );
}

export function useAgentChatContext() {
  const context = useContext(AgentChatContext);
  if (!context) {
    throw new Error('useAgentChatContext must be used within AgentChatProvider');
  }
  return context;
}
